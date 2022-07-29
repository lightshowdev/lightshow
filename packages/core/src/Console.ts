import * as fs from 'fs';
import EventEmitter from 'events';

import { AudioStream, PlayOptions, PassStream } from './streams';
import { Midi, MidiPlayerEvent } from './Midi';
import type { Server as SocketIOServer, Socket } from 'socket.io';

import { Playlist, Track } from './Playlist';
import { IOEvent, Logger } from './';

export class Console extends EventEmitter {
  public playlist: Playlist;
  public io: SocketIOServer;
  public logger: Logger;
  public disabledNotes: string[] = [];
  public logGroup = 'Console';
  private currentTrack: Track | null = null;
  private audioFile: string | null | undefined = null;
  private midiFile: string | null | undefined = null;
  private midiPlayer: Midi | null = null;
  private audioFileStream: fs.ReadStream | null = null;
  private audioStream: ReturnType<typeof AudioStream> | null = null;
  private passStream: PassStream | null = null;
  private activePlayer: string | null = null;

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
    this.io.on('connection', (socket: Socket) => {
      if (socket.handshake.auth?.id === 'player' && !this.activePlayer) {
        this.logger.debug('Socket connecion for player controls established.');
        socket.on(IOEvent.TrackSeek, (time: number) => this.seekTrack(time));
        socket.on(IOEvent.TrackPause, () => this.pauseTrack());
        socket.on(IOEvent.TrackResume, (time: number) =>
          this.resumeTrack(time)
        );
        socket.on(IOEvent.TrackPlay, () => {
          this.activePlayer = socket.handshake.address;
          this.playTrack();
        });
        socket.on(IOEvent.TrackStop, () => this.stopTrack());

        socket.on('disconnect', () => {
          this.stopTrack();
        });
      }
    });
  }

  loadTrack({
    track,
    disabledNotes,
    formats = ['audio', 'midi'],
  }: {
    track: Track;
    disabledNotes?: string[];
    formats?: ('audio' | 'midi')[];
  }) {
    this.currentTrack = track;

    this.clearCaches();

    if (formats.includes('audio')) {
      this.audioFile = this.playlist.getFilePath(track, 'audio');
      this.logger.debug('Audio file loaded.');
    }

    if (formats.includes('midi')) {
      this.midiFile = this.playlist.getFilePath(track, 'midi');
      this.logger.debug('Midi file loaded.');
    }

    if (this.midiFile) {
      this.midiPlayer = new Midi({
        io: this.io,
        disabledNotes: disabledNotes || this.disabledNotes,
        logger: this.logger,
      });

      this.midiPlayer.loadFile({ file: this.midiFile });
    }

    if (!this.audioFile && !this.midiFile) {
      throw new Error(`No files found for track ${track.name}`);
    }

    this.playlist.setCurrentTrack(track);

    if (track.noteMappings) {
      Object.entries(track.noteMappings).forEach((deviceName, mapping) => {
        this.io.emit(IOEvent.MapNotes, deviceName, mapping);
      });
    }
    this.logger.debug('Track loaded.');
  }

  playTrack(delay?: number) {
    if (!this.currentTrack) {
      throw new Error('No track loaded.');
    }

    const track = this.currentTrack;

    if (this.audioFile) {
      this.pipeAudio(track, { start: 0 });
    }
    // If playing a midi file only
    else if (this.midiPlayer) {
      this.midiPlayer.midiPlayer.on(MidiPlayerEvent.EndOfFile, () => {
        this.emitTrackEnd(track);
      });

      this.io.emit(IOEvent.TrackStart, track.file);
      this.midiPlayer.play({ loop: false });
    }
  }

  stopTrack() {
    if (!this.activePlayer) {
      return;
    }
    if (this.currentTrack) {
      this.emitTrackEnd(this.currentTrack);
    }
    this.logger.debug(`Stopping track started by ${this.activePlayer}`);
    this.activePlayer = null;
    this.midiPlayer?.stop();
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

      this.audioStream.on('time', (timeData) => {
        this.io.emit(IOEvent.TrackTimeChange, timeData);
      });

      this.audioFileStream.pipe(this.passStream!).pipe(this.audioStream);
    }
  }

  pauseTrack() {
    if (this.audioFileStream) {
      this.audioFileStream.pause();
      this.audioFileStream.unpipe();
      this.passStream!.unpipe();
      this.audioStream?.destroy();
    }

    if (this.midiPlayer) {
      this.midiPlayer.midiPlayer.pause();
    }

    this.io.emit(IOEvent.TrackPause);
    this.logger.debug('Track paused.');
  }

  resumeTrack(time: number) {
    if (!this.currentTrack) {
      this.logger.error(`Cannot resume - no current track`);
      return;
    }

    this.seekTrack(time);
  }

  seekTrack(time: number) {
    this.logger.debug(`Seeking to ${time}`);
    if (!this.currentTrack) {
      return;
    }

    if (this.midiPlayer) {
      this.midiPlayer.seek(time);

      if (!this.audioFile) {
        this.midiPlayer.play();
        this.io.emit(IOEvent.TrackResume);
        return;
      }
    }

    if (this.audioFile) {
      this.pipeAudio(this.currentTrack!, { start: time + 0.3 });
      this.io.emit(IOEvent.TrackResume);
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

  private clearCaches() {
    this.midiPlayer?.stop();
    this.midiPlayer = null;
    this.audioFileStream = null;
    this.audioStream = null;
    this.audioFile = null;
    this.midiFile = null;
    this.passStream = null;
  }
}
