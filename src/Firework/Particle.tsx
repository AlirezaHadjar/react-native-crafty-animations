/* eslint-disable @typescript-eslint/no-unused-vars */
import {Circle, vec} from '@shopify/react-native-skia';
import React from 'react';
import {useWindowDimensions} from 'react-native';
import {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import {FlameParticle} from './FlameParticle';

type ParticleProps = {
  x: number;
  y: number;
};

const getRandomValue = (min: number, max: number) => {
  'worklet';
  return Math.random() * (max - min) + min;
};

const gravity = 0.01;

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

const FLAME_PARTICLES = new Array(30).fill(0);
const OPACITY_VEL_DEC = 0.02;

export const Particle: React.FC<ParticleProps> = ({x, y}) => {
  const {width, height} = useWindowDimensions();
  const radius = useSharedValue(getRandomValue(3, 5));
  const velocity = useSharedValue(vec(0, getRandomValue(-20, -5)));
  const acceleration = useSharedValue(0);
  const positionX = useSharedValue(x);
  const color = useSharedValue(getRandomColor());
  const positionY = useSharedValue(y);
  const exploded = useSharedValue(false);
  const opacity = useDerivedValue(() => (exploded.value ? 0 : 1), [exploded]);
  const flamesOpacity = useSharedValue(0);
  const flamesAcceleration = useSharedValue(0);
  const flamesRadius = useDerivedValue(
    () => interpolate(flamesOpacity.value, [0, 1], [0, radius.value / 2]),
    [flamesOpacity, radius],
  );

  useFrameCallback(() => {
    if (!exploded.value) {
      positionX.value += velocity.value.x;
      positionY.value += velocity.value.y;
      const newVelocity = velocity.value.y + acceleration.value;
      velocity.value = vec(velocity.value.x, newVelocity);
      acceleration.value += gravity;
    }

    if (velocity.value.y >= 0 && !exploded.value) {
      flamesAcceleration.value = acceleration.value * 0.2;
      exploded.value = true;
      flamesOpacity.value = 1;
    }

    if (exploded.value && flamesOpacity.value > 0) {
      flamesOpacity.value = Math.max(flamesOpacity.value - OPACITY_VEL_DEC, 0);
    }

    const done = exploded.value && flamesOpacity.value === 0;

    if (positionY.value > height || done) {
      flamesAcceleration.value = 0;
      exploded.value = false;
      positionX.value = getRandomValue(0, width);
      radius.value = getRandomValue(3, 5);
      color.value = getRandomColor();
      positionY.value = height;
      velocity.value = vec(0, getRandomValue(-20, -5));
      acceleration.value = 0;
    }
  });

  return (
    <>
      <Circle
        cx={positionX}
        cy={positionY}
        r={radius}
        color={color}
        opacity={opacity}
      />
      {FLAME_PARTICLES.map((_, index) => (
        <FlameParticle
          key={index}
          parentX={positionX}
          parentY={positionY}
          color={color}
          visible={exploded}
          radius={flamesRadius}
          opacity={flamesOpacity}
          acceleration={flamesAcceleration}
        />
      ))}
    </>
  );
};
