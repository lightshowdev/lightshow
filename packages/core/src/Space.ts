import * as fs from 'fs';
import { resolve } from 'path';
import { Logger } from './Logger';

export enum EffectType {
  FadeOn = 'fade:on',
  FadeOff = 'fade:off',
  WipeUp = 'wipe:up',
  WipeDown = 'wipe:down',
  Cycle = 'cycle',
}

export interface Element {
  id: string;
  notes: string[];
  dimmableNotes?: string[];
  type: string;
  channel: number;
  x?: number | string;
  y?: number | string;
  rotation?: number;
  width?: number;
  height?: number;
  src?: string;
  box?: string;
  limit?: number;
  offset?: number;
  isDimmable?: boolean;
  effect?: EffectType;
  node?: any;
}

export interface SpaceClient {
  id: string;
  octave?: string | number;
  channels: number;
  notes: string[][];
  dimmableNotes?: string[][];
  elements: Partial<Element>[];
}

export interface Space {
  id: string;
  baseNotes: string[];
  boxes: SpaceClient[];
  width?: number;
  height?: number;
  elements: Element[];
}

export class SpaceCache {
  public spaces: Space[] = [];
  public path: string;
  public logger: Logger;
  public clients: SpaceClient[] = [];

  constructor({ path, logger }: { path: string; logger: Logger }) {
    this.path = path;
    this.logger = logger.getGroupLogger('SpaceCache');
  }

  loadSpaces(file: string = 'spaces.json') {
    const spacePath = resolve(this.path, file);

    if (!fs.existsSync(spacePath)) {
      throw new Error(`Space file not found: ${spacePath}`);
    }

    this.spaces = require(spacePath) as Space[];
    this.clients = this.spaces.map((s) => s.boxes).flat();
    this.logger.info({ msg: 'Spaces loaded', payload: this.spaces });
  }

  getClient(id: string) {
    return this.clients.find((c) => c.id === id);
  }
}
