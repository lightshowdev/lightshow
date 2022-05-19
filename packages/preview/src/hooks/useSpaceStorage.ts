import * as React from 'react';
import isEqual from 'lodash.isequal';
import clone from 'lodash.clone';
import Konva from 'konva';

export function useSpaceStorage() {
  const [space, initializeSpace] = React.useState<any>();
  const [initialized, setInitialized] = React.useState(false);
  const [spaceConfig, setSpaceConfig] = React.useState<any>();

  const validateSpace = (baseSpace, localSpace) => {
    const { elements } = baseSpace;

    const baseElements = elements.map(({ id, type, notes }) => ({
      id,
      type,
      notes,
    }));

    const cachedBaseElements = localSpace.elements?.map(
      ({ id, type, notes }) => ({
        id,
        type,
        notes,
      })
    );

    // reset if core elements changed
    if (!isEqual(baseElements, cachedBaseElements)) {
      setSpaceConfig(clone(baseSpace));
      return;
    }

    if (!isEqual(elements, localSpace.elements)) {
      const mappedElements = elements.map((el) => {
        const cachedEl = localSpace.elements.find((cel) => cel.id === el.id);
        if (!cachedEl) {
          return el;
        }

        const { x, y, width, height, rotation } = cachedEl;
        return { ...el, x, y, width, height, rotation };
      });

      setSpaceConfig({ ...localSpace, elements: mappedElements });
    }
  };

  React.useEffect(() => {
    if (space) {
      const storedValue = window.localStorage.getItem(space.id);
      if (storedValue) {
        const localSpace = JSON.parse(storedValue);
        setSpaceConfig(localSpace);
        validateSpace(space, localSpace);
      } else {
        setSpaceConfig(clone(space));
      }
      setInitialized(true);
    }
  }, [space]);

  const handleChange = (
    changeEventType: 'drag' | 'transform',
    node: Konva.Node
  ) => {
    const updatedSpaceConfig = clone(spaceConfig);
    const el = updatedSpaceConfig.elements.find((el) => el.id === node.id());
    if (!el) {
      return;
    }

    if (changeEventType === 'drag') {
      el.x = node.x();
      el.y = node.y();
    } else if (changeEventType === 'transform') {
      el.x = node.x();
      el.y = node.y();

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      // reset
      node.scaleX(1);
      node.scaleY(1);

      (el.width = node.width() * scaleX),
        (el.height = node.height() * scaleY),
        (el.rotation = node.rotation());
    }

    setSpaceConfig(updatedSpaceConfig);
    window.localStorage.setItem(space.id, JSON.stringify(updatedSpaceConfig));
  };

  return { spaceConfig, handleChange, initializeSpace };
}
