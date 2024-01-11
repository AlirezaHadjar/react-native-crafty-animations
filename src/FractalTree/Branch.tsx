import {
  Path,
  Skia,
  Vector,
  add,
  usePathValue,
} from '@shopify/react-native-skia';
import React, {useEffect, useImperativeHandle} from 'react';
import {Leaf} from './Leaf';
import {
  SharedValue,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export type BranchRef = {reset: () => void};

type BranchProps = {
  begin: SharedValue<Vector>;
  length: number;
  angle: number;
  level: number;
  color: string;
  maxLevel: number;
  limit: number;
  branchRef?: React.RefObject<BranchRef>;
};

const stroke = 2;

const getRandomValue = (min: number, max: number) => {
  'worklet';
  return Math.random() * (max - min) + min;
};

const getBranch = (begin: Vector, length: number, _angle?: number) => {
  'worklet';
  const newLength = length * 0.8;
  const startAngle = Math.PI * 0.1;

  const angle =
    _angle !== undefined
      ? _angle
      : -getRandomValue(startAngle, Math.PI - startAngle);

  const newBegin = add(begin, {
    x: newLength * Math.cos(angle),
    y: newLength * Math.sin(angle),
  });

  return {begin: newBegin, angle, length: newLength};
};

const getBranches = (count: number, begin: Vector, length: number) => {
  return Array.from({length: count}, () => getBranch(begin, length));
};

const getPath = (begin: Vector, end: Vector) => {
  'worklet';
  const path = Skia.Path.Make();
  path.rMoveTo(begin.x, begin.y);
  path.lineTo(end.x, end.y);
  path.close();

  return path;
};

export const Branch: React.FC<BranchProps> = ({
  begin,
  angle,
  length,
  color,
  level,
  maxLevel,
  limit,
  branchRef,
}) => {
  const displayLeaves = level === limit;
  const progress = useSharedValue(0);
  const randomNewBranches = useSharedValue(
    Math.floor(getRandomValue(2, 3) / Math.max(level * 0.3, 1)),
  );

  const animatedEnd = useDerivedValue(() => {
    'worklet';
    return getBranch(begin.value, length * progress.value, angle).begin;
  }, [progress.value, begin.value]);

  const branches = useSharedValue(
    getBranches(randomNewBranches.value, begin.value, length),
  );
  const finalLeafRadius = 25 / level;
  const leafRadius = useSharedValue(finalLeafRadius / 3);

  const path = usePathValue(finalPath => {
    'worklet';

    finalPath.addPath(getPath(begin.value, animatedEnd.value));
  });

  useEffect(() => {
    if (displayLeaves) {
      leafRadius.value = withTiming(finalLeafRadius, {duration: 3000});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayLeaves, finalLeafRadius]);

  useEffect(() => {
    progress.value = withTiming(1, {duration: 3000});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(branchRef, () => ({
    reset: () => {
      progress.value = 0;
      progress.value = withTiming(1, {duration: 3000});

      randomNewBranches.value = Math.floor(getRandomValue(2, 3));
      branches.value = getBranches(
        randomNewBranches.value,
        begin.value,
        length,
      );
    },
  }));

  return (
    <>
      <Path
        path={path}
        style={'stroke'}
        color={color}
        strokeWidth={(stroke / level) * 2}
      />
      {level < maxLevel && (
        <>
          {branches.value.map((branch, index) => (
            <Branch
              begin={animatedEnd}
              length={branch.length}
              angle={branch.angle}
              key={`${level}-${index}`}
              color="brown"
              level={level + 1}
              maxLevel={maxLevel}
              limit={limit}
            />
          ))}
        </>
      )}
      {displayLeaves && <Leaf pos={animatedEnd} r={leafRadius} />}
    </>
  );
};
