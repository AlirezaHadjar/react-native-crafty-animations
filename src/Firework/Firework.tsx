/* eslint-disable react-native/no-inline-styles */
import {Canvas} from '@shopify/react-native-skia';
import React from 'react';
import {useWindowDimensions} from 'react-native';
import {Particle} from './Particle';

type FireworkProps = {};

const getRandomValue = (min: number, max: number) => {
  'worklet';
  return Math.random() * (max - min) + min;
};

const PARTICLES_ARRAY = new Array(1).fill(0);

export const Firework: React.FC<FireworkProps> = ({}) => {
  const {width, height} = useWindowDimensions();

  return (
    <Canvas style={{width, height, backgroundColor: 'black'}}>
      {PARTICLES_ARRAY.map((_, index) => (
        <Particle key={index} x={getRandomValue(0, width)} y={height} />
      ))}
    </Canvas>
  );
};
