/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import {
  Canvas,
  Extrapolate,
  Image,
  Transforms3d,
  add,
  useImage,
  vec,
} from '@shopify/react-native-skia';
import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  FlipInXDown,
  FlipInXUp,
  interpolate,
  runOnJS,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import {ObstacleType, Pillar} from './types';
import {Obstacle} from './Obstacle';
import usePrevious from '../../hooks/previous';
import {isNil} from '../../utils/nil';

type FlappyBirdProps = {};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
const gravity = vec(0, 0.3);
const BIRD_SIZE = 50;
const backgroundColor = 'rgb(73, 204, 235)';
const minGap = 200;
const maxGap = 300;
const minObstacleDiffX = 200;
const maxObstacleDiffX = 400;
const obstacleWidth = 50;

const getRandomValue = (min: number, max: number) => {
  'worklet';
  return Math.random() * (max - min) + min;
};

const generateRandomObstacle = (
  width: number,
  containerHeight: number,
  x: number,
): ObstacleType => {
  'worklet';
  // Each obstacle is a pair of rectangles, one on top and one on bottom
  // Each rectangle is a pair of, width, height

  const gap = getRandomValue(minGap, maxGap);
  const topLimit = 100;
  const bottomLimit = containerHeight - gap - 100;
  const firstHeight = getRandomValue(topLimit, bottomLimit);
  const top: Pillar = {
    startX: x,
    startY: 0,
    width,
    height: firstHeight,
  };
  const bottom: Pillar = {
    startX: x,
    startY: firstHeight + gap,
    width,
    height: containerHeight - firstHeight - gap,
  };

  return {
    top: top,
    bottom: bottom,
    hit: false,
    calculated: false,
  };
};

export const FlappyBird: React.FC<FlappyBirdProps> = ({}) => {
  const {width, height} = useWindowDimensions();
  const velocity = useSharedValue(vec(0, 0));
  const positionX = useSharedValue(100);
  const positionY = useSharedValue(height / 2);
  const acceleration = useSharedValue(gravity);
  const backgroundPositionX = useSharedValue(0);
  const firstObstacle = useSharedValue<ObstacleType | null>(null);
  const secondObstacle = useSharedValue<ObstacleType | null>(null);
  const [score, setScore] = useState(0);
  const prevScore = usePrevious(score);

  const enteringAnimation =
    !isNil(prevScore) && prevScore < score
      ? FlipInXDown.springify()
      : FlipInXUp.springify();
  const state = useSharedValue<'running' | 'stop'>('stop');

  const jump = () => {
    'worklet';
    velocity.value = vec(0, -11);
  };

  const tap = Gesture.Tap().onEnd(() => {
    if (state.value === 'stop') {
      return;
    }
    jump();
  });

  const getNewObstacle = (prev?: ObstacleType | null) => {
    'worklet';

    if (!prev) {
      return generateRandomObstacle(obstacleWidth, height, width);
    }

    const x =
      prev.top.startX +
      prev.top.width +
      getRandomValue(minObstacleDiffX, maxObstacleDiffX);

    return generateRandomObstacle(obstacleWidth, height, x);
  };

  const initializeObstacles = () => {
    'worklet';

    const first = getNewObstacle();
    const second = getNewObstacle(first);

    firstObstacle.value = first;
    secondObstacle.value = second;
  };

  const updateScore = (obstacle: ObstacleType) => {
    'worklet';
    let newObstacle = {...obstacle};
    const x = newObstacle.top.startX + backgroundPositionX.value;
    const isInBetweenHorizontally =
      positionX.value + BIRD_SIZE > x &&
      positionX.value < x + newObstacle.top.width;
    const isInBetweenVertically =
      positionY.value > newObstacle.top.height &&
      positionY.value + BIRD_SIZE < newObstacle.bottom.startY;

    if (isInBetweenHorizontally && !isInBetweenVertically && !newObstacle.hit) {
      newObstacle = {...newObstacle, hit: true};
    }
    const passedObstacle = positionX.value > x + newObstacle.top.width;

    if (passedObstacle) {
      if (newObstacle.calculated === false) {
        if (newObstacle.hit === false) {
          runOnJS(setScore)(score + 1);
        } else {
          runOnJS(setScore)(0);
        }
        newObstacle = {...newObstacle, calculated: true};
      }
    }

    return newObstacle;
  };

  useFrameCallback(() => {
    if (state.value === 'stop') {
      return;
    }
    const first = firstObstacle.value;
    const second = secondObstacle.value;
    if (!first && !second) {
      initializeObstacles();
    }

    if (first) {
      const x = first.top.startX + backgroundPositionX.value;
      const isLeftWindow = x + first.top.width < 0;
      let newFirst = first;

      newFirst = updateScore(newFirst);
      if (isLeftWindow) {
        newFirst = getNewObstacle(second);
      }

      firstObstacle.value = newFirst;
    }
    if (second) {
      const x = second.top.startX + backgroundPositionX.value;
      const isLeftWindow = x + second.top.width < 0;
      let newSecond = second;

      newSecond = updateScore(newSecond);
      if (isLeftWindow) {
        newSecond = getNewObstacle(first);
      }

      secondObstacle.value = newSecond;
    }
    backgroundPositionX.value -= 4;
    positionX.value += velocity.value.x;
    positionY.value += velocity.value.y;
    velocity.value = add(velocity.value, acceleration.value);

    if (positionY.value > height) {
      jump();
    }
  });

  const transform = useDerivedValue<Transforms3d>(() => {
    const rotation = interpolate(
      velocity.value.y,
      [-10, 10],
      [-Math.PI / 3, Math.PI / 5],
      Extrapolate.CLAMP,
    );
    return [
      {translateX: positionX.value},
      {translateY: positionY.value},

      {translateX: BIRD_SIZE * 0.5},
      {translateY: BIRD_SIZE * 0.5},
      {rotateZ: rotation},
      {translateX: -BIRD_SIZE * 0.5},
      {translateY: -BIRD_SIZE * 0.5},
    ];
  });

  useEffect(() => {
    setTimeout(() => {
      state.value = 'running';
    }, 500);
  }, []);

  const image = useImage(require('./bird.png'));
  if (!image) {
    return null;
  }

  return (
    <View style={styles.container}>
      <GestureDetector gesture={tap}>
        <Canvas style={{width, height, backgroundColor}}>
          <Obstacle obstacle={firstObstacle} positionX={backgroundPositionX} />
          <Obstacle obstacle={secondObstacle} positionX={backgroundPositionX} />
          <Image
            image={image}
            width={BIRD_SIZE}
            height={BIRD_SIZE}
            transform={transform}
          />
        </Canvas>
      </GestureDetector>
      <View
        style={{
          position: 'absolute',
          top: 100,
          alignSelf: 'center',
          flexDirection: 'row',
          alignContent: 'center',
        }}>
        <Text
          style={{
            color: 'white',
            fontSize: 30,
            fontWeight: '800',
          }}>
          {'Score: '}
        </Text>
        <Animated.View entering={enteringAnimation} key={score}>
          <Text
            style={{
              color: 'white',
              fontSize: 30,
              fontWeight: '800',
            }}>
            {score}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};
