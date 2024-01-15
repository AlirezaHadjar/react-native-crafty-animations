import {Rect} from '@shopify/react-native-skia';
import React from 'react';
import {ObstacleType} from './types';
import {SharedValue, useDerivedValue} from 'react-native-reanimated';

type ObstacleProps = {
  obstacle: SharedValue<ObstacleType | null>;
  positionX: SharedValue<number>;
  color?: string; //TODO: remove this
};

const obstacleColor = 'rgb(205, 242, 84)';

export const Obstacle: React.FC<ObstacleProps> = ({
  obstacle,
  positionX,
  color,
}) => {
  const x = useDerivedValue(() => {
    return positionX.value + (obstacle.value?.top.startX || 0);
  });
  const topY = useDerivedValue(() => {
    return obstacle.value?.top.startY || 0;
  });
  const topHeight = useDerivedValue(() => {
    return obstacle.value?.top.height || 0;
  });
  const topWidth = useDerivedValue(() => {
    return obstacle.value?.top.width || 0;
  });
  const bottomY = useDerivedValue(() => {
    return obstacle.value?.bottom.startY || 0;
  });
  const bottomHeight = useDerivedValue(() => {
    return obstacle.value?.bottom.height || 0;
  });
  const bottomWidth = useDerivedValue(() => {
    return obstacle.value?.bottom.width || 0;
  });

  return (
    <>
      <Rect
        color={color || obstacleColor}
        x={x}
        y={topY}
        width={topWidth}
        height={topHeight}
      />
      <Rect
        color={color || obstacleColor}
        x={x}
        y={bottomY}
        width={bottomWidth}
        height={bottomHeight}
      />
    </>
  );
};
