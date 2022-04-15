import MidiPlayer from 'midi-player-js';

import { sortBy } from 'lodash';
import EventEmitter from 'events';
import { Server as SocketIOServer } from 'socket.io';
import { Logger, IOEvent, dimmableRange } from './';

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
}

export class Midi extends EventEmitter {
  public io: SocketIOServer;
  public midiPlayer: MidiPlayer.Player;
  public disabledNotes: string[] = [];
  public dimmerMap: any[] = [];
  public logger: Logger;

  constructor({
    io,
    logger,
    disabledNotes,
  }: {
    io: SocketIOServer;
    logger: Logger;
    disabledNotes?: string[];
  }) {
    super();

    this.io = io;
    this.midiPlayer = new MidiPlayer.Player();
    if (Array.isArray(disabledNotes)) {
      this.disabledNotes = disabledNotes;
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
      .on(
        MidiPlayerEvent.MidiEvent,
        ({
          name,
          noteName,
          noteNumber,
          tick,
          velocity = 0,
        }: MidiPlayer.Event) => {
          if (!noteNumber || !noteName) {
            return;
          }
          if (this.disabledNotes?.includes(noteName || '')) {
            return;
          }
          if (name === MidiEvent.NoteOn) {
            if (dimmableRange.includes(noteNumber)) {
              const computedLengthEvent = this.dimmerMap.find(
                (ev) => ev.tick === tick && ev.noteNumber === noteNumber
              );

              if (!computedLengthEvent) {
                return;
              }

              io.emit(
                IOEvent.NoteOn,
                noteName,
                velocity,
                computedLengthEvent.length,
                computedLengthEvent.sameNotes,
                // auto off (for dimmer notes)
                velocity < 125 ? 0 : 1
              );
              return;
            }

            io.emit(IOEvent.NoteOn, noteName, velocity);
          }
          if (name === MidiEvent.NoteOff) {
            io.emit(IOEvent.NoteOff, noteName);
          }
        }
      )
      .on(MidiPlayerEvent.EndOfFile, () => {
        io.emit(IOEvent.MidiFileEnd);
        this.emit(MidiPlayerEvent.EndOfFile);
      });
  }

  loadFile({ file }: { file: string }) {
    this.midiPlayer.loadFile(file);
    this.dimmerMap = this.calculateDimmerLengths();
  }

  play({ loop = false }: { loop: boolean }) {
    this.midiPlayer.play();
    if (loop) {
      this.on(MidiPlayerEvent.EndOfFile, () => {
        setTimeout(() => {
          this.play({ loop });
        }, 100);
      });
    }
  }

  stop() {
    this.midiPlayer.stop();
  }

  calculateDimmerLengths() {
    const player = this.midiPlayer;
    const { division } = player;
    const midiEvents = player.getEvents() as unknown as MidiPlayer.Event[][];
    const tempoEvents = midiEvents[0].filter((ev) => ev.name === 'Set Tempo');
    const tempoMap = [...tempoEvents].reverse();

    const dimmerNotes = midiEvents[0].filter(
      (ev) => ev.noteNumber && dimmableRange.includes(ev.noteNumber)
    );

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
      alignedEvents.forEach((ae) => (ae.cancelled = true));
    });

    return sortMap.filter((ev) => !ev.cancelled);
  }

  private getTickMs(division: number, tempo: number) {
    return 60000 / (tempo * division);
  }
}
