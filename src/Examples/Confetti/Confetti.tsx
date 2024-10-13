import {
  useTexture,
  Group,
  Rect,
  rect,
  useRSXformBuffer,
  Canvas,
  Atlas,
} from '@shopify/react-native-skia';
import {useEffect} from 'react';
import {Button, Dimensions, StyleSheet, View} from 'react-native';
import {
  cancelAnimation,
  interpolate,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type ConfettiProps = {};

const styles = StyleSheet.create({
  container: {},
});

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const numberOfBoxes = 400;
const size = {width: 6, height: 12};
const paddingBetweenRows = 30;
const columns = Math.floor(SCREEN_WIDTH / size.width);
const rows = Math.ceil(numberOfBoxes / columns);
const rowHeight = size.height + paddingBetweenRows;
const verticalOffset = -rows * rowHeight;
const textureSize = {
  width: size.width * columns,
  height: size.height * rows,
};
const duration = 8000;

const getRandomBoolean = () => {
  'worklet';
  return Math.random() >= 0.5;
};

const getRandomValue = (min: number, max: number): number => {
  'worklet';
  return Math.random() * (max - min) + min;
};

const randomColor = (): string => {
  'worklet';
  const colors = [
    '#FF5733',
    '#33FF57',
    '#3357FF',
    '#F5FF33',
    '#FF33B5',
    '#33FFDE',
    '#FFB733',
    '#A3FF33',
    '#33A5FF',
    '#FF33A5',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const randomXArray = (num: number, min: number, max: number) => {
  'worklet';
  return new Array(num).fill(0).map(() => getRandomValue(min, max));
};

const boxes = new Array(numberOfBoxes).fill(0).map((_, i) => ({
  clockwise: getRandomBoolean(),
  maxRotation: {
    x: getRandomValue(2 * Math.PI, 20 * Math.PI),
    y: getRandomValue(2 * Math.PI, 20 * Math.PI),
    z: getRandomValue(2 * Math.PI, 20 * Math.PI),
  },
  color: randomColor(),
  randomXs: randomXArray(5, -50, 50), // Array of randomX values for horizontal movement
  randomSpeed: getRandomValue(0.9, 1.3), // Random speed multiplier
  randomOffsetX: getRandomValue(-10, 10), // Random X offset for initial position
  randomOffsetY: getRandomValue(-10, 10), // Random Y offset for initial position
}));

const getPosition = (index: number) => {
  'worklet';
  const x = (index % columns) * size.width;
  const y = Math.floor(index / columns) * rowHeight;

  return {x, y};
};

export const Confetti: React.FC<ConfettiProps> = ({}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    progress.value = withRepeat(withTiming(1, {duration}), -1, false);
  }, []);

  const texture = useTexture(
    <Group>
      {boxes.map((box, index) => {
        const {x, y} = getPosition(index);

        return (
          <Rect
            key={box.maxRotation.x * box.maxRotation.y * box.maxRotation.z}
            rect={rect(x, y, size.width, size.height)}
            color={box.color}
          />
        );
      })}
    </Group>,
    textureSize,
  );

  const sprites = boxes.map((_, index) => {
    const {x, y} = getPosition(index);
    return rect(x, y, size.width, size.height);
  });

  const transforms = useRSXformBuffer(numberOfBoxes, (val, i) => {
    'worklet';
    const piece = boxes[i];

    const {x, y} = getPosition(i); // Already includes random offsets
    const tx = x + piece.randomOffsetX;
    const maxYMovement = -verticalOffset + SCREEN_HEIGHT * 1.5; // Add extra to compensate for different speeds
    let ty = y + piece.randomOffsetY + verticalOffset;

    // Apply random speed to the fall height
    const fallHeight = interpolate(
      progress.value,
      [0, 1],
      [0, maxYMovement * piece.randomSpeed], // Use random speed here
    );

    // Interpolate between randomX values for smooth left-right movement
    const randomX = interpolate(
      progress.value,
      [0, 0.25, 0.5, 0.75, 1],
      piece.randomXs, // Use the randomX array for horizontal movement
    );

    const rotationDirection = piece.clockwise ? 1 : -1;
    const rz = interpolate(
      progress.value,
      [0, 1],
      [0, rotationDirection * piece.maxRotation.z],
    );
    const rx = interpolate(
      progress.value,
      [0, 1],
      [0, rotationDirection * piece.maxRotation.x],
    );
    ty += fallHeight;

    const scale = Math.abs(Math.cos(rx)); // Scale goes from 1 -> 0 -> 1

    const px = size.width / 2;
    const py = size.height / 2;

    // Apply the transformation, including the flipping effect and randomX oscillation
    const s = Math.sin(rz) * scale;
    const c = Math.cos(rz) * scale;

    // Use the interpolated randomX for horizontal oscillation
    val.set(c, s, tx + randomX - c * px + s * py, ty - s * px - c * py);
  });

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <View
        pointerEvents="none"
        style={{
          height: '100%',
          width: '100%',
          position: 'absolute',
          zIndex: 1,
        }}>
        <Canvas
          style={{
            height: '100%',
            width: '100%',
          }}>
          <Atlas image={texture} sprites={sprites} transforms={transforms} />
        </Canvas>
      </View>
      <Button title="Pause" onPress={() => cancelAnimation(progress)} />
      <Button
        title="Play"
        onPress={() => {
          const remaining = duration * (1 - progress.value);
          progress.value = withTiming(1, {duration: remaining}, finished => {
            if (finished) {
              progress.value = 0;
              progress.value = withRepeat(withTiming(1, {duration}), -1, false);
            }
          });
        }}
      />
    </View>
  );
};
