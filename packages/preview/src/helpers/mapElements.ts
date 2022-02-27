const noteLetters = ['C', 'D', 'E', 'F', 'G', 'A', 'Bb', 'B'];

export interface ShowMap {
  boxes: {
    id: string;
    channels: number;
    notes: string[][];
    dimmableNotes?: string[][];
    elements: {
      type: string;
      channel: number;
    }[];
  }[];
}

/**
 * Get a flattened map of elements with notes
 */
export function mapElements(showMap: ShowMap) {
  if (!showMap.boxes) {
    return [];
  }

  return showMap.boxes
    .map((b) => {
      const channels = [...new Array(b.channels)].map((_, index) => ({
        channel: index + 1,
        notes: [],
      }));

      b.notes.forEach((range) => {
        range.forEach((n, index) => {
          const [note, octave] = n.split('');
          if (note === '*') {
            channels.forEach((c, index) => {
              c.notes.push(`${noteLetters[index]}${octave}`);
            });
          } else {
            channels[index].notes.push(n);
          }
        });
      });

      return b.elements.map((el) => ({
        box: b.id,
        id: `${b.id}:${el.channel}`,
        ...el,
        notes: channels.find((c) => c.channel === el.channel)?.notes || [],
      }));
    })
    .flat()
    .filter((el) => el);
}
