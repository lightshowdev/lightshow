import * as React from 'react';
import { IOEvent } from '../IOEvent';
import type { Track } from '../Playlist';
import { io } from 'socket.io-client';
import { getTimeString } from '../helpers';

let socketClient;

export const useIOPlayerEvents = ({
  timeRef,
  durationRef,
  audioRef,
  track,
}: {
  timeRef: React.MutableRefObject<HTMLSpanElement>;
  durationRef: React.MutableRefObject<HTMLSpanElement>;
  audioRef: React.MutableRefObject<HTMLAudioElement>;
  track: Track;
}) => {
  if (!socketClient) {
    socketClient = io({ auth: { id: 'player' } });
  }

  const socketRef = React.useRef(socketClient);

  const [time, setTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [waitForResume, setWaitForResume] = React.useState(false);

  React.useEffect(() => {
    socketRef.current.emit(IOEvent.TrackStop);
  }, [track]);

  const handleSeek = (percentage: number) => {
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

    // if (time === 0) {
    //   setTimeout(() => {
    //     socketRef.current.emit(IOEvent.TrackPlay);
    //     audioRef.current.play();
    //   }, 300);
    // } else {
    audioRef.current.addEventListener(
      'playing',
      () => {
        const currentTime = audioRef.current.currentTime;

        socketRef.current.emit(
          currentTime === 0 ? IOEvent.TrackPlay : IOEvent.TrackSeek,
          currentTime
        );

        // Recalibrate for buffering
        if (currentTime === 0) {
          setTimeout(() => {
            socketRef.current.emit(
              IOEvent.TrackSeek,
              audioRef.current.currentTime
            );
          }, 300);
        }
      },
      { once: true }
    );
    audioRef.current.play();
    // }
  };

  React.useEffect(() => {
    const onTimeUpdate = () => {
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
