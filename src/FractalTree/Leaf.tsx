import {Circle, Vector} from '@shopify/react-native-skia';
import React from 'react';
import {SharedValue, useDerivedValue} from 'react-native-reanimated';

type LeafProps = {
  pos: SharedValue<Vector>;
  r: SharedValue<number>;
};

export const Leaf: React.FC<LeafProps> = ({pos, r}) => {
  const animatedCx = useDerivedValue(() => pos.value.x, [pos.value.x]);
  const animatedCy = useDerivedValue(() => pos.value.y, [pos.value.y]);

  return <Circle cx={animatedCx} cy={animatedCy} r={r} />;
};
