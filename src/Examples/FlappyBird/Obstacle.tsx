import {LinearGradient, RoundedRect, vec} from '@shopify/react-native-skia';
import React from 'react';
import {ObstacleType} from './types';
import {SharedValue, useDerivedValue} from 'react-native-reanimated';

type ObstacleProps = {
  obstacle: SharedValue<ObstacleType | null>;
  positionX: SharedValue<number>;
};

const startColor = 'rgb(205, 242, 84)';
const endColor = 'rgb(163, 208, 16)';

export const Obstacle: React.FC<ObstacleProps> = ({obstacle, positionX}) => {
  // In order to hide the border radius on the top and bottom of the screen
  const borderRadius = 10;
  const rockHeight = 50;
  const x = useDerivedValue(() => {
    return positionX.value + (obstacle.value?.top.startX || 0);
  });
  const topY = useDerivedValue(() => {
    return (obstacle.value?.top.startY || 0) - borderRadius;
  });
  const topHeight = useDerivedValue(() => {
    return (obstacle.value?.top.height || 0) + borderRadius;
  });
  const topWidth = useDerivedValue(() => {
    return obstacle.value?.top.width || 0;
  });
  const topRockWidth = useDerivedValue(() => {
    return topWidth.value * 1.3;
  });

  const bottomY = useDerivedValue(() => {
    return obstacle.value?.bottom.startY || 0;
  });
  const bottomHeight = useDerivedValue(() => {
    return (obstacle.value?.bottom.height || 0) + borderRadius;
  });
  const bottomWidth = useDerivedValue(() => {
    return obstacle.value?.bottom.width || 0;
  });
  const bottomRockWidth = useDerivedValue(() => {
    return bottomWidth.value * 1.2;
  });

  const topStart = useDerivedValue(() => {
    return vec(x.value, topY.value + topHeight.value / 2);
  });
  const topEnd = useDerivedValue(() => {
    return vec(x.value + topWidth.value, topY.value + topHeight.value / 2);
  });

  const topRockY = useDerivedValue(() => {
    return topY.value + topHeight.value - rockHeight;
  });
  const topRockX = useDerivedValue(() => {
    const diff = (topRockWidth.value - topWidth.value) / 2;
    return x.value - diff;
  });
  const bottomRockY = useDerivedValue(() => {
    return bottomY.value;
  });
  const bottomRockX = useDerivedValue(() => {
    const diff = (bottomRockWidth.value - bottomWidth.value) / 2;
    return x.value - diff;
  });

  return (
    <>
      <RoundedRect
        x={x}
        y={topY}
        r={borderRadius}
        width={topWidth}
        height={topHeight}>
        <LinearGradient
          start={topStart}
          end={topEnd}
          colors={[startColor, endColor]}
        />
      </RoundedRect>
      <RoundedRect
        x={x}
        y={topY}
        r={borderRadius}
        width={topWidth}
        strokeWidth={2}
        style={'stroke'}
        height={topHeight}
      />
      <RoundedRect
        x={topRockX}
        y={topRockY}
        r={borderRadius}
        width={topRockWidth}
        height={rockHeight}>
        <LinearGradient
          start={topStart}
          end={topEnd}
          colors={[startColor, endColor]}
        />
      </RoundedRect>
      <RoundedRect
        x={topRockX}
        y={topRockY}
        r={borderRadius}
        width={topRockWidth}
        height={rockHeight}
        strokeWidth={2}
        style={'stroke'}
      />

      <RoundedRect
        x={x}
        y={bottomY}
        r={borderRadius}
        width={bottomWidth}
        height={bottomHeight}>
        <LinearGradient
          start={topStart}
          end={topEnd}
          colors={[startColor, endColor]}
        />
      </RoundedRect>
      <RoundedRect
        x={x}
        y={bottomY}
        r={borderRadius}
        strokeWidth={2}
        style={'stroke'}
        width={bottomWidth}
        height={bottomHeight}
      />
      <RoundedRect
        x={bottomRockX}
        y={bottomRockY}
        r={borderRadius}
        width={bottomRockWidth}
        height={rockHeight}>
        <LinearGradient
          start={topStart}
          end={topEnd}
          colors={[startColor, endColor]}
        />
      </RoundedRect>
      <RoundedRect
        x={bottomRockX}
        y={bottomRockY}
        r={borderRadius}
        width={bottomRockWidth}
        height={rockHeight}
        strokeWidth={2}
        style={'stroke'}
      />
    </>
  );
};
