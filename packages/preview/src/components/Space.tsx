import * as React from 'react';
import { getShapeComponent } from '../helpers/getShapeComponent';
import { logElements } from '../helpers/logElements';
import { ElementWrapper } from './ElementWrapper';
import { useLocalStorage } from '../hooks';
import isEqual from 'lodash.isequal';
import clone from 'lodash.clone';

export const Space: React.FC<{
  id: string;
  elements: any[];
  style?: React.CSSProperties;
}> = ({ id, elements }) => {
  const [elementCache, setElementCache] = useLocalStorage(id, elements);

  React.useEffect(() => {
    if (!id || !elements.length) {
      return;
    }

    const baseElements = elements.map(({ id, type, notes }) => ({
      id,
      type,
      notes,
    }));

    const cachedBaseElements = elementCache.map(({ id, type, notes }) => ({
      id,
      type,
      notes,
    }));

    if (!isEqual(baseElements, cachedBaseElements)) {
      setElementCache(elements);
      return;
    }

    if (!isEqual(elements, elementCache)) {
      const mappedElements = elements.map((el) => {
        const cachedEl = elementCache.find((cel) => cel.id === el.id);
        if (!cachedEl) {
          return el;
        }

        const { x, y, width, height } = cachedEl;
        return { ...el, x, y, width, height };
      });

      setElementCache(mappedElements);
    }
  }, [elements, id]);

  const handleDragStop = ({ x, y, id }) => {
    const updatedElements = clone(elementCache);
    const el = updatedElements.find((el) => el.id === id);
    if (el) {
      el.x = x;
      el.y = y;
    }

    setElementCache(updatedElements);
    logElements(updatedElements);
  };

  const handleResizeStop = ({ width, height, id }) => {
    const updatedElements = clone(elementCache);
    const el = updatedElements.find((el) => el.id === id);
    if (el) {
      el.width = width;
      el.height = height;
    }

    setElementCache(updatedElements);
  };

  return (
    <div
      style={{
        zIndex: -5,
        background: '#000',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {elementCache.length &&
        elementCache.map(
          (
            { type, channel, box, x = 0, y = 0, width, height, notes, colors },
            index
          ) => {
            const {
              component,
              defaults: { width: defaultWidth, height: defaultHeight },
            } = getShapeComponent(type);

            return (
              <ElementWrapper
                key={`${box}:${channel}`}
                Element={component}
                type={type}
                size={{
                  width: width || defaultWidth,
                  height: height || defaultHeight,
                }}
                position={{ x, y }}
                colors={colors}
                dimmable={false}
                id={`${box}:${channel}`}
                label={notes.join(' ')}
                onDragStop={handleDragStop}
                onResizeStop={handleResizeStop}
              />
            );
          }
        )}
    </div>
  );
};
