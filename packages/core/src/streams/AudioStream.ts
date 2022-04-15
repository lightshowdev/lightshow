import { Writable } from 'stream';
import { SoxStream } from './SoxStream';
import Speaker from 'speaker';

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
  const { type, options: soxOptions } = options;
  if (type === 'sox') {
    return new SoxStream({ path: options.soxPath, options: soxOptions });
  }
  if (type === 'speaker') {
    return new Speaker({
      //device: 'hw:1,0',
      channels: 2, // 2 channels
      bitDepth: 16, // 16-bit samples
      sampleRate: 44100, // 44,100 Hz sample rate
    });
  }

  throw new Error('"type" is not set');
}
