import * as React from 'react';
import { Stage, Layer, Image, Transformer } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import { useIOCanvas } from '../hooks/useIOCanvas';
import { useSpaceStorage } from '../hooks/useSpaceStorage';

const ShapeImage: React.FC<
  Omit<Konva.ImageConfig, 'image'> & { src: string }
> = ({ src, ...props }) => {
  const [image] = useImage(src);

  return <Image image={image} {...props} />;
};

const Space: React.FC<{
  space: any;
  style?: React.CSSProperties;
}> = ({ space }) => {
  const layerRef = React.useRef<Konva.Layer>();
  const stageRef = React.useRef<Konva.Stage>();
  const transRef = React.useRef<Konva.Transformer>();

  const { setElements, setLayer } = useIOCanvas(true);
  const { spaceConfig, handleChange, initializeSpace } = useSpaceStorage();

  React.useEffect(() => {
    setElements(space.elements);
    initializeSpace(space);
  }, [space]);

  React.useEffect(() => {
    if (layerRef.current) {
      setLayer(layerRef.current);
    }
  }, [layerRef.current, space.elements]);

  React.useEffect(() => {
    if (stageRef.current) {
      const stageContainer = stageRef.current.container();
      if (space.style) {
        Object.entries(space.style).forEach(([key, value]) => {
          stageContainer.style[key] = value;
        });
      }
    }
  }, [stageRef.current, space.style]);

  const onTransformClick = React.useCallback((e) => {
    transRef.current.nodes([e.target]);
    transRef.current.getLayer().batchDraw();
  }, []);

  return (
    <Stage
      ref={stageRef}
      draggable
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseDown={(e) => {
        // deselect when clicked on empty area
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
          transRef.current.nodes([]);
          transRef.current.getLayer().batchDraw();
        }
      }}
    >
      <Layer ref={layerRef}>
        {spaceConfig?.elements?.length &&
          spaceConfig.elements.map(
            ({
              type,
              channel,
              box,
              x = 0,
              y = 0,
              rotation = 0,
              width,
              height,
              src,
              notes,
              colors,
            }) => {
              const id = `${box}:${channel}`;
              return (
                <ShapeImage
                  key={`${box}:${channel}`}
                  name="element"
                  width={width}
                  height={height}
                  x={x}
                  y={y}
                  rotation={rotation}
                  src={src}
                  draggable
                  id={id}
                  label={notes.join(' ')}
                  onClick={onTransformClick}
                  onDragEnd={(e) => {
                    handleChange('drag', e.target);
                  }}
                  onTransformEnd={(e) => {
                    handleChange('transform', e.target);
                  }}
                />
              );
            }
          )}

        <Transformer
          ref={transRef}
          boundBoxFunc={(oldBox, newBox) => {
            // limit resize
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      </Layer>
    </Stage>
  );
};

export default Space;
