/* eslint-disable react-native/no-inline-styles */
import {Canvas} from '@shopify/react-native-skia';
import React from 'react';
import {useWindowDimensions} from 'react-native';
import {Particle} from './Particle';
import {useSharedValue} from 'react-native-reanimated';

type FireworkProps = {};

const getRandomValue = (min: number, max: number) => {
  'worklet';
  return Math.random() * (max - min) + min;
};

const PARTICLES_ARRAY = new Array(3).fill(0);

export const Firework: React.FC<FireworkProps> = ({}) => {
  const {width, height} = useWindowDimensions();
  const initialized = useSharedValue(true);

  return (
    <Canvas style={{width, height, backgroundColor: 'black'}}>
      {PARTICLES_ARRAY.map((_, index) => (
        <Particle
          index={index}
          key={index}
          x={getRandomValue(0, width)}
          y={height}
          firework
          initialized={initialized}
        />
      ))}
    </Canvas>
  );
};
