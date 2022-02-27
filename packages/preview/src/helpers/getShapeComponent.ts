import { Bush, CandyCane, ChristmasTree, Tree } from '../components/elements';

type ShapeComponent =
  | typeof Bush
  | typeof CandyCane
  | typeof ChristmasTree
  | typeof Tree;

enum ShapeType {
  Bush = 'bush',
  CandyCane = 'candycane',
  ChristmasTree = 'christmastree',
  Tree = 'tree',
}

const shapeComponents: {
  [shapeType in ShapeType]: {
    component: ShapeComponent;
    defaults: { width?: number; height?: number };
  };
} = {
  [ShapeType.Bush]: { component: Bush, defaults: { width: 100, height: 150 } },
  [ShapeType.CandyCane]: {
    component: CandyCane,
    defaults: { width: 40 },
  },

  [ShapeType.Tree]: { component: Tree, defaults: { width: 164 } },
  [ShapeType.ChristmasTree]: {
    component: ChristmasTree,
    defaults: { height: 150 },
  },
};

export function getShapeComponent(type: ShapeType) {
  return shapeComponents[type];
}
