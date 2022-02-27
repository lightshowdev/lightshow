import Koa from 'koa';
import http from 'http';

import { Server as SocketIOServer } from 'socket.io';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import Preview from '@lightshow/preview';

import { Playlist, Console, Logger } from '@lightshow/core';

import SMSConroller, { SMSConfig } from '@lightshow/sms';

const { SMS_PROVIDER = 'none', TRACKS_PATH = '../../config/tracks' } =
  process.env;

const START_DELAY = parseInt(process.env.START_DELAY || '5000');

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

  router.get('/play', async (ctx) => {
    const { track: trackName } = ctx.query;
    const track = trackConsole.playlist.getTrack(trackName as string);

    if (track) {
      try {
        setTimeout(() => {
          trackConsole.playTrack({ track });
        });

        ctx.body = `Now playing "${track.name}" by ${track.artist}`;
      } catch (err: any) {
        logger.error(err);
        ctx.status = 400;
        ctx.body = err?.message;
      }

      return;
    }

    ctx.body = `Track "${trackName}" not found.`;
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

  router.get('/disable-notes', async (ctx) => {
    const { notes } = ctx.query;
    trackConsole.setDisabledNotes((notes as string).split(','));
    ctx.body = { disabled: notes };
  });

  if (smsController) {
    const webhookHandler = smsController.getWebhookHandler();
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

  app
    .use(bodyParser())
    .use(async (ctx, next) => {
      ctx.res.statusCode = 200;
      await next();
    })
    .use(router.routes());

  await server.listen(3000, '0.0.0.0');
  console.log('Service started');
})();
