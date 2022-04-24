import * as React from 'react';
import { IOEvent } from '@lightshow/core/dist/IOEvent';
import { io } from 'socket.io-client';

// Do not initialize in hook
const socketClient = io({ auth: { id: 'player' } });

export const useIOPlayerEvents = ({
  timeRef,
  sliderRef,
  durationRef,
}: {
  timeRef: React.MutableRefObject<HTMLSpanElement>;
  sliderRef: React.MutableRefObject<HTMLSpanElement>;
  durationRef: React.MutableRefObject<HTMLSpanElement>;
}) => {
  const socketRef = React.useRef(socketClient);
  const [{ time, duration, percentage }, setTimeInfo] = React.useState({
    time: 0,
    duration: 0,
    percentage: 0,
  });

  const [waitForResume, setWaitForResume] = React.useState(false);

  const handleSeek = (percentage, duration) => {
    if (!socketRef.current) {
      return;
    }

    socketRef.current.emit(
      IOEvent.TrackSeek,
      Math.floor(duration * (percentage / 100))
    );
  };

  React.useEffect(() => {
    if (
      !socketRef.current ||
      !sliderRef.current ||
      !durationRef.current ||
      !timeRef.current
    ) {
      return;
    }
    const socket = socketRef.current;
    const sliderThumb = sliderRef.current.querySelector(
      'span:last-child'
    ) as HTMLSpanElement;

    socket
      .on(IOEvent.TrackTimeChange, ({ time, duration }) => {
        timeRef.current.innerText = getTimeString(time);
        durationRef.current.innerText = getTimeString(duration);
        const percentage = Math.ceil((time / duration) * 100);

        if (!waitForResume) {
          setTimeInfo({ time, duration, percentage });
        }
      })
      .on(IOEvent.TrackResume, () => {
        setWaitForResume(false);
      });
  }, [socketRef, sliderRef, timeRef, durationRef, waitForResume]);

  return { values: { time, duration, percentage }, handleSeek };
};

function getTimeString(seconds: number) {
  const date = new Date(0);
  date.setSeconds(Math.floor(seconds));
  return date.toISOString().substring(14, 19);
}
