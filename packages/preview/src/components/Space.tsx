import * as React from 'react';
import { getShapeComponent } from '../helpers/getShapeComponent';
import { logElements } from '../helpers/logElements';
import { ElementWrapper } from './ElementWrapper';
import isEqual from 'lodash.isequal';
import clone from 'lodash.clone';

export const Space: React.FC<{
  id: string;
  elements: any[];
  style?: React.CSSProperties;
}> = ({ id, elements }) => {
  const [customizedElements, setCustomizedElements] = React.useState<
    any[] | null
  >(null);

  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    if (id) {
      const storedValue = window.localStorage.getItem(id);
      if (storedValue) {
        setCustomizedElements(JSON.parse(storedValue));
      } else {
        setCustomizedElements([]);
      }
    }
  }, [elements]);

  React.useEffect(() => {
    if (id && customizedElements.length) {
      window.localStorage.setItem(id, JSON.stringify(customizedElements));
    }
  }, [customizedElements]);

  React.useEffect(() => {
    if (initialized) {
      return;
    }
    if (!elements?.length || !customizedElements) {
      return;
    }

    setInitialized(true);

    const baseElements = elements.map(({ id, type, notes }) => ({
      id,
      type,
      notes,
    }));

    const cachedBaseElements = customizedElements.map(
      ({ id, type, notes }) => ({
        id,
        type,
        notes,
      })
    );

    if (!isEqual(baseElements, cachedBaseElements)) {
      setCustomizedElements(elements);
      return;
    }

    if (!isEqual(elements, customizedElements)) {
      const mappedElements = elements.map((el) => {
        const cachedEl = customizedElements.find((cel) => cel.id === el.id);
        if (!cachedEl) {
          return el;
        }

        const { x, y, width, height } = cachedEl;
        return { ...el, x, y, width, height };
      });

      setCustomizedElements(mappedElements);
    }
  }, [elements, customizedElements, initialized]);

  const handleDragStop = ({ x, y, id }) => {
    const updatedElements = clone(customizedElements);
    const el = updatedElements.find((el) => el.id === id);
    if (el) {
      el.x = x;
      el.y = y;
    }

    setCustomizedElements(updatedElements);
    logElements(updatedElements);
  };

  const handleResizeStop = ({ width, height, id }) => {
    const updatedElements = clone(customizedElements);
    const el = updatedElements.find((el) => el.id === id);
    if (el) {
      el.width = width;
      el.height = height;
    }

    setCustomizedElements(updatedElements);
  };

  return (
    <div
      style={{
        zIndex: -5,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'auto',
      }}
    >
      <div
        style={{
          background: '#000',
          backgroundSize: 'cover',
          position: 'relative',
          width: '100%',
          minHeight: '100vh',
        }}
      >
        {customizedElements?.length &&
          customizedElements.map(
            (
              {
                type,
                channel,
                box,
                x = 0,
                y = 0,
                width,
                height,
                notes,
                colors,
              },
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
    </div>
  );
};
