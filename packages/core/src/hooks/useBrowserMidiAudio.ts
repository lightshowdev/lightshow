import * as React from 'react';
import { IOEvent } from '../IOEvent';
import { Midi } from '../Midi';
import { Logger } from '../Logger';
import type { Track } from '../Playlist';

import { getTimeString } from '../helpers';

class BrowserIOServer {
  callbackList: { [ev: string]: (() => any)[] } = {};

  on(eventName: string, callback: () => any) {
    const callbacks = this.callbackList[eventName] ?? [];
    callbacks.push(callback);
    this.callbackList[eventName] = callbacks;
    return this;
  }

  emit(eventName: string, ...args: []) {
    this.callbackList[eventName]?.forEach((callback) => {
      callback(...args);
    });
  }

  removeAllListeners() {
    this.callbackList = {};
  }
}

export const io = new BrowserIOServer();
const logger = new Logger({ level: ['debug'] });
const midiPlayer = new Midi({ io, logger });

export const useBrowserMidiAudio = ({
  timeRef,
  durationRef,
  audioRef,
  track,
}: {
  audioRef: React.MutableRefObject<HTMLAudioElement>;
  timeRef?: React.MutableRefObject<HTMLSpanElement>;
  durationRef?: React.MutableRefObject<HTMLSpanElement>;
  track: Track;
}) => {
  const [time, setTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [waitForResume, setWaitForResume] = React.useState(false);

  React.useEffect(() => {
    if (track?.midiEncoded) {
      midiPlayer.loadDataUri(track.midiEncoded);
    }
  }, [track]);

  React.useEffect(() => {
    io.emit(IOEvent.TrackStop);
  }, [track]);

  const handleSeek = (percentage: number) => {
    if (!audioRef.current) {
      return;
    }

    const seekTime = Math.floor(duration * (percentage / 100));
    audioRef.current.pause();
    audioRef.current.currentTime = seekTime;

    audioRef.current.addEventListener(
      'playing',
      () => {
        if (audioRef.current.paused) {
          return;
        }
        midiPlayer.seek(audioRef.current.currentTime);
        midiPlayer.play();
      },
      { once: true }
    );

    audioRef.current.play();
  };

  const handlePause = () => {
    midiPlayer.midiPlayer.pause();
    audioRef.current.pause();
  };

  const handleResume = () => {
    if (time === 0) {
      setTimeout(() => {
        io.emit(IOEvent.TrackStart);
        if (!midiPlayer.isPlaying()) {
          midiPlayer.play();
        }
        audioRef.current.play();
      }, 300);
    } else {
      audioRef.current.addEventListener(
        'playing',
        () => {
          midiPlayer.seek(time);
        },
        { once: true }
      );
      audioRef.current.play();
    }
  };

  React.useEffect(() => {
    const onTimeUpdate = () => {
      if (audioRef.current.seeking) {
        return;
      }
      const time = audioRef.current.currentTime;

      if (timeRef?.current) {
        timeRef.current.innerText = getTimeString(time);
      }

      if (!waitForResume) {
        setTime(time);
      }
    };

    if (audioRef.current) {
      audioRef.current.addEventListener('loadedmetadata', () => {
        const { duration } = audioRef.current;
        setDuration(duration);
        setTime(0);

        if (durationRef?.current) {
          durationRef.current.innerText = getTimeString(duration);
        }

        if (timeRef?.current) {
          timeRef.current.innerText = getTimeString(0);
        }

        setTimeout(() => {
          handleResume();
        }, 50);
      });

      audioRef.current.addEventListener('timeupdate', onTimeUpdate);
      audioRef.current.addEventListener('seeking', () => {}, { once: true });
    }

    return () => {
      audioRef.current.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [audioRef]);

  return {
    values: { time, duration, percentage: Math.ceil((time / duration) * 100) },
    handlers: { seek: handleSeek, pause: handlePause, resume: handleResume },
  };
};
