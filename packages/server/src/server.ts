import Koa from 'koa';
import http from 'http';

import { Server as SocketIOServer } from 'socket.io';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import serve from 'koa-static';
import path from 'path';

import Preview from '@lightshow/preview';

import { Playlist, Console, Logger } from '@lightshow/core';

import SMSConroller, { SMSConfig } from '@lightshow/sms';

import { playlistRouter, consoleRouter } from './routes';

const { SMS_PROVIDER = 'none', TRACKS_PATH = '../../config/tracks' } =
  process.env;

const previewApp = new Preview();

(async () => {
  await previewApp.prepare();

  const playlist = new Playlist({ path: TRACKS_PATH });

  try {
    playlist.loadPlaylist();
  } catch (err) {
    console.error(err);
    return;
  }

  const app = new Koa();
  const router = new Router();
  const server = http.createServer(app.callback());
  const io = new SocketIOServer(server);
  const logger = new Logger({ level: '*' });

  const trackConsole = new Console({ io, playlist, logger });

  const smsController = SMSConroller({
    config: { provider: SMS_PROVIDER as SMSConfig['provider'] },
    console: trackConsole,
    logger,
  });

  router.get('/test-io', async (ctx) => {
    const { note, event, velocity, length, sameNotes } = ctx.query;

    if (note) {
      const notes = (note as string).split(',');
      notes.forEach((n) => {
        io.emit(
          event as string,
          n,
          parseInt((velocity as string) || '0'),
          length ? parseInt(length as string) : undefined,
          sameNotes ? (sameNotes as string).split(',') : undefined
        );
      });
    } else {
      io.emit(event as string);
    }

    ctx.body = { event, note, velocity };
  });

  if (smsController) {
    const webhookHandler = smsController.getWebhookHandler();
    logger.debug({
      msg: 'Registering SMS webhook route',
      path: webhookHandler.path,
    });
    router.register(
      webhookHandler.path,
      [webhookHandler.method],
      webhookHandler.handler
    );
  }

  router.all('(.*)', async (ctx) => {
    await previewApp.handler(ctx.req, ctx.res);
    ctx.respond = false;
  });

  playlistRouter.prefix('/api');
  consoleRouter.prefix('/api');

  app
    .use(bodyParser())
    .use(async (ctx, next) => {
      ctx.res.statusCode = 200;
      await next();
    })
    .use(async (ctx, next) => {
      ctx.state.playlist = playlist;
      ctx.state.logger = logger;
      ctx.state.trackConsole = trackConsole;
      await next();
    })
    .use(playlistRouter.routes())
    .use(consoleRouter.routes())
    .use(serve(path.resolve(TRACKS_PATH)))
    // this should be last
    .use(router.routes());

  await server.listen(3000, '0.0.0.0');
  console.log('Service started');
})();
