/* eslint-disable react-native/no-inline-styles */
import React, {useState} from 'react';
import {
  Atlas,
  Canvas,
  Rect,
  interpolate,
  rect,
  useRSXformBuffer,
  useTextureValue,
} from '@shopify/react-native-skia';
import {StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import {
  useDerivedValue,
  useSharedValue,
  useFrameCallback,
} from 'react-native-reanimated';
import {generateRandomStarColor} from './utils';
import Slider from '@react-native-community/slider';

const length = 800;
// const STARS_ARRAY = new Array(length).fill(0);
const size = 8;
// const stroke = 3;

const getRandomPos = (min: number, max: number) => {
  'worklet';
  return Math.random() * (max - min) + min;
};

const textureSize = {
  width: size,
  height: size,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controlContainer: {
    position: 'absolute',
    width: '90%',
    backgroundColor: 'black',
    shadowColor: 'white',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    borderRadius: 100,
    alignSelf: 'center',
    bottom: 50,
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  switch: {
    flexDirection: 'row-reverse',
    gap: 16,
    alignItems: 'center',
    width: '100%',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  slider: {width: '90%', height: 40},
});

const colors = new Array(length).fill(0).map(() => generateRandomStarColor());

export const StarfieldAtlas = () => {
  const {width, height} = useWindowDimensions();
  const [speed, setSpeed] = useState(1);
  // const [ellipse, setEllipse] = useState(false);
  const color = generateRandomStarColor();
  const animatedSpeed = useDerivedValue(() => speed, [speed]);
  const maxDist = width;
  //   const pz = useSharedValue(z.value);
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
    <Rect
      // r={20}
      height={size}
      width={size}
      color={color}
    />,
    textureSize,
  );

  const sprites = new Array(length).fill(0).map(() =>
    // rrect(
    //   {height: textureSize.height, width: textureSize.width, x: 0, y: 0},
    //   textureSize.width / 2,
    //   textureSize.height / 2,
    // ),
    rect(0, 0, textureSize.width, textureSize.height),
  );

  const transforms = useRSXformBuffer(length, (val, i) => {
    'worklet';
    const tx = xs.value[i];
    const ty = ys.value[i];
    const newSize = interpolate(zs.value[i], [0, maxDist], [size, 0]);
    const scale = newSize / size;

    const factor = maxDist / zs.value[i];
    const cx = tx * factor + width / 2;
    const cy = ty * factor + height / 2;

    val.set(scale, 0, cx, cy);
  });

  useFrameCallback(() => {
    // Increment a value on every frame update
    // pz.value = z.value;
    const newZs = zs.value.map(z => z - animatedSpeed.value);
    zs.value = newZs;

    const factors = zs.value.map(z => maxDist / z);
    const cxs = xs.value.map((x, i) => x * factors[i]);
    const cys = ys.value.map((y, i) => y * factors[i]);

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

  return (
    <View style={styles.container}>
      <Canvas
        style={{width, height, backgroundColor: 'black'}}
        mode="continuous">
        <Atlas
          image={texture}
          sprites={sprites}
          transforms={transforms}
          colors={colors}
        />
      </Canvas>
      <View style={styles.controlContainer}>
        <View style={styles.switch}>
          <Text style={{color: 'white'}}>Ellipse Mode</Text>
          {/* <Switch value={ellipse} onValueChange={setEllipse} /> */}
        </View>
        <Slider
          style={styles.slider}
          onValueChange={setSpeed}
          step={1}
          minimumValue={0}
          maximumValue={20}
          tapToSeek
          minimumTrackTintColor="#464646"
          maximumTrackTintColor="#fff"
        />
      </View>
    </View>
  );
};
