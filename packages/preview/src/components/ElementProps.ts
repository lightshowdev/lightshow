import { Bush, CandyCane, ChristmasTree, Tree } from './elements';

export interface ElementWrapperProps {
  position: { x: number; y: number };
  size: { width: number; height: number };
  Element: typeof Bush | typeof CandyCane | typeof ChristmasTree | typeof Tree;
  type: string;
  id: string;
  colors?: {
    off?: string;
    on?: string;
  };
  dimmable?: boolean;
  label?: string;
  onDragStop: ({ x, y, id }: { x: number; y: number; id: string }) => void;
  onResizeStop: ({
    width,
    height,
    id,
  }: {
    width: number;
    height: number;
    id: string;
  }) => void;
}

export interface ElementProps {
  id: string;
  label?: string;
  colors?: {
    off?: string;
    on?: string;
  };
  dimmable?: boolean;
}
