import * as React from 'react';
import { IOEvent } from '@lightshow/core/dist/IOEvent';
import { dimmableNotes } from '@lightshow/core/dist/Note';
import { io } from 'socket.io-client';
import Konva from 'konva';

const socketClient = io({});

export const useIOCanvas = (isIO: boolean) => {
  const [elements, setElements] = React.useState([]);
  const elementCache = React.useRef({});

  const [layer, setLayer] = React.useState<Konva.Layer | null>(null);

  React.useEffect(() => {
    if (!isIO || !elements.length || !layer) {
      return;
    }

    socketClient
      .on(IOEvent.TrackStart, () => {
        elements.forEach((el) => {
          const canvasEl = layer.findOne(`#${el.id}`);
          elementCache.current[el.id] = canvasEl;
          canvasEl.to({
            opacity: 0,
            duration: 0.1,
          });
        });
      })
      .on(IOEvent.TrackEnd, () => {
        elements.forEach((el) => {
          const canvasEl = elementCache.current[el.id];
          canvasEl.to({
            opacity: 1,
            duration: 0.1,
          });
        });
      })
      .on(IOEvent.NoteOn, (note, velocity, length, sameNotes) => {
        const notes = [note, ...(sameNotes || [])];
        const noteEls = elements.filter((el) =>
          el.notes.some((n) => notes.includes(n))
        );

        const isDimmable = dimmableNotes.includes(note);

        if (noteEls?.length) {
          noteEls.forEach((el) => {
            const canvasEl = elementCache.current[el.id];

            canvasEl.to({
              opacity: 1,
              duration: isDimmable ? length * 0.001 : 0,
            });
          });
          return;
        }
      })
      .on(IOEvent.NoteOff, (note) => {
        const noteEls = elements.filter((el) => el.notes.includes(note));

        const isDimmable = dimmableNotes.includes(note);
        noteEls?.forEach((el) => {
          const canvasEl = elementCache.current[el.id];
          canvasEl.to({
            opacity: 0,
            duration: 0,
          });
        });
      });
    return () => {
      socketClient.removeAllListeners();
    };
  }, [elements, layer]);
  return { setLayer, setElements };
};
