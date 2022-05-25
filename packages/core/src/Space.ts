export interface Element {
  id: string;
  notes: string[];
  type: string;
  channel: number;
  x?: number;
  y?: number;
  rotation?: number;
  width?: number;
  height?: number;
  src?: string;
  box?: string;
}

export interface Space {
  id: string;
  elements: Element[];
}
