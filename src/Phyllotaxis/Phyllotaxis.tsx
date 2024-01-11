/* eslint-disable react-native/no-inline-styles */
import {Canvas, Circle} from '@shopify/react-native-skia';
import React, {useEffect} from 'react';
import {Button, StyleSheet, View, useWindowDimensions} from 'react-native';
import {hsbToRgb} from './utils';

type PhyllotaxisProps = {};

const styles = StyleSheet.create({
  container: {},
});

const c = 10;

const getFactor = (mode: 1 | 2 | 3) => {
  switch (mode) {
    case 1:
      return 137.5;
    case 2:
      return 137.3;
    case 3:
      return 137.6;
  }
};

export const Phyllotaxis: React.FC<PhyllotaxisProps> = ({}) => {
  const {width, height} = useWindowDimensions();
  const [points, setPoints] = React.useState<
    {x: number; y: number; a: number; n: number}[]
  >([]);
  const [mode, setMode] = React.useState<1 | 2 | 3>(1);

  useEffect(() => {
    setPoints([]);
    const interval = setInterval(() => {
      setPoints(prev => {
        const n = prev.length;
        const a = n * getFactor(mode);
        const radius = c * Math.sqrt(n);
        const x = radius * Math.cos(a) + width / 2;
        const y = radius * Math.sin(a) + height / 2;

        if (x > width || y > height) {
          clearInterval(interval);
          return prev;
        } else {
          return [...prev, {x, y, a, n}];
        }
      });
    }, 10);
    return () => clearInterval(interval);
  }, [height, width, mode]);

  return (
    <View style={styles.container}>
      <Canvas style={{width, height, backgroundColor: 'black'}}>
        {points.map(({x, y, n}, index) => {
          const rgb = hsbToRgb(n % 256, 1, 1);

          const color = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
          return <Circle key={index} cx={x} cy={y} r={5} color={color} />;
        })}
      </Canvas>
      <View
        style={{position: 'absolute', bottom: 50, alignSelf: 'center', gap: 8}}>
        <Button
          title={'Mode 1'}
          color={mode !== 1 ? 'grey' : 'white'}
          onPress={() => {
            setMode(1);
          }}
        />
        <Button
          title={'Mode 2'}
          color={mode !== 2 ? 'grey' : 'white'}
          onPress={() => {
            setMode(2);
          }}
        />
        <Button
          title={'Mode 3'}
          color={mode !== 3 ? 'grey' : 'white'}
          onPress={() => {
            setMode(3);
          }}
        />
      </View>
    </View>
  );
};
