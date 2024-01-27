import {
  Atlas,
  Circle,
  Path,
  Skia,
  rect,
  rrect,
  usePathValue,
  useRSXformBuffer,
  useTextureValue,
} from '@shopify/react-native-skia';
import React, {useEffect} from 'react';
import {useWindowDimensions} from 'react-native';
import {
  interpolate,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import {generateRandomStarColor} from './utils';

type StarAtlasProps = {
  speed: number;
  ellipse?: boolean;
  length: number;
};

const getRandomPos = (min: number, max: number) => {
  'worklet';
  return Math.random() * (max - min) + min;
};

const size = 8;
const stroke = 3;

const textureSize = {
  width: size,
  height: size,
};

export const StarAtlas: React.FC<StarAtlasProps> = ({
  speed,
  ellipse,
  length,
}) => {
  const {width, height} = useWindowDimensions();
  const color = generateRandomStarColor();
  //   const x = useSharedValue(getRandomPos(-width / 2, width / 2));
  //   const y = useSharedValue(getRandomPos(-height / 2, height / 2));
  const animatedSpeed = useDerivedValue(() => speed, [speed]);
  const maxDist = width;
  const z = useSharedValue(getRandomPos(0, maxDist));
  //   const pz = useSharedValue(z.value);
  const shapeSize = useDerivedValue(
    () => interpolate(z.value, [0, maxDist], [size, 0]),
    [maxDist, z.value, size],
  );
  const xs = useSharedValue(
    new Array(length).fill(0).map(() => getRandomPos(-width / 2, width / 2)),
  );
  const ys = useSharedValue(
    new Array(length).fill(0).map(() => getRandomPos(-height / 2, height / 2)),
  );
  const zs = useSharedValue(
    new Array(length).fill(0).map(() => getRandomPos(0, maxDist)),
  );

  const texture = useTextureValue(
    <Circle
      transform={[{translateX: width / 2}, {translateY: height / 2}]}
      r={shapeSize}
      color={color}
    />,
    textureSize,
  );

  const sprites = new Array(length)
    .fill(0)
    .map(() =>
      rrect(
        {height: textureSize.height, width: textureSize.width, x: 0, y: 0},
        textureSize.width / 2,
        textureSize.height / 2,
      ),
    );

  const transforms = useRSXformBuffer(length, (val, i) => {
    'worklet';
    const tx = xs.value[i];
    const ty = ys.value[i];
    const scale = interpolate(zs.value[i], [0, maxDist], [size, 0]);
    // const r = Math.atan2(pos.value.y - ty, pos.value.x - tx);

    val.set(scale, 0, tx, ty);
  });

  const frame = useFrameCallback(() => {
    // Increment a value on every frame update
    // pz.value = z.value;
    // const newZ = z.value - animatedSpeed.value;
    // z.value = newZ;
    const newZs = zs.value.map(z => z - animatedSpeed.value);
    zs.value = newZs;

    // const factor = maxDist / z.value;
    // const cx = x.value * factor;
    // const cy = y.value * factor;
    const factors = zs.value.map(z => maxDist / z);
    const cxs = xs.value.map((x, i) => x * factors[i]);
    const cys = ys.value.map((y, i) => y * factors[i]);

    // const xArea = width / 2 - size / 2;
    // const yArea = height / 2 - size / 2;

    // const isInWindow =
    //   cx >= -xArea && cx <= xArea && cy >= -yArea && cy <= yArea;

    // if (newZ < 1 || !isInWindow) {
    //   z.value = maxDist;
    //     x.value = getRandomPos(-width / 2, width / 2);
    //     y.value = getRandomPos(-height / 2, height / 2);
    // pz.value = maxDist;
    // }

    const finalZ = newZs;
    const finalXs = xs.value;
    const finalYs = ys.value;

    new Array(length).fill(0).forEach((_, i) => {
      const newSize = interpolate(zs.value[i], [0, maxDist], [size, 0]);

      const xArea = width / 2 - newSize / 2;
      const yArea = height / 2 - newSize / 2;

      const isInWindow =
        cxs[i] >= -xArea &&
        cxs[i] <= xArea &&
        cys[i] >= -yArea &&
        cys[i] <= yArea;

      if (newZs[i] < 1 || !isInWindow) {
        finalZ[i] = maxDist;
        finalXs[i] = getRandomPos(-width / 2, width / 2);
        finalYs[i] = getRandomPos(-height / 2, height / 2);
        // pz.value = maxDist;
      }
    });
    zs.value = finalZ;
    xs.value = finalXs;
    ys.value = finalYs;
  });

  useEffect(() => {
    if (speed > 0 && !frame.isActive) {
      frame.setActive(true);
    } else if (speed === 0 && frame.isActive) {
      frame.setActive(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed]);

  //   const cPositionX = useDerivedValue(() => {
  //     const factor = maxDist / z.value;

  //     const cx = x.value * factor;

  //     return cx;
  //   }, [maxDist, x.value, z.value]);
  //   const cPositionY = useDerivedValue(() => {
  //     const factor = maxDist / z.value;

  //     const cy = y.value * factor;

  //     return cy;
  //   }, [maxDist, y.value, z.value]);

  //   const lPositionX = useDerivedValue(() => {
  //     const factor = maxDist / pz.value;

  //     const cx = x.value * factor;

  //     return cx;
  //   }, [maxDist, x.value, z.value]);
  //   const lPositionY = useDerivedValue(() => {
  //     const factor = maxDist / pz.value;

  //     const cy = y.value * factor;

  //     return cy;
  //   }, [maxDist, y.value, z.value]);

  //   const linePath = usePathValue(finalPath => {
  //     'worklet';
  //     const path = Skia.Path.Make();
  //     path.moveTo(lPositionX.value, lPositionY.value);
  //     path.lineTo(cPositionX.value, cPositionY.value);
  //     path.close();

  //     finalPath.addPath(path);
  //   });

  return (
    <>
      <Atlas image={texture} sprites={sprites} transforms={transforms} />
      {/* {!ellipse ? (
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
      )} */}
    </>
  );
};
