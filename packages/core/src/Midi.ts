import MidiPlayer from 'midi-player-js';

import { sortBy } from 'lodash';

import type { Server as SocketIOServer } from 'socket.io';
import { IOEvent } from './IOEvent';
import { Logger } from './Logger';
import { getNoteNumber } from './Note';

export enum MidiPlayerEvent {
  FileLoaded = 'fileLoaded',
  MidiEvent = 'midiEvent',
  EndOfFile = 'endOfFile',
}

export enum MidiEvent {
  NoteOn = 'Note on',
  NoteOff = 'Note off',
}

interface DimmerEvent extends MidiPlayer.Event {
  length?: number;
  cancelled?: boolean;
  sameNotes?: string[];
  sameNoteNums?: number[];
}

export class Midi {
  public io:
    | SocketIOServer
    | { emit: (ioEvent: IOEvent, ...payload: any[]) => void };

  public midiPlayer: MidiPlayer.Player;
  public disabledNotes: string[] = [];
  public dimmableNotes: string[] = [];
  public dimmableNoteNumbers: number[] = [];
  public velocityOverride: number = 0;
  public dimmerMap: any[] = [];
  public logger: Logger;
  public timeRanges: {
    time: number;
    tick: number;
    tickMs: number;
    tempo: number;
  }[] = [];

  private callbackList: { [ev: string]: (() => any)[] } = {};
  private callackOnceList: { [ev: string]: (() => any)[] } = {};

  constructor({
    io,
    logger,
    disabledNotes,
    dimmableNotes,
    velocityOverride,
  }: {
    io:
      | SocketIOServer
      | { emit: (ioEvent: IOEvent, ...payload: any[]) => void };
    logger: Logger;
    disabledNotes?: string[];
    dimmableNotes?: string[];
    velocityOverride?: number;
  }) {
    this.io = io;
    this.midiPlayer = new MidiPlayer.Player();
    if (Array.isArray(disabledNotes)) {
      this.disabledNotes = disabledNotes;
    }

    if (Array.isArray(dimmableNotes)) {
      this.dimmableNotes = dimmableNotes;
      this.dimmableNoteNumbers = dimmableNotes.map((n) => getNoteNumber(n));
    }

    if (velocityOverride) {
      this.velocityOverride = velocityOverride;
    }
    this.logger = logger.getGroupLogger('Midi');

    this.bindEvents();
  }

  private bindEvents() {
    const { io } = this;
    this.midiPlayer
      .on(MidiPlayerEvent.FileLoaded, () => {
        io.emit(IOEvent.MidiFileLoaded);
        this.logger.debug('Midi file loaded.');
      })
      .on(MidiPlayerEvent.MidiEvent, (midiEvent: MidiPlayer.Event) => {
        this.logger.debug({ msg: 'raw_event', payload: midiEvent });
        let { name } = midiEvent;
        const { noteName, noteNumber, tick, velocity = 0 } = midiEvent;
        if (!noteNumber || !noteName) {
          return;
        }
        if (this.disabledNotes?.includes(noteName || '')) {
          return;
        }

        if (velocity === 0) {
          name = MidiEvent.NoteOff;
        }

        if (name === MidiEvent.NoteOn) {
          if (this.dimmableNoteNumbers.includes(noteNumber)) {
            const computedLengthEvent = this.dimmerMap.find(
              (ev) => ev.tick === tick && ev.noteNumber === noteNumber
            );

            if (!computedLengthEvent) {
              return;
            }

            const noteArgs = [
              noteName,
              noteNumber,
              computedLengthEvent.length,
              computedLengthEvent.sameNotes,
              // auto off (for dimmer notes)
              this.velocityOverride || velocity,
            ];
            this.logger.debug({ msg: 'event_args', payload: noteArgs });
            io.emit(IOEvent.NoteOn, ...noteArgs);
            return;
          }

          io.emit(IOEvent.NoteOn, noteName, noteNumber);
        }
        if (name === MidiEvent.NoteOff) {
          io.emit(IOEvent.NoteOff, noteName, noteNumber);
        }
      })
      .on(MidiPlayerEvent.EndOfFile, () => {
        io.emit(IOEvent.MidiFileEnd);
        this.emit(MidiPlayerEvent.EndOfFile);
      });
  }

  loadFile({ file }: { file: string }) {
    this.midiPlayer.loadFile(file);
    this.calculateTempoDependencies();
  }

  loadDataUri(dataUri: string) {
    this.midiPlayer.loadDataUri(dataUri);
    this.calculateTempoDependencies();
  }

  play(options = { loop: false }) {
    this.midiPlayer.play();
    if (options.loop) {
      this.once(MidiPlayerEvent.EndOfFile, () => {
        setTimeout(() => {
          this.midiPlayer.skipToSeconds(0);
          this.stop();
          this.play(options);
          this.logger.info({
            message: `Looping MIDI track`,
            time: new Date().toISOString(),
          });
        }, 500);
      });
    }
  }

  stop() {
    this.midiPlayer.stop();
  }

  isPlaying() {
    return this.midiPlayer.isPlaying();
  }

