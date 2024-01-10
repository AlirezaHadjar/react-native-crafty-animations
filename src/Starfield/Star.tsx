import {Circle, Path, Skia, usePathValue} from '@shopify/react-native-skia';
import React, {useEffect} from 'react';
import {useWindowDimensions} from 'react-native';
import {
  interpolate,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import {generateRandomStarColor} from './utils';

type StarProps = {
  speed: number;
  ellipse?: boolean;
};

const getRandomPos = (min: number, max: number) => {
  'worklet';
  return Math.random() * (max - min) + min;
};

const size = 8;
const stroke = 3;

export const Star: React.FC<StarProps> = ({speed, ellipse}) => {
  const {width, height} = useWindowDimensions();
  const color = generateRandomStarColor();
  const x = useSharedValue(getRandomPos(-width / 2, width / 2));
  const y = useSharedValue(getRandomPos(-height / 2, height / 2));
  const animatedSpeed = useDerivedValue(() => speed, [speed]);
  const maxDist = width;
  const z = useSharedValue(getRandomPos(0, maxDist));
  const pz = useSharedValue(z.value);
  const shapeSize = useDerivedValue(
    () => interpolate(z.value, [0, maxDist], [size, 0]),
    [maxDist, z.value, size],
  );

  const frame = useFrameCallback(() => {
    // Increment a value on every frame update
    pz.value = z.value;
    const newZ = z.value - animatedSpeed.value;
    z.value = newZ;

    const factor = maxDist / z.value;
    const cx = x.value * factor;
    const cy = y.value * factor;

    const xArea = width / 2 - size / 2;
    const yArea = height / 2 - size / 2;

    const isInWindow =
      cx >= -xArea && cx <= xArea && cy >= -yArea && cy <= yArea;

    if (newZ < 1 || !isInWindow) {
      z.value = maxDist;
      x.value = getRandomPos(-width / 2, width / 2);
      y.value = getRandomPos(-height / 2, height / 2);
      pz.value = maxDist;
    }
  });

  useEffect(() => {
    if (speed > 0 && !frame.isActive) {
      frame.setActive(true);
    } else if (speed === 0 && frame.isActive) {
      frame.setActive(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed]);

  const cPositionX = useDerivedValue(() => {
    const factor = maxDist / z.value;

    const cx = x.value * factor;

    return cx;
  }, [maxDist, x.value, z.value]);
  const cPositionY = useDerivedValue(() => {
    const factor = maxDist / z.value;

    const cy = y.value * factor;

    return cy;
  }, [maxDist, y.value, z.value]);

  const lPositionX = useDerivedValue(() => {
    const factor = maxDist / pz.value;

    const cx = x.value * factor;

    return cx;
  }, [maxDist, x.value, z.value]);
  const lPositionY = useDerivedValue(() => {
    const factor = maxDist / pz.value;

    const cy = y.value * factor;

    return cy;
  }, [maxDist, y.value, z.value]);

  const linePath = usePathValue(finalPath => {
    'worklet';
    const path = Skia.Path.Make();
    path.moveTo(lPositionX.value, lPositionY.value);
    path.lineTo(cPositionX.value, cPositionY.value);
    path.close();

    finalPath.addPath(path);
  });

  return (
    <>
      {!ellipse ? (
        <Circle
          transform={[{translateX: width / 2}, {translateY: height / 2}]}
          cx={cPositionX}
          cy={cPositionY}
          r={shapeSize}
          color={color}
        />
      ) : (
        <Path
          transform={[{translateX: width / 2}, {translateY: height / 2}]}
          path={linePath}
          color={color}
          strokeWidth={stroke}
          style={'stroke'}
        />
      )}
    </>
  );
};
