import Router from '@koa/router';
import { getNoteNumber } from '@lightshow/core';
import type { Server as SocketIOServer } from 'socket.io';

export const diagnosticsRouter = new Router();

diagnosticsRouter.get('/diagnostics/io', async (ctx) => {
  const { io }: { io: SocketIOServer } = ctx.state;
  const { note, event, velocity, length, sameNotes, value } = ctx.query;

  if (note) {
    const notes = (note as string).split(',');
    notes.forEach((n) => {
      io.emit(
        event as string,
        n,
        getNoteNumber(n),
        length ? parseInt(length as string) : undefined,
        sameNotes ? (sameNotes as string).split(',') : undefined,
        parseInt((velocity as string) || '0')
      );
    });
  } else {
    const args = [];
    if (value) {
      args.push(value as string);
    }
    io.emit(event as string, ...args);
  }

  ctx.body = { event, note, velocity };
});
