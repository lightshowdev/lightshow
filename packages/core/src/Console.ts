import * as fs from 'fs';
import EventEmitter from 'events';
import { PassThrough } from 'stream';
import Speaker from 'speaker';
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
    let audioFileStream;
    let midiPlayer: Midi | undefined;

    const audioFile = this.playlist.getFilePath(track, 'audio');
    const midiFile = this.playlist.getFilePath(track, 'midi');
    if (audioFile) {
      audioFileStream = fs.createReadStream(audioFile);
    }

    if (midiFile) {
      midiPlayer = new Midi({
        io: this.io,
        disabledNotes: disabledNotes || this.disabledNotes,
        logger: this.logger,
      });
      midiPlayer.loadFile({ file: midiFile });
    }

    if (!audioFile && !midiFile) {
      throw new Error(`No files found for track ${track.name}`);
    }

    this.playlist.setCurrentTrack(track);

    if (track.noteMappings) {
      Object.entries(track.noteMappings).forEach((deviceName, mapping) => {
        this.io.emit(IOEvent.MapNotes, deviceName, mapping);
      });
    }

    if (audioFileStream) {
      this.logger.debug('audio stream loaded');
      const passStream = new PassThrough();

      let started = false;

      passStream.on('data', (d) => {
        if (!started) {
          this.io.emit(IOEvent.TrackStart, track.file);
          if (midiPlayer) {
            this.logger.debug('midi play started');
            midiPlayer.play({ loop: false });
          }

          started = true;
        }
      });

      const speaker = new Speaker({
        //device: 'hw:1,0',
        channels: 2, // 2 channels
        bitDepth: 16, // 16-bit samples
        sampleRate: 44100, // 44,100 Hz sample rate
      });

      speaker
        .on('flush', () => {
          midiPlayer?.stop();
          this.logger.debug('Speak flushed.');
          this.emitTrackEnd(track);
        })
        .on('error', (err) => {
          this.logger.error(err);
          midiPlayer?.stop();
          this.emitTrackEnd(track);
        });

      audioFileStream.pipe(passStream).pipe(speaker);
    }
    // If playing a midi file only
    else if (midiPlayer) {
      midiPlayer.once(MidiPlayerEvent.EndOfFile, () => {
        this.emitTrackEnd(track);
      });

      midiPlayer.play({ loop: false });
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
