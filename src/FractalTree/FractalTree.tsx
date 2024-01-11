/* eslint-disable react-native/no-inline-styles */
import {Canvas, vec} from '@shopify/react-native-skia';
import React, {useRef, useState} from 'react';
import {Button, StyleSheet, View, useWindowDimensions} from 'react-native';
import {Branch, BranchRef} from './Branch';
import {useSharedValue} from 'react-native-reanimated';

type FractalTreeProps = {};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export const FractalTree: React.FC<FractalTreeProps> = ({}) => {
  const {width, height} = useWindowDimensions();
  const color = 'brown';
  const limit = 5;
  const ref = useRef<BranchRef>(null);
  const [maxLevel, setMaxLevel] = useState(1);

  const a = useSharedValue(vec(width / 2, height - 200));

  return (
    <View style={styles.container}>
      <Canvas style={{width, height, backgroundColor: 'white'}}>
        <Branch
          begin={a}
          length={100}
          angle={-Math.PI / 2}
          color={color}
          level={1}
          maxLevel={maxLevel}
          limit={limit}
          branchRef={ref}
        />
      </Canvas>
      <View
        style={{position: 'absolute', bottom: 50, alignSelf: 'center', gap: 8}}>
        <Button
          title={'Add Level'}
          disabled={maxLevel >= limit}
          onPress={() => setMaxLevel(lvl => lvl + 1)}
        />
        <Button
          title={'Reset'}
          onPress={() => {
            ref.current?.reset();
            setMaxLevel(1);
          }}
        />
      </View>
    </View>
  );
};
