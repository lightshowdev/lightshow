import * as React from 'react';
import { IOEvent } from '../IOEvent';

import { io } from 'socket.io-client';
import type Konva from 'konva';
import type { Element } from '../Space';

let socketClient;

export const useIOCanvas = (
  layerRef: React.MutableRefObject<Konva.Layer>,
  clientOverride?: any
) => {
  const trackPlayingRef = React.useRef(false);
  const [elements, setElements] = React.useState<Element[]>([]);

  // Dictionary for fast canvas element access
  const elementCache = React.useRef<{ [id: string]: Konva.Node }>({});

  // Dictionary for rotating elements
  const indexingCache = React.useRef<{
    [id: string]: { offset: number; limit: number; currIndex: number };
  }>({});

  const isSafari =
    navigator.userAgent.includes('Safari') &&
    !navigator.userAgent.includes('Chrome');

  const hideElements = () => {
    Object.values(elementCache.current).forEach((canvasEl) => {
      canvasEl?.to({
        opacity: 0,
        duration: isSafari ? 0 : 0.1,
      });
    });
  };

  React.useEffect(() => {
    if (!layerRef.current || !elements.length) {
      return;
    }

    const layer = layerRef.current;

    if (clientOverride) {
      socketClient = clientOverride;
    } else if (!socketClient) {
      socketClient = io({});
    }
    elementCache.current = {};
    indexingCache.current = {};

    // Delay for layer rendering
    setTimeout(() => {
      elements?.forEach((el) => {
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
            });
        } else {
          const canvasEl = layer.findOne(`#${el.id}`);
          elementCache.current[el.id] = canvasEl;
        }
      });

      if (trackPlayingRef.current) {
        hideElements();
      }
    }, 100);

    socketClient
      .on(IOEvent.TrackStart, () => {
        trackPlayingRef.current = true;
        hideElements();
      })
      .on(IOEvent.TrackEnd, () => {
        trackPlayingRef.current = false;
        Object.values(elementCache.current).forEach((canvasEl) => {
          canvasEl.to({
            opacity: 1,
            duration: isSafari ? 0 : 0.1,
          });
        });
      })
      .on(IOEvent.NoteOn, (note, velocity, length = 0, sameNotes) => {
        const notes = [note];
        if (sameNotes) {
          notes.push(...sameNotes);
        }
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
              duration: isDimmable && !isSafari ? length * 0.001 : 0,
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
  }, [elements]);

  return { setElements };
};
