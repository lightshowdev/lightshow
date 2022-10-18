const NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const dimmableNotes = [
  'C5',
  'E5',
  'F5',
  'Gb5',
  'G5',
  'A5',
  'B5',
  'C6',
  'E6',
  'F6',
  'Gb6',
  'G6',
  'A6',
  'B6',
];

export function getNoteName(noteNumber) {
  const octave = Math.floor(noteNumber / 12) - 1;
  const note = NOTES[noteNumber % 12];
  return `${note}${octave}`;
}

export function getNoteNumber(noteName) {
  const octave = Number(noteName.split('').pop());
  const noteIndex = NOTES.findIndex((n) => noteName.includes(n));
  return octave * 12 + 12 + noteIndex;
}

export const dimmableRange = dimmableNotes.map((n) => getNoteNumber(n));
