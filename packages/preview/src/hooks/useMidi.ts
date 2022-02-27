import * as React from 'react';
import { dimmableNotes, Note } from '@lightshow/core/dist/Note';

export const useMidi = (isMidi: boolean, elements: any[]) => {
  React.useEffect(() => {
    if (!isMidi) {
      return;
    }
    // @ts-ignore
    window.navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

    function onMIDISuccess(midiAccess) {
      for (const input of midiAccess.inputs.values())
        input.onmidimessage = getMIDIMessage;
    }

    function getMIDIMessage(midiMessage) {
      const [command, note, velocity = 0] = midiMessage.data;

      const noteName = Note[note];
      let noteCommand = command == 144 ? 'note-on' : undefined;

      if (command == 128) {
        noteCommand = 'note-off';
      }

      const noteEls = elements
        .filter((el) => el.notes.includes(noteName))
        .map((el) => {
          return document.getElementById(el.id);
        })
        .filter((el) => el);

      if (noteEls.length) {
        noteEls.forEach((el) => {
          const lightEl = el as HTMLElement;
          const fillColor = el.getAttribute('data-light-color');
          const isDimmable = dimmableNotes.includes(note);

          if (length && isDimmable) {
            lightEl.style.transitionDuration = `${length}ms`;
          }

          lightEl.style.fill = fillColor || 'red';
          lightEl.style.fillOpacity = '1';

          if (isDimmable && command == 144) {
            const opacity = (velocity / 127).toFixed(2);
            lightEl.style.fill = fillColor.replace(',1)', `,${opacity})`);
          } else {
            lightEl.style.fill =
              command == 144 ? fillColor || 'red' : 'inherit';
          }
        });
      }
    }

    function onMIDIFailure() {
      console.log('Could not access your MIDI devices.');
    }
  }, [isMidi, elements]);
};
