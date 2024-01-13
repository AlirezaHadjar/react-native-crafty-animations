import {Circle, SkPoint, vec} from '@shopify/react-native-skia';
import React from 'react';
import {
  SharedValue,
  runOnJS,
  useAnimatedReaction,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';

type FlameParticleProps = {
  opacity: SharedValue<number>;
  acceleration: SharedValue<number>;
  radius: SharedValue<number>;
  color: SharedValue<string>;
  visible: SharedValue<boolean>;
  parentX: SharedValue<number>;
  parentY: SharedValue<number>;
};

const getRandomValue = (min: number, max: number) => {
  'worklet';
  return Math.random() * (max - min) + min;
};

const getInitialVelocity = (initialized?: boolean) => {
  'worklet';
  if (!initialized) {
    return {x: 0, y: 0};
  }
  const range = 1.5;
  return {
    x: getRandomValue(-range, range),
    y: getRandomValue(-range, range),
  } as SkPoint;
};

export const FlameParticle: React.FC<FlameParticleProps> = ({
  opacity,
  color,
  visible,
  acceleration,
  parentX,
  parentY,
  radius,
}) => {
  const velocity = useSharedValue(getInitialVelocity(visible.value));
  const positionX = useSharedValue(-10);
  const positionY = useSharedValue(-10);

  const frame = useFrameCallback(() => {
    if (!visible.value) {
      return;
    }
    positionX.value += velocity.value.x;
    positionY.value += velocity.value.y;
    const newVelocityY = velocity.value.y + acceleration.value;
    const newVelocityX =
      velocity.value.x -
      0.05 * acceleration.value * (velocity.value.x > 0 ? 1 : -1);

    velocity.value = vec(newVelocityX, newVelocityY);
  });

  const changeFrameState = (state: boolean) => {
    if (frame.isActive !== state) {
      if (state && !frame.isActive) {
        velocity.value = getInitialVelocity(true);
        positionX.value = parentX.value;
        positionY.value = parentY.value;
      }
      if (!state && frame.isActive) {
        velocity.value = getInitialVelocity(false);
        positionX.value = -10;
        positionY.value = -10;
      }
      frame.setActive(state);
    }
  };

  useAnimatedReaction(
    () => visible.value,
    value => {
      const state = value ? true : false;
      runOnJS(changeFrameState)(state);
    },
  );

  return (
    <Circle
      cx={positionX}
      cy={positionY}
      r={radius}
      color={color}
      opacity={opacity}
    />
  );
};
