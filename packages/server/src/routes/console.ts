import Router from '@koa/router';
import type { Console, Logger } from '@lightshow/core';

export const consoleRouter = new Router();

consoleRouter.get('/console/disable-notes', async (ctx) => {
  const { notes } = ctx.query;
  const { trackConsole }: { trackConsole: Console } = ctx.state;
  trackConsole.setDisabledNotes((notes as string).split(','));
  ctx.body = { disabled: notes };
});

consoleRouter.get('/console/track/play', async (ctx) => {
  const { track: trackName } = ctx.query;

  const { trackConsole, logger }: { trackConsole: Console; logger: Logger } =
    ctx.state;

  const track = trackConsole.playlist.getTrack(trackName as string);

  if (track) {
    trackConsole.loadTrack({ track });
    try {
      setTimeout(() => {
        trackConsole.playTrack();
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

consoleRouter.get('/console/track/load', async (ctx) => {
  const { track: trackName } = ctx.query;

  const { trackConsole, logger }: { trackConsole: Console; logger: Logger } =
    ctx.state;

  const track = trackConsole.playlist.getTrack(trackName as string);

  if (track) {
    trackConsole.loadTrack({ track, formats: ['midi'] });
    ctx.body = `Track loaded`;
  }
  ctx.body = `Track "${trackName}" not found.`;
});