  seek(time: number) {
    const seekMidiTicks = this.getTickMatchingTime(time);
    const nearestTempoEvent = this.getNearestTempoEvent(time);
    this.logger.debug(`Seeking midi to ticks ${seekMidiTicks}`);

    this.midiPlayer.skipToTick(seekMidiTicks);

    // @ts-ignore
    this.midiPlayer.setTempo(nearestTempoEvent!.tempo || 0);
  }

  calculateTempoDependencies() {
    const player = this.midiPlayer;
    const { tempo: projectTempo, division } = player;

    const midiEvents = player.getEvents() as unknown as MidiPlayer.Event[][];

    const tempoEvents = midiEvents[0]
      .filter((ev) => ev.name === 'Set Tempo')
      .map((ev) => {
        return {
          ...ev,
          tickMs: this.getTickMs(division, ev.data!),
          startTime: 0,
        };
      });

    const [firstTempoEvent] = tempoEvents;
    if (firstTempoEvent.tick > 0) {
      tempoEvents.unshift({
        name: 'Set Tempo',
        tickMs: this.getTickMs(division, projectTempo),
        tick: 0,
        startTime: 0,
        track: 1,
        byteIndex: 0,
      });
    }

    tempoEvents.forEach((ev, index, events) => {
      if (index > 0) {
        const prevEvent = events[index - 1];
        ev.startTime =
          prevEvent.tickMs * (ev.tick - prevEvent.tick) + prevEvent.startTime;
      }
    });

    this.timeRanges = tempoEvents.map((ev) => ({
      time: ev.startTime,
      tickMs: ev.tickMs,
      tick: ev.tick,
      tempo: ev.data!,
    }));

    // this.logger.debug(this.timeRanges);

    const tempoMap = [...tempoEvents].reverse();

    const dimmerNotes = midiEvents[0].filter(
      (ev) => ev.noteNumber && this.dimmableNoteNumbers.includes(ev.noteNumber)
    );

    this.logger.debug({ msg: 'dimmer_notes', dimmerNotes });

    const dimmerTimeMap: DimmerEvent[] = [];

    dimmerNotes.forEach((event) => {
      // set up the on note
      if (event.name === MidiEvent.NoteOn) {
        dimmerTimeMap.unshift(event);
        return;
      }

      if (event.name === MidiEvent.NoteOff) {
        // Pair the off note
        const pairedNote = dimmerTimeMap.find(
          (n) => n.noteName === event.noteName
        );

        if (!pairedNote) {
          return;
        }

        // Check for current tempo
        const currentTempoEvent = tempoMap.find(
          (ev) => ev.tick < pairedNote.tick
        );

        if (currentTempoEvent?.data) {
          const tickMs = this.getTickMs(division, currentTempoEvent.data);
          pairedNote.length = Math.floor(
            tickMs * (event.tick - pairedNote.tick)
          );
        }
      }
      // flip order
    });

    const sortMap = sortBy(dimmerTimeMap, ['tick', 'length', 'noteNumber']);

    sortMap.forEach((ev, _, currentMap) => {
      if (ev.cancelled) {
        return;
      }
      const alignedEvents = currentMap.filter(
        (ce) =>
          ce.tick === ev.tick &&
          ce.length === ev.length &&
          ce.noteName !== ev.noteName
      );

      ev.sameNotes = alignedEvents.map((ae) => ae.noteName!);
      ev.sameNoteNums = ev.sameNotes.map((noteName) => getNoteNumber(noteName));
      alignedEvents.forEach((ae) => (ae.cancelled = true));
    });

    this.dimmerMap = sortMap.filter((ev) => !ev.cancelled);
  }

  public getTickMatchingTime(seconds: number) {
    const startRange = [...this.timeRanges]
      .reverse()
      .find((r) => seconds * 1000 > r.time);

    if (!startRange) {
      return 0;
    }

    const milliSecondsWithinRange = seconds * 1000 - startRange.time;
    const ticksWithinRange = Math.floor(
      milliSecondsWithinRange / startRange.tickMs
    );
    return ticksWithinRange + startRange.tick - 1;
  }

  public getNearestTempoEvent(seconds: number) {
    const startRange = [...this.timeRanges]
      .reverse()
      .find((r) => seconds * 1000 > r.time);

    if (!startRange) {
      return { time: 0, tick: 0 };
    }

    const { time, tick, tempo } = startRange;
    return { time, tick, tempo };
  }

  private getTickMs(division: number, tempo: number) {
    return 60000 / (tempo * division);
  }

  // Custom isomorphic implementation of event emitter
  on(eventName: string, callback: () => any) {
    const callbacks = this.callbackList[eventName] ?? [];
    callbacks.push(callback);
    this.callbackList[eventName] = callbacks;
  }

  // Custom isomorphic implementation of event emitter
  once(eventName: string, callback: () => any) {
    const callbacks = this.callackOnceList[eventName] ?? [];
    callbacks.push(callback);
    this.callackOnceList[eventName] = callbacks;
  }

  emit(eventName: string, ...args: []) {
    this.callbackList[eventName]?.forEach((callback) => {
      callback(...args);
    });

    this.callackOnceList[eventName]?.forEach((callback) => {
      callback(...args);
    });

    this.callackOnceList[eventName] = [];
  }
}
