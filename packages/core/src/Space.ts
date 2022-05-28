export interface Element {
  id: string;
  notes: string[];
  dimmableNotes?: string[];
  type: string;
  channel: number;
  x?: number;
  y?: number;
  rotation?: number;
  width?: number;
  height?: number;
  src?: string;
  box?: string;
  isDimmable?: boolean;
}

export interface Space {
  id: string;
  baseNotes: string[];
  boxes: {
    id: string;
    channels: number;
    notes: string[][];
    dimmableNotes?: string[][];
    elements: Partial<Element>[];
  }[];

  elements: Element[];
}
