import * as fs from 'fs';
import EventEmitter from 'events';

import { AudioStream, PlayOptions, PassStream } from './streams';
import { Midi, MidiPlayerEvent } from './Midi';
import type { Server as SocketIOServer } from 'socket.io';

import { Playlist, Track } from './Playlist';
import { IOEvent, Logger } from './';

export class Console extends EventEmitter {
  public playlist: Playlist;
  public io: SocketIOServer;
  public logger: Logger;
  public disabledNotes: string[] = [];
  public logGroup = 'Console';
  private currentTrack: Track | null = null;
  private midiPlayer: Midi | null = null;
  private audioFileStream: fs.ReadStream | null = null;
  private audioStream: ReturnType<typeof AudioStream> | null = null;
  private audioFile: string | undefined;

  private passStream: PassStream | null = null;

  constructor({
    playlist,
    io,
    logger,
  }: {
    playlist: Playlist;
    io: SocketIOServer;
    logger: Logger;
  }) {
    super();
    this.playlist = playlist;
    this.io = io;
    this.logger = logger.getGroupLogger(this.logGroup);
  }

  playTrack({
    track,
    disabledNotes,
    delay,
  }: {
    track: Track;
    disabledNotes?: string[];
    delay?: number;
  }) {
    this.midiPlayer = null;
    this.audioFileStream = null;
    this.audioStream = null;

    this.passStream = null;
    this.currentTrack = track;

    this.audioFile = this.playlist.getFilePath(track, 'audio');
    const midiFile = this.playlist.getFilePath(track, 'midi');
    // if (audioFile) {
    //   this.audioFileStream = fs.createReadStream(audioFile);
    // }

    if (midiFile) {
      this.midiPlayer = new Midi({
        io: this.io,
        disabledNotes: disabledNotes || this.disabledNotes,
        logger: this.logger,
      });
      this.midiPlayer.loadFile({ file: midiFile });
    }

    if (!this.audioFile && !midiFile) {
      throw new Error(`No files found for track ${track.name}`);
    }

    this.playlist.setCurrentTrack(track);

    if (track.noteMappings) {
      Object.entries(track.noteMappings).forEach((deviceName, mapping) => {
        this.io.emit(IOEvent.MapNotes, deviceName, mapping);
      });
    }

    if (this.audioFile) {
      this.logger.debug('Audio stream loaded.');
      const passStream = (this.passStream = new PassStream());

      passStream.on('data', (d) => {
        if (!passStream.started) {
          this.io.emit(IOEvent.TrackStart, track.file);
          if (this.midiPlayer) {
            this.logger.debug('MIDI play started.');
            this.midiPlayer.play({ loop: false });
          }

          passStream.started = true;
        }
      });

      this.pipeAudio(track, { start: 0 });
    }
    // If playing a midi file only
    else if (this.midiPlayer) {
      this.midiPlayer.once(MidiPlayerEvent.EndOfFile, () => {
        this.emitTrackEnd(track);
      });

      this.midiPlayer.play({ loop: false });
    }
  }

  private pipeAudio(track: Track, options?: PlayOptions) {
    if (this.audioFile) {
      this.audioFileStream = fs.createReadStream(this.audioFile);
      this.audioStream = AudioStream({ type: 'sox', options });

      this.audioFileStream
        .on('close', () => {
          this.midiPlayer?.stop();
          this.logger.debug('File stream closed and MIDI play stopped.');
          this.emitTrackEnd(track);
        })
        .on('error', (err: Error) => {
          this.logger.error(err);
          this.midiPlayer?.stop();
          this.logger.debug('File stream error and MIDI play stopped.');
          this.emitTrackEnd(track);
        });

      this.passStream!.started = false;

      this.audioFileStream.pipe(this.passStream!).pipe(this.audioStream);
    }
  }

  pauseTrack() {
    if (this.audioFileStream) {
      this.audioFileStream.pause();
      this.audioFileStream.unpipe();
      this.passStream!.unpipe();
    }

    if (this.midiPlayer) {
      this.midiPlayer.midiPlayer.stop();
    }
  }

  resumeTrack() {
    if (!this.currentTrack) {
      return;
    }

    const currentTime = this.audioStream?.currentTime;

    console.log({ pausedTime: currentTime });

    if (currentTime) {
      this.midiPlayer!.midiPlayer.skipToSeconds(currentTime);
      this.pipeAudio(this.currentTrack, { start: currentTime });
    }
  }

  emitTrackEnd(track: Track) {
    this.io.emit(IOEvent.TrackEnd, track);
    this.emit(IOEvent.TrackEnd, track);
    this.playlist.clearCurrentTrack();
  }

  setDisabledNotes(disabledNotes: string[]) {
    this.disabledNotes = disabledNotes;
  }
}
