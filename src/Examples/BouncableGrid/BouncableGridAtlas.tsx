/* eslint-disable react-native/no-inline-styles */
import {
  Atlas,
  Blur,
  Canvas,
  Group,
  RoundedRect,
  Transforms3d,
  rect,
  useRSXformBuffer,
  useTexture,
} from '@shopify/react-native-skia';
import React from 'react';
import {useWindowDimensions} from 'react-native';
import {Cell, TappedPosition} from './Cell';
import {
  Extrapolation,
  SharedValue,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {generateRandomStarColor} from '../Starfield/utils';

type BouncableGridAtlasProps = {};

const RADIUS = 27;

const size = {width: RADIUS, height: RADIUS};
const strokeWidth = 5;
const textureSize = {
  width: size.width + strokeWidth,
  height: size.height + strokeWidth,
};
const _colors = new Array(1000)
  .fill(0)
  .map(() => generateRandomStarColor()) as unknown as Float32Array[];

const getDiff = (
  cellSize: number,
  x: number,
  y: number,
  pos: SharedValue<{x: number; y: number}>,
) => {
  'worklet';
  return Math.hypot(pos.value.x - x, pos.value.y - y);
};

export const BouncableGridAtlas: React.FC<BouncableGridAtlasProps> = ({}) => {
  const {width: windowWidth, height: windowHeight} = useWindowDimensions();
  const lastPos = useSharedValue({x: -1, y: -1});
  const tappedPosition = useSharedValue<TappedPosition>({
    pos: {x: -1, y: -1},
    cells: [],
  });
  const pos = useSharedValue({x: 0, y: 0});
  const texture = useTexture(
    <Group>
      <RoundedRect
        r={(size.width + strokeWidth) / 2}
        height={size.height + strokeWidth}
        width={size.width + strokeWidth}
        color={'dodgerblue'}>
        <Blur blur={1} />
      </RoundedRect>
      <RoundedRect
        transform={[
          {translateY: strokeWidth / 2},
          {translateX: strokeWidth / 2},
        ]}
        r={size.width / 2}
        height={size.height}
        width={size.width}
        color={'dodgerblue'}
      />
    </Group>,
    textureSize,
  );
  const cellSize = 45;
  const cols = Math.floor(windowWidth / cellSize);
  const rows = Math.floor(windowHeight / cellSize);

  const numberOfBoxes = cols * rows;
  const sprites = new Array(numberOfBoxes)
    .fill(0)
    .map(() => rect(0, 0, textureSize.width, textureSize.height));

  const transforms = useRSXformBuffer(numberOfBoxes, (val, i) => {
    'worklet';
    const tx = 5 + ((i * cellSize) % windowWidth);
    const ty = 25 + Math.floor(i / (windowWidth / cellSize)) * cellSize;

    const diff = getDiff(cellSize, tx, ty, pos);

    const diffX = pos.value.x - tx;
    const diffY = pos.value.y - ty;
    const draggedX = interpolate(
      diff,
      [0, cellSize * 1.8, cellSize * 2.5],
      [diffX * 0.2, diffX * 0.2, 0],
      Extrapolation.CLAMP,
    );
    const draggedY = interpolate(
      diff,
      [0, cellSize * 1.8, cellSize * 2.5],
      [diffY * 0.2, diffY * 0.2, 0],
      Extrapolation.CLAMP,
    );

    const scale = interpolate(
      diff,
      [0, cellSize * 1.8, cellSize * 3],
      [1, 1, 1 / 5],
      Extrapolation.CLAMP,
    );

    val.set(scale / 1.5, scale / 1.5, tx + draggedX, ty + draggedY);
  });

  const haptic = (status: 'drag' | 'tap') => {
    if (status === 'drag') {
      ReactNativeHapticFeedback.trigger('soft');
    }
    if (status === 'tap') {
      ReactNativeHapticFeedback.trigger('rigid');
    }
  };

  const pan = Gesture.Pan()
    .onBegin(({x, y}) => {
      pos.value = {x, y};
    })
    .onChange(({x, y}) => {
      if (
        Math.abs(x - lastPos.value.x) > cellSize * 2 ||
        Math.abs(y - lastPos.value.y) > cellSize * 2
      ) {
        lastPos.value = {x, y};
        runOnJS(haptic)('drag');
      }
      pos.value = {x, y};
    })
    .onEnd(() => {
      // pos.value = {x: -1, y: -1};
    })
    .onFinalize(() => {
      // pos.value = {x: -1, y: -1};
    });

  const tap = Gesture.Tap().onEnd(({x, y}) => {
    tappedPosition.value = {pos: {x, y}, cells: []};
    runOnJS(haptic)('tap');
  });

  const gesture = Gesture.Race(tap, pan);

  // const chaoticPosTheta = useSharedValue(0);
  // const chaoticPosR = useSharedValue(0);
  // const diffWithPointer = useDerivedValue(
  //   // () => Math.hypot(xPosition.value - x, yPosition.value - y),
  //   () => 0,
  //   [xPosition.value, yPosition.value],
  // );
  // const status = useSharedValue<null | 'drag' | 'tap'>(null);
  // const isChaoticActive = useDerivedValue(
  //   () => chaoticPosR.value !== 0,
  //   [chaoticPosTheta.value, chaoticPosR.value],
  // );
  // const isActive = useDerivedValue(
  //   () =>
  //     (diffWithPointer.value <= cellSize * 1.8 &&
  //       xPosition.value !== -1 &&
  //       yPosition.value !== -1) ||
  //     isChaoticActive.value,
  //   [diffWithPointer.value, isChaoticActive.value],
  // );
  // const animatedIsActive = useDerivedValue(
  //   () =>
  //     withTiming(isActive.value ? 1 : 0, {
  //       duration: isActive.value ? 200 : 1000,
  //     }),
  //   [isActive.value],
  // );
  // const scale = useDerivedValue(() => {
  //   if (status.value === 'tap') {
  //     return interpolate(
  //       chaoticPosR.value,
  //       [0, cellSize, cellSize * 2, cellSize * 3],
  //       [1, 2.5, 2.75, 3],
  //     );
  //   }
  //   if (isActive.value) {
  //     return withSpring(3.5, {
  //       overshootClamping: true,
  //     });
  //   } else {
  //     return withSpring(1, {
  //       overshootClamping: true,
  //       duration: 2000,
  //     });
  //   }
  // }, [xPosition, yPosition]);

  // const draggedX = useDerivedValue(() => {
  //   const diff = xPosition.value - 0;

  //   if (isActive.value && status.value === 'drag') {
  //     return withSpring(xPosition.value - diff * 0.8);
  //   } else {
  //     return withSpring(0, {duration: 3000});
  //   }
  // }, [xPosition.value, isActive.value, status.value]);

  // const draggedY = useDerivedValue(() => {
  //   const diff = yPosition.value - 0;

  //   if (isActive.value && status.value === 'drag') {
  //     return withSpring(yPosition.value - diff * 0.8);
  //   } else {
  //     return withSpring(0, {duration: 3000});
  //   }
  // }, [yPosition.value, isActive.value, status.value]);

  // const width = RADIUS;
  // const height = useDerivedValue(() => {
  //   if (isActive.value || status.value === 'tap') {
  //     return RADIUS;
  //   }
  //   return RADIUS / 1.2;
  // }, [isActive.value, status.value]);

  // const transform = useDerivedValue<Transforms3d>(() => {
  //   // const r = Math.atan2(y - yPosition.value, x - xPosition.value);
  //   const r = 0;
  //   const chaoticPosX = Math.cos(chaoticPosTheta.value) * chaoticPosR.value;
  //   const chaoticPosY = Math.sin(chaoticPosTheta.value) * chaoticPosR.value;

  //   return [
  //     {translateX: draggedX.value},
  //     {translateY: draggedY.value},

  //     {translateX: chaoticPosX},
  //     {translateY: chaoticPosY},

  //     {translateX: width / 2},
  //     {translateY: height.value / 2},
  //     {scale: scale.value},
  //     {translateX: -width / 2},
  //     {translateY: -height.value / 2},

  //     {translateX: width / 2},
  //     {translateY: height.value / 2},
  //     {rotate: r},
  //     {translateX: -width / 2},
  //     {translateY: -height.value / 2},
  //   ];
  // }, [
  //   draggedX.value,
  //   draggedY.value,
  //   width,
  //   height.value,
  //   xPosition.value,
  //   yPosition.value,
  //   chaoticPosTheta.value,
  //   chaoticPosR.value,
  //   scale.value,
  // ]);

  // const color = useDerivedValue(() => {
  //   const activeColor =
  //     status.value === 'tap' ? 'rgb(230, 66, 245)' : 'rgb(158, 228, 255)';
  //   const superActiveColor =
  //     status.value === 'tap' ? 'rgb(235, 18, 255)' : 'rgb(45, 192, 250)';

  //   return interpolateColors(
  //     animatedIsActive.value,
  //     [0, 0.5, 1],
  //     ['rgb(99, 99, 97)', activeColor, superActiveColor],
  //   );
  // }, [animatedIsActive.value, isChaoticActive.value]);

  // const tapCell = (tapPosition: TapPosition) => {
  //   'worklet';

  //   // const theta = Math.atan2(y - tapPosition.y, x - tapPosition.x);
  //   // const r = Math.hypot(tapPosition.x - x, tapPosition.y - y);
  //   const theta = 0;
  //   const r = 0;
  //   if (r < cellSize * 1.8) {
  //     cancelAnimation(chaoticPosR);
  //     chaoticPosR.value = 0;
  //     chaoticPosTheta.value = theta;
  //     status.value = 'tap';
  //     // tappedPosition.value = {
  //     //   ...tappedPosition.value,
  //     //   cells: [...tappedPosition.value.cells, {index}],
  //     // };
  //     chaoticPosR.value = withSequence(
  //       withTiming(30 + Math.random() * r),
  //       withTiming(0),
  //     );
  //   }
  // };

  // useAnimatedReaction(
  //   () => {
  //     if (tappedPosition.value.pos) {
  //       if (tappedPosition.value.cells.every(cell => cell.index !== index)) {
  //         return tappedPosition.value.pos;
  //       }
  //     }
  //   },
  //   () => {
  //     if (pos) {
  //       tapCell(pos);
  //     }
  //   },
  // );
  // useAnimatedReaction(
  //   () => {
  //     return xPosition.value !== -1 && yPosition.value !== -1;
  //   },
  //   dragging => {
  //     if (status.value !== 'drag' && dragging) {
  //       status.value = 'drag';
  //     }
  //   },
  // );

  return (
    <GestureDetector gesture={gesture}>
      <Canvas
        style={{
          width: windowWidth,
          height: windowHeight,
          backgroundColor: 'black',
        }}>
        <Atlas image={texture} sprites={sprites} transforms={transforms} />
      </Canvas>
    </GestureDetector>
  );
};
