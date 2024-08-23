import {
  Atlas,
  Canvas,
  Rect,
  rect,
  useRSXformBuffer,
  useTexture,
} from '@shopify/react-native-skia';
import React from 'react';
import {Dimensions} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';

type FallingSandProps = {};

const make2DArray = (cols: number, rows: number) => {
  'worklet';
  let arr = new Array(cols);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = new Array(rows);
    // Fill the array with 0s
    for (let j = 0; j < arr[i].length; j++) {
      arr[i][j] = 0;
    }
  }
  return arr;
};

// How big is each square?
let w = 5;
let hueValue = 200;

const textureSize = {
  width: w,
  height: w,
};

const gravity = 0.1;

const {width, height} = Dimensions.get('window');
const cols = Math.floor(width / w);
const rows = Math.floor(height / w);

const length = Math.min(cols * rows, 100);

export const FallingSand: React.FC<FallingSandProps> = ({}) => {
  const grid = useSharedValue(make2DArray(cols, rows));
  const velocityGrid = useSharedValue(make2DArray(cols, rows));
  const positionedGrid = useDerivedValue(() => {
    let newGrid = [];
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const isActive = grid.value[i][j] > 0;
        if (isActive) {
          newGrid.push({i, j});
        }
      }
    }
    return newGrid;
  }, [grid.value]);

  // Check if a row is within the bounds
  const withinCols = (i: number) => {
    'worklet';
    return i >= 0 && i <= cols - 1;
  };

  // Check if a column is within the bounds
  const withinRows = (j: number) => {
    'worklet';
    return j >= 0 && j <= rows - 1;
  };

  const texture = useTexture(
    <Rect height={w} width={w} color={'#fefefe'} />,
    textureSize,
  );

  const sprites = new Array(length)
    .fill(0)
    .map(() => rect(0, 0, textureSize.width, textureSize.height));

  const transforms = useRSXformBuffer(length, (val, index) => {
    'worklet';
    const pos = positionedGrid.value[index];
    if (pos) {
      const i = pos.i;
      const j = pos.j;

      const x = i * w;
      const y = j * w;

      val.set(1, 0, x, y);
    } else {
      val.set(0, 0, 0, 0);
    }
  });

  const update = (x: number, y: number) => {
    'worklet';

    let mouseCol = Math.floor(x / w);
    let mouseRow = Math.floor(y / w);

    let newGrid = grid.value;
    let newVelocityGrid = velocityGrid.value;

    // Randomly add an area of sand particles
    let matrix = 1;
    let extent = Math.floor(matrix / 2);
    // for (let i = -extent; i <= extent; i++) {
    //   for (let j = -extent; j <= extent; j++) {
    //     if (Math.random() < 0.75) {
    //       let col = mouseCol + i;
    //       let row = mouseRow + j;
    //       console.log(Date.now(), withinCols(col), withinRows(row));
    //       if (withinCols(col) && withinRows(row)) {
    //         newGrid[col][row] = hueValue;
    //         newVelocityGrid[col][row] = 1;
    //       }
    //     }
    //   }
    // }
    if (withinCols(mouseCol) && withinRows(mouseRow)) {
      newGrid[mouseCol][mouseRow] = hueValue;
      newVelocityGrid[mouseCol][mouseRow] = 1;
    }
    // Change the color of the sand over time
    hueValue += 0.5;
    if (hueValue > 360) {
      hueValue = 1;
    }

    grid.value = newGrid;
    velocityGrid.value = newVelocityGrid;
  };

  const pan = Gesture.Pan().onUpdate(e => {
    update(e.x, e.y);
  });

  const longPress = Gesture.LongPress().onStart(e => {
    update(e.x, e.y);
  });
  const tap = Gesture.Tap().onEnd(e => {
    update(e.x, e.y);
  });

  useFrameCallback(() => {
    // Create a 2D array for the next frame of animation
    let nextGrid = make2DArray(cols, rows);
    let nextVelocityGrid = make2DArray(cols, rows);

    // Check every cell
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        // What is the state?
        let state = grid.value[i][j];
        let velocity = velocityGrid.value[i][j];
        let moved = false;
        if (state > 0) {
          let newPos = Math.floor(j + velocity);
          for (let y = newPos; y > j; y--) {
            let below = grid.value[i][y];
            let dir = 1;
            if (Math.random() < 0.5) {
              dir *= -1;
            }
            let belowA = -1;
            let belowB = -1;
            if (withinCols(i + dir)) {
              belowA = grid.value[i + dir][y];
            }
            if (withinCols(i - dir)) {
              belowB = grid.value[i - dir][y];
            }

            if (below === 0) {
              nextGrid[i][y] = state;
              nextVelocityGrid[i][y] = velocity + gravity;
              moved = true;
              break;
            } else if (belowA === 0) {
              nextGrid[i + dir][y] = state;
              nextVelocityGrid[i + dir][y] = velocity + gravity;
              moved = true;
              break;
            } else if (belowB === 0) {
              nextGrid[i - dir][y] = state;
              nextVelocityGrid[i - dir][y] = velocity + gravity;
              moved = true;
              break;
            }
          }
        }

        if (state > 0 && !moved) {
          nextGrid[i][j] = grid.value[i][j];
          nextVelocityGrid[i][j] = velocityGrid.value[i][j] + gravity;
        }
      }
    }
    grid.value = nextGrid;
    velocityGrid.value = nextVelocityGrid;
  });

  const gesture = Gesture.Simultaneous(pan, longPress);
  return (
    <GestureDetector gesture={gesture}>
      <Canvas style={{width, height, backgroundColor: 'black'}}>
        {/* <Atlas image={texture} sprites={sprites} transforms={transforms} /> */}
      </Canvas>
    </GestureDetector>
  );
};
