import {
  Oval,
  Transforms3d,
  interpolate,
  interpolateColors,
} from '@shopify/react-native-skia';
import React from 'react';
import {
  SharedValue,
  cancelAnimation,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export type CellTap = {
  index: number;
};

export type TappedPosition = {pos: TapPosition; cells: CellTap[]};

type CellProps = {
  index: number;
  xPosition: SharedValue<number>;
  yPosition: SharedValue<number>;
  cellSize: number;
  x: number;
  y: number;
  tappedPosition: SharedValue<TappedPosition>;
};
export type TapPosition = {x: number; y: number};

const RADIUS = 8;

export const Cell: React.FC<CellProps> = ({
  xPosition,
  yPosition,
  x,
  y,
  cellSize,
  tappedPosition,
  index,
}) => {
  const chaoticPosTheta = useSharedValue(0);
  const chaoticPosR = useSharedValue(0);
  const diffWithPointer = useDerivedValue(
    () => Math.hypot(xPosition.value - x, yPosition.value - y),
    [xPosition.value, yPosition.value, x, y],
  );
  const status = useSharedValue<null | 'drag' | 'tap'>(null);
  const isChaoticActive = useDerivedValue(
    () => chaoticPosR.value !== 0,
    [chaoticPosTheta.value, chaoticPosR.value],
  );
  const isActive = useDerivedValue(
    () =>
      (diffWithPointer.value <= cellSize * 1.8 &&
        xPosition.value !== -1 &&
        yPosition.value !== -1) ||
      isChaoticActive.value,
    [diffWithPointer.value, isChaoticActive.value],
  );
  const animatedIsActive = useDerivedValue(
    () =>
      withTiming(isActive.value ? 1 : 0, {
        duration: isActive.value ? 200 : 1000,
      }),
    [isActive.value],
  );
  const scale = useDerivedValue(() => {
    if (status.value === 'tap') {
      return interpolate(
        chaoticPosR.value,
        [0, cellSize, cellSize * 2, cellSize * 3],
        [1, 2.5, 2.75, 3],
      );
    }
    if (isActive.value) {
      return withSpring(3.5, {
        overshootClamping: true,
      });
    } else {
      return withSpring(1, {
        overshootClamping: true,
        duration: 2000,
      });
    }
  }, [xPosition, yPosition]);

  const draggedX = useDerivedValue(() => {
    const diff = xPosition.value - x;

    if (isActive.value && status.value === 'drag') {
      return withSpring(xPosition.value - diff * 0.8);
    } else {
      return withSpring(x, {duration: 3000});
    }
  }, [xPosition.value, isActive.value, status.value]);

  const draggedY = useDerivedValue(() => {
    const diff = yPosition.value - y;

    if (isActive.value && status.value === 'drag') {
      return withSpring(yPosition.value - diff * 0.8);
    } else {
      return withSpring(y, {duration: 3000});
    }
  }, [yPosition.value, isActive.value, status.value]);

  const width = RADIUS;
  const height = useDerivedValue(() => {
    if (isActive.value || status.value === 'tap') {
      return RADIUS;
    }
    return RADIUS / 1.2;
  }, [isActive.value, status.value]);

  const transform = useDerivedValue<Transforms3d>(() => {
    const r = Math.atan2(y - yPosition.value, x - xPosition.value);
    const chaoticPosX = Math.cos(chaoticPosTheta.value) * chaoticPosR.value;
    const chaoticPosY = Math.sin(chaoticPosTheta.value) * chaoticPosR.value;

    return [
      {translateX: draggedX.value},
      {translateY: draggedY.value},

      {translateX: chaoticPosX},
      {translateY: chaoticPosY},

      {translateX: width / 2},
      {translateY: height.value / 2},
      {scale: scale.value},
      {translateX: -width / 2},
      {translateY: -height.value / 2},

      {translateX: width / 2},
      {translateY: height.value / 2},
      {rotate: r},
      {translateX: -width / 2},
      {translateY: -height.value / 2},
    ];
  }, [
    draggedX.value,
    draggedY.value,
    width,
    height.value,
    xPosition.value,
    yPosition.value,
    chaoticPosTheta.value,
    chaoticPosR.value,
    scale.value,
  ]);

  const color = useDerivedValue(() => {
    const activeColor =
      status.value === 'tap' ? 'rgb(230, 66, 245)' : 'rgb(158, 228, 255)';
    const superActiveColor =
      status.value === 'tap' ? 'rgb(235, 18, 255)' : 'rgb(45, 192, 250)';

    return interpolateColors(
      animatedIsActive.value,
      [0, 0.5, 1],
      ['rgb(99, 99, 97)', activeColor, superActiveColor],
    );
  }, [animatedIsActive.value, isChaoticActive.value]);

  const tap = (tapPosition: TapPosition) => {
    'worklet';

    const theta = Math.atan2(y - tapPosition.y, x - tapPosition.x);
    const r = Math.hypot(tapPosition.x - x, tapPosition.y - y);
    if (r < cellSize * 1.8) {
      cancelAnimation(chaoticPosR);
      chaoticPosR.value = 0;
      chaoticPosTheta.value = theta;
      status.value = 'tap';
      tappedPosition.value = {
        ...tappedPosition.value,
        cells: [...tappedPosition.value.cells, {index}],
      };
      chaoticPosR.value = withSequence(
        withTiming(30 + Math.random() * r),
        withTiming(0),
      );
    }
  };

  useAnimatedReaction(
    () => {
      if (tappedPosition.value.pos) {
        if (tappedPosition.value.cells.every(cell => cell.index !== index)) {
          return tappedPosition.value.pos;
        }
      }
    },
    pos => {
      if (pos) {
        tap(pos);
      }
    },
  );
  useAnimatedReaction(
    () => {
      return xPosition.value !== -1 && yPosition.value !== -1;
    },
    dragging => {
      if (status.value !== 'drag' && dragging) {
        status.value = 'drag';
      }
    },
  );

  return (
    <Oval width={width} height={height} transform={transform} color={color} />
  );
};
