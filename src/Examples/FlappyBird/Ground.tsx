import {Rect} from '@shopify/react-native-skia';
import React from 'react';
import {useWindowDimensions} from 'react-native';

type GroundProps = {
  height: number;
};

const backgroundColor = 'rgb(221, 216, 157)';

export const Ground: React.FC<GroundProps> = ({height: groundHeight}) => {
  const {width, height} = useWindowDimensions();

  return (
    <Rect
      x={0}
      y={height - groundHeight}
      width={width}
      height={groundHeight}
      color={backgroundColor}
    />
  );
};
