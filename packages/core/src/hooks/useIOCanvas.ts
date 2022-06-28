import * as React from 'react';
import { IOEvent } from '../IOEvent';

import { io } from 'socket.io-client';
import type Konva from 'konva';
import type { Element } from '../Space';

let socketClient;

export const useIOCanvas = (isIO: boolean, clientOverride?: any) => {
  const [elements, setElements] = React.useState<Element[]>([]);

  // Dictionary for fast canvas element access
  const elementCache = React.useRef<{ [id: string]: Konva.Node }>({});

  // Dictionary for rotating elements
  const indexingCache = React.useRef<{
    [id: string]: { offset: number; limit: number; currIndex: number };
  }>({});

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
          if (el.limit) {
            indexingCache.current[el.id] = {
              limit: el.limit,
              offset: el.offset || 0,
              currIndex: el.offset || 0,
            };

            const pagedItems = new Array(el.limit)
              .fill(0)
              .map((_, i) => i + (el.offset || 0))
              .forEach((elNumber) => {
                const canvasEl = layer.findOne(`#${el.id}:${elNumber}`);
                elementCache.current[`${el.id}:${elNumber}`] = canvasEl;
                canvasEl.to({
                  opacity: 0,
                  duration: 0.1,
                });
              });
          } else {
            const canvasEl = layer.findOne(`#${el.id}`);
            elementCache.current[el.id] = canvasEl;
            canvasEl.to({
              opacity: 0,
              duration: 0.1,
            });
          }
        });
      })
      .on(IOEvent.TrackEnd, () => {
        // elements.forEach((el) => {
        //   const canvasEl = elementCache.current[el.id];
        //   canvasEl?.to({
        //     opacity: 1,
        //     duration: 0.1,
        //   });
        // });

        Object.values(elementCache.current).forEach((canvasEl) => {
          canvasEl.to({
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
            let canvasEl;

            const indexingRecord = indexingCache.current[el.id];

            if (indexingRecord) {
              canvasEl =
                elementCache.current[`${el.id}:${indexingRecord.currIndex}`];
            } else {
              canvasEl = elementCache.current[el.id];
            }

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
          let canvasEl;

          const indexingRecord = indexingCache.current[el.id];

          if (indexingRecord) {
            canvasEl =
              elementCache.current[`${el.id}:${indexingRecord.currIndex}`];
            indexingRecord.currIndex =
              ((indexingRecord.currIndex + 1) % indexingRecord.limit) +
              indexingRecord.offset;
          } else {
            canvasEl = elementCache.current[el.id];
          }

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
