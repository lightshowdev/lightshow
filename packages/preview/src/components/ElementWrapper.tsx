import * as React from 'react';
import { Rnd } from 'react-rnd';

import type { ElementWrapperProps } from './ElementProps';

export const ElementWrapper: React.FC<ElementWrapperProps> = ({
  id,
  size,
  position,
  colors,
  dimmable,
  label,
  Element,
  onDragStop,
  onResizeStop,
}) => {
  return (
    <Rnd
      className="transition-colors ease-in-out delay-100 text-transparent hover:text-gray-100"
      size={size}
      position={position}
      onDragStop={(_, data) => {
        const { x, y } = data;
        onDragStop({ x, y, id });
      }}
      onResizeStop={(_, dir, elementRef) => {
        const boundingRect = elementRef.getBoundingClientRect();
        onResizeStop({
          width: boundingRect.width,
          height: boundingRect.height,
          id,
        });
      }}
    >
      <Element colors={colors} dimmable={dimmable} label={label} id={id} />
      {label && <div className="absolute top-0 left-0 font-sans">{label}</div>}
    </Rnd>
  );
};
