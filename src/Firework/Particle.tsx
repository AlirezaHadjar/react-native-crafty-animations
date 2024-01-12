import {Circle, SkPoint, vec} from '@shopify/react-native-skia';
import React from 'react';
import {useWindowDimensions} from 'react-native';
import {
  SharedValue,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';

type ParticleProps = {
  x: number;
  y: number;
  firework?: boolean;
  index: number;
  color?: string;
  initialized?: SharedValue<boolean>;
  animatedX?: SharedValue<number>;
  animatedY?: SharedValue<number>;
};

const getRandomValue = (min: number, max: number) => {
  'worklet';
  return Math.random() * (max - min) + min;
};

const radius = 5;
const gravity = 0.01;

const getInitialVelocity = (firework?: boolean, initialized?: boolean) => {
  'worklet';
  if (!initialized) {
    return {x: 0, y: 0};
  }
  if (firework) {
    return {x: 0, y: getRandomValue(-17, -5)} as SkPoint;
  }
  return {x: getRandomValue(-2, 2), y: getRandomValue(-2, 2)} as SkPoint;
};

function getRandomColor() {
  'worklet';
  // Generate random values for red, green, and blue components
  var red = Math.floor(Math.random() * 256);
  var green = Math.floor(Math.random() * 256);
  var blue = Math.floor(Math.random() * 256);

  // Construct the RGB color string
  var rgbColor = 'rgb(' + red + ',' + green + ',' + blue + ')';

  return rgbColor;
}

const NEW_PARTICLES = new Array(40).fill(0);

export const Particle: React.FC<ParticleProps> = ({
  x,
  y,
  firework,
  color: _color,
  initialized,
  animatedX,
  animatedY,
}) => {
  const {width, height} = useWindowDimensions();
  const velocity = useSharedValue(
    getInitialVelocity(firework, initialized?.value),
  );
  const acceleration = useSharedValue(0);
  const positionX = useSharedValue(x);
  const color = useSharedValue(_color || getRandomColor());
  const positionY = useSharedValue(y);
  const exploded = useSharedValue(false);
  const opacity = useSharedValue(1);
  const aRadius = useDerivedValue(() =>
    interpolate(opacity.value, [0, 1], [0, radius / 2]),
  );

  const frame = useFrameCallback(() => {
    if (!initialized?.value) {
      return;
    }
    positionX.value += velocity.value.x;
    positionY.value += velocity.value.y;
    let newVelocity = velocity.value.y + acceleration.value;
    if (exploded.value) {
      newVelocity *= 0.8;
    }
    velocity.value = vec(velocity.value.x, newVelocity);
    acceleration.value += gravity;

    if (velocity.value.y >= 0 && !exploded.value && firework) {
      exploded.value = true;
      opacity.value = 0;
    }
    if (!firework) {
      opacity.value -= 0.03;
    }

    if (positionY.value > height && firework) {
      exploded.value = false;
      opacity.value = 1;
      positionX.value = getRandomValue(0, width);
      color.value = getRandomColor();
      positionY.value = height;
      velocity.value = vec(0, getRandomValue(-17, -5));
      acceleration.value = 0;
    }
  });

  const changeFrameState = (state: boolean) => {
    if (frame.isActive !== state) {
      if (state && !frame.isActive) {
        velocity.value = getInitialVelocity(firework, true);
        positionX.value = animatedX?.value || x;
        positionY.value = animatedY?.value || y;
      }
      if (!state && frame.isActive) {
        velocity.value = getInitialVelocity(firework, false);
        acceleration.value = 0;
        opacity.value = 1;
      }
      frame.setActive(state);
    }
  };

  useAnimatedReaction(
    () => initialized?.value,
    value => {
      const state = value ? true : false;
      runOnJS(changeFrameState)(state);
    },
  );

  return (
    <>
      <Circle
        cx={positionX}
        cy={positionY}
        r={firework ? radius : aRadius}
        color={color}
        opacity={opacity}
      />
      {firework &&
        NEW_PARTICLES.map((_, index) => (
          <Particle
            key={index}
            x={positionX.value}
            y={positionY.value}
            animatedX={positionX}
            animatedY={positionY}
            color={color.value}
            index={index}
            firework={false}
            initialized={exploded}
          />
        ))}
    </>
  );
};
