/* eslint-disable react-native/no-inline-styles */
import {Canvas} from '@shopify/react-native-skia';
import React from 'react';
import {useWindowDimensions} from 'react-native';
import {Cell, TappedPosition} from './Cell';
import {runOnJS, useSharedValue} from 'react-native-reanimated';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

type BouncableGridProps = {};

export const BouncableGrid: React.FC<BouncableGridProps> = ({}) => {
  const {width, height} = useWindowDimensions();
  const lastPos = useSharedValue({x: -1, y: -1});
  const tappedPosition = useSharedValue<TappedPosition>({
    pos: {x: -1, y: -1},
    cells: [],
  });
  const cellSize = 45;
  const cols = width / cellSize;
  const rows = height / cellSize;

  const xPosition = useSharedValue(-1);
  const yPosition = useSharedValue(-1);

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
      xPosition.value = x;
      yPosition.value = y;
    })
    .onChange(({x, y}) => {
      if (
        Math.abs(x - lastPos.value.x) > cellSize * 2 ||
        Math.abs(y - lastPos.value.y) > cellSize * 2
      ) {
        lastPos.value = {x, y};
        runOnJS(haptic)('drag');
      }
      xPosition.value = x;
      yPosition.value = y;
    })
    .onEnd(() => {
      xPosition.value = -1;
      yPosition.value = -1;
    })
    .onFinalize(() => {
      xPosition.value = -1;
      yPosition.value = -1;
    });

  const tap = Gesture.Tap().onEnd(({x, y}) => {
    tappedPosition.value = {pos: {x, y}, cells: []};
    runOnJS(haptic)('tap');
  });

  const gesture = Gesture.Race(tap, pan);

  return (
    <GestureDetector gesture={gesture}>
      <Canvas style={{width, height, backgroundColor: 'black'}}>
        {Array.from({length: cols}, (_, colIndex) =>
          Array.from({length: rows}, (__, rowIndex) => {
            return (
              <Cell
                key={`${colIndex}-${rowIndex}`}
                index={colIndex * rows + rowIndex}
                x={colIndex * cellSize + 30}
                y={rowIndex * cellSize + 40}
                xPosition={xPosition}
                yPosition={yPosition}
                cellSize={cellSize}
                tappedPosition={tappedPosition}
              />
            );
          }),
        )}
      </Canvas>
    </GestureDetector>
  );
};
