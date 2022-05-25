import { Writable } from 'stream';
import { SoxStream } from './SoxStream';

export interface PlayOptions {
  start?: number;
  end?: number;
}

interface AudioStreamOptions {
  type: 'sox' | 'speaker';
  soxPath?: string;
  options?: PlayOptions;
}

export function AudioStream(
  options: AudioStreamOptions
): Writable & { currentTime?: number } {
  const { type = 'sox', options: soxOptions } = options;
  if (type === 'sox') {
    return new SoxStream({ path: options.soxPath, options: soxOptions });
  }

  throw new Error('"type" is not set');
}
