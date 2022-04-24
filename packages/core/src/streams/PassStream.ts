import { PassThrough } from 'stream';

export class PassStream extends PassThrough {
  started: boolean = false;
  startTime: number = 0;
  startSeconds: number = 0;
  currentTime: number = 0;

  constructor() {
    super();
  }
}
