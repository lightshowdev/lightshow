import * as React from 'react';
import { IOEvent } from '@lightshow/core/dist/IOEvent';
import { dimmableNotes } from '@lightshow/core/dist/Note';
import { io } from 'socket.io-client';

export const useIO = (isIO: boolean, space: any) => {
  const socketRef = React.useRef(io({}));

  React.useEffect(() => {
    if (!isIO || !socketRef.current || !space) {
      return;
    }
    const socket = socketRef.current;
    const elements = space?.elements;

    socket
      .on(IOEvent.TrackStart, () => {
        elements.forEach((el) => {
          const domEl = document.getElementById(el.id);
          domEl.style.fill = '#000';
          document.getElementById(el.id).setAttribute('data-color-off', '#000');
        });
      })
      .on(IOEvent.TrackEnd, () => {
        elements.forEach((el) => {
          const domEl = document.getElementById(el.id);
          domEl.style.fill = 'inherit';
          domEl.style.fillOpacity = '1';
          domEl.setAttribute(
            'data-color-off',
            domEl.getAttribute('data-color-default')
          );
        });
      })
      .on(IOEvent.NoteOn, (note, velocity, length, sameNotes) => {
        const notes = [note, ...(sameNotes || [])];
        const noteEls = elements
          .filter((el) => el.notes.some((n) => notes.includes(n)))
          .map((el) => {
            return document.getElementById(el.id);
          })
          .filter((el) => el);

        if (noteEls.length) {
          noteEls.forEach((el) => {
            const lightEl = el as HTMLElement;
            const fillColor = el.getAttribute('data-color-on');
            const isDimmable = dimmableNotes.includes(note);

            if (length && isDimmable) {
              lightEl.style.transitionDuration = `${length}ms`;
            }

            lightEl.style.fill = fillColor;
            lightEl.style.fillOpacity = '1';
          });
          return;
        }

        // log unmapped notes
        // console.log(note);
      })
      .on(IOEvent.NoteOff, (note) => {
        const noteEls = elements
          .filter((el) => el.notes.includes(note))
          .map((el) => {
            return document.getElementById(el.id);
          })
          .filter((el) => el);

        const isDimmable = dimmableNotes.includes(note);
        noteEls.forEach((el) => {
          const lightEl = el as HTMLElement;

          if (isDimmable) {
            lightEl.style.transitionDuration = '0s';
            lightEl.style.fillOpacity = '0';
          } else {
            lightEl.style.fill = lightEl.getAttribute('data-color-off');
          }
        });
      });
  }, [isIO, space, socketRef]);
  return socketRef.current;
};
