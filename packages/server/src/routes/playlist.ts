import Router from '@koa/router';
import type { Playlist, Console, Logger } from '@lightshow/core';

export const playlistRouter = new Router();

playlistRouter.get('/playlist', async (ctx) => {
  const { playlist }: { playlist: Playlist } = ctx.state;
  ctx.body = playlist.tracks;
});
