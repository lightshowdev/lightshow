import * as React from 'react';
import { IOEvent } from '../IOEvent';

import { io } from 'socket.io-client';
import type Konva from 'konva';
import type { Element } from '../Space';

let socketClient;

export const useIOCanvas = (isIO: boolean, clientOverride?: any) => {
  const [elements, setElements] = React.useState<Element[]>([]);

  // Dictionary for fast access
  const elementCache = React.useRef({});

  // Cache the layer containing all the canvas nodes
  const [layer, setLayer] = React.useState<Konva.Layer | null>(null);

  React.useEffect(() => {
    if (!isIO || !elements.length || !layer) {
      return;
    }

    if (clientOverride) {
      socketClient = clientOverride;
    } else if (!socketClient) {
      socketClient = io({});
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
          canvasEl?.to({
            opacity: 1,
            duration: 0.1,
          });
        });
      })
      .on(IOEvent.NoteOn, (note, velocity, length = 0, sameNotes) => {
        const notes = [note, ...(sameNotes || [])];
        const noteEls = elements.filter((el) =>
          el.notes.some((n) => notes.includes(n))
        );

        if (noteEls?.length) {
          const isDimmable = noteEls[0].dimmableNotes?.includes(note);

          noteEls.forEach((el) => {
            const canvasEl = elementCache.current[el.id];

            canvasEl?.to({
              opacity: 1,
              duration: isDimmable ? length * 0.001 : 0,
            });
          });
          return;
        }
      })
      .on(IOEvent.NoteOff, (note) => {
        const noteEls = elements.filter((el) => el.notes.includes(note));

        noteEls?.forEach((el) => {
          const canvasEl = elementCache.current[el.id];
          canvasEl?.to({
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
