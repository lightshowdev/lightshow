import * as React from 'react';
import { IOEvent } from '@lightshow/core/dist/IOEvent';
import type { Track } from '@lightshow/core';
import { io } from 'socket.io-client';

// Do not initialize in hook
const socketClient = io({ auth: { id: 'player' } });

export const useIOPlayerEvents = ({
  timeRef,
  sliderRef,
  durationRef,
  audioRef,
  track,
}: {
  timeRef: React.MutableRefObject<HTMLSpanElement>;
  sliderRef: React.MutableRefObject<HTMLSpanElement>;
  durationRef: React.MutableRefObject<HTMLSpanElement>;
  audioRef: React.MutableRefObject<HTMLAudioElement>;
  track: Track;
}) => {
  const socketRef = React.useRef(socketClient);

  const [time, setTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [waitForResume, setWaitForResume] = React.useState(false);

  React.useEffect(() => {
    socketRef.current.emit(IOEvent.TrackStop);
  }, [track]);

  const handleSeek = (percentage) => {
    if (!socketRef.current || !audioRef.current) {
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
        socketRef.current.emit(IOEvent.TrackSeek, audioRef.current.currentTime);
      },
      { once: true }
    );

    // Need delay or else midi will be early
    setTimeout(() => {
      audioRef.current.play();
    }, 200);
  };

  const handlePause = () => {
    if (!socketRef.current) {
      return;
    }

    socketRef.current.emit(IOEvent.TrackPause);
    audioRef.current.pause();
  };

  const handleResume = () => {
    if (!socketRef.current) {
      return;
    }

    if (time === 0) {
      socketRef.current.emit(IOEvent.TrackPlay);
      audioRef.current.play();
    } else {
      audioRef.current.addEventListener(
        'playing',
        () => {
          socketRef.current.emit(
            IOEvent.TrackSeek,
            audioRef.current.currentTime
          );
        },
        { once: true }
      );
      audioRef.current.play();
    }
  };

  React.useEffect(() => {
    if (
      !socketRef.current ||
      !sliderRef.current ||
      !durationRef.current ||
      !timeRef.current ||
      !audioRef.current
    ) {
      return;
    }
    const socket = socketRef.current;
    const sliderThumb = sliderRef.current.querySelector(
      'span:last-child'
    ) as HTMLSpanElement;
  }, [socketRef, sliderRef, timeRef, durationRef, audioRef, waitForResume]);

  React.useEffect(() => {
    const onTimeUpdate = (event) => {
      if (audioRef.current.seeking) {
        return;
      }
      const time = audioRef.current.currentTime;
      timeRef.current.innerText = getTimeString(time);

      if (!waitForResume) {
        setTime(time);
      }
    };

    if (audioRef.current) {
      audioRef.current.addEventListener('loadedmetadata', () => {
        const { duration } = audioRef.current;
        setDuration(duration);
        setTime(0);
        durationRef.current.innerText = getTimeString(duration);
        timeRef.current.innerText = getTimeString(0);

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

export function getTimeString(seconds: number) {
  if (!(seconds > 0)) {
    return '00:00';
  }
  const date = new Date(0);
  date.setSeconds(Math.floor(seconds));
  return date.toISOString().substring(14, 19);
}
