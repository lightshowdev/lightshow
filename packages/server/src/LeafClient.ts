import { io, Socket } from 'socket.io-client';

import { IOEvent, Console } from '@lightshow/core';

export class LeafClient {
  public socketClient: Socket;
  public console: Console;
  public trackLoaded = false;

  constructor({
    console,
    serverAddress,
  }: {
    console: Console;
    serverAddress: string;
  }) {
    this.socketClient = io(serverAddress);
    this.console = console;
    this.bindEvents();
  }

  bindEvents() {
    const client = this.socketClient;
    const trackConsole = this.console;

    client.on(IOEvent.TrackLoad, (trackName: string) => {
      if (this.trackLoaded) {
        return;
      }
      const track = this.console.playlist.getTrack(trackName);
      if (!track) {
        trackConsole.logger.error({ msg: 'Track not found', trackName });
        return;
      }
      this.trackLoaded = true;
      trackConsole.logger.info({msg: 'Track loaded', track});
      trackConsole.loadTrack({ track, formats: ['midi'] });
    
    });

    client.on(IOEvent.TrackPlay, () => {
      trackConsole.logger.info({msg: 'Track playing'});
      trackConsole.playTrack();
    });

    client.on(IOEvent.TrackEnd, () => {
      this.trackLoaded = false;
    });
  }
}
