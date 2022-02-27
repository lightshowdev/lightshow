import next from 'next';
import { NextServer } from 'next/dist/server/next';
import { resolve } from 'path';

export default class Preview {
  nextApp: NextServer;
  handler: ReturnType<NextServer['getRequestHandler']> = async () => await null;
  constructor() {
    this.nextApp = next({
      dev: process.env.NODE_ENV !== 'production',
      dir: resolve(`${__dirname}/..`),
    });
  }

  async prepare() {
    await this.nextApp.prepare();
    this.handler = this.nextApp.getRequestHandler();
  }
}
