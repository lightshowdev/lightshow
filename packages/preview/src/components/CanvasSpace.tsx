import * as React from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import Konva from 'konva';

const CanvasSpace: React.FC<{
  id: string;
  elements: any[];
  style?: React.CSSProperties;
}> = ({ id, elements }) => {
  const [color, setColor] = React.useState(Konva.Util.getRandomColor());

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <Rect
          x={20}
          y={20}
          width={50}
          height={50}
          fill={color}
          shadowBlur={5}
          onClick={() => setColor(Konva.Util.getRandomColor())}
        />
      </Layer>
    </Stage>
  );
};

export default CanvasSpace;
