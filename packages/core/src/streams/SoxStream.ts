import { Writable } from 'stream';
import { ChildProcess, spawn } from 'child_process';

import type { PlayOptions } from './AudioStream';

export class SoxStream extends Writable {
  soxProcess: ChildProcess | null;
  soxPath: string = '/usr/local/bin/sox';
  playOptions?: PlayOptions;
  public currentTime: number = 0;

  constructor({ path, options }: { path?: string; options?: PlayOptions }) {
    super();
    this.soxProcess = null;
    if (path) {
      this.soxPath = path;
    }

    if (options) {
      this.playOptions = options;
    }
  }

  _construct(callback: Function) {
    const trimArgs = [];
    if (this.playOptions?.start || this.playOptions?.end) {
      trimArgs.push('trim');
      this.currentTime = this.playOptions.start || 0;
      trimArgs.push(this.currentTime.toString());
      if (this.playOptions?.end) {
        trimArgs.push(this.playOptions.end.toString());
      }
    }

    const soxArgs = ['-', '-d'].concat(trimArgs);
    console.log(soxArgs);

    this.soxProcess = spawn(this.soxPath, soxArgs);

    this.soxProcess.stderr?.on('data', (data) => {
      this.onSoxStdOut(data);
    });

    callback();
  }

  _write(
    chunk: Buffer | string | any,
    encoding: string,
    callback: (error?: Error | null | undefined) => void
  ) {
    if (chunk) {
      this.soxProcess?.stdin?.write(chunk, callback);
    }
  }

  _destroy(
    err: NodeJS.ErrnoException | null | undefined,
    callback: (error?: Error | null | undefined) => void
  ) {
    if (this.soxProcess) {
      this.soxProcess.kill();
    }

    if (err?.code === 'EPIPE') {
      callback();
      return;
    }

    callback(err);
  }

  onSoxStdOut(data: Buffer) {
    const msg = data.toString().trim();
    if (!msg.startsWith('In:')) {
      // Log initial console metadata info
      console.log(`message: ${msg}\n\n`);
      return;
    }

    const [, currentTime] = msg.split(' ');
    this.currentTime = currentTime
      .split(':')
      .reverse()
      .reduce(
        (val, chunk, index) => val + parseFloat(chunk) * (60 * index || 1),
        0
      );

    // Log time stamp
    console.log(currentTime);
  }
}
