/* eslint-disable react-native/no-inline-styles */
import {
  Canvas,
  Circle,
  Group,
  Line,
  Path,
  SweepGradient,
  usePathValue,
  vec,
} from '@shopify/react-native-skia';
import React from 'react';
import {StyleSheet, View, useWindowDimensions} from 'react-native';
import {
  SensorType,
  interpolate,
  useAnimatedSensor,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';

type DoublePendulumProps = {};

const styles = StyleSheet.create({
  container: {},
});

const r1 = 100;
const r2 = 100;
const m1 = 10;
const m2 = 10;

const gForce = 1;

export const DoublePendulum: React.FC<DoublePendulumProps> = ({}) => {
  const {width, height} = useWindowDimensions();
  const {sensor} = useAnimatedSensor(SensorType.GRAVITY, {interval: 16});
  const cx = width / 2;
  const cy = height / 2;
  const gSensor = useDerivedValue(() => {
    const isNotAvailable =
      sensor.value.x === 0 && sensor.value.y === 0 && sensor.value.z === 0;

    // if sensor is not available, we can use a default value (e.g. simulator)
    if (isNotAvailable) {
      return 9.8;
    }
    return sensor.value.y * -1;
  }, [sensor]);
  const gAnimated = useDerivedValue(
    () => interpolate(gSensor.value, [-10, 10], [-gForce, gForce]),
    [gSensor],
  );

  const a1Animated = useSharedValue(Math.PI / 2);
  const a2Animated = useSharedValue(Math.PI / 2);
  const a1_vAnimated = useSharedValue(0);
  const a2_vAnimated = useSharedValue(0);
  const x1Animated = useSharedValue(0);
  const y1Animated = useSharedValue(0);
  const x2Animated = useSharedValue(0);
  const y2Animated = useSharedValue(0);
  const p0 = useDerivedValue(() => ({x: cx, y: cy}), [cx, cy]);
  const p1 = useDerivedValue(
    () => ({x: x1Animated.value, y: y1Animated.value}),
    [x1Animated, y1Animated],
  );
  const p2 = useDerivedValue(
    () => ({x: x2Animated.value, y: y2Animated.value}),
    [x2Animated, y2Animated],
  );
  const points = useSharedValue<{x: number; y: number}[]>([]);

  const frameRate = 30;
  const fps = 1000 / frameRate;
  const time = useSharedValue(0);

  useFrameCallback(frameInfo => {
    const g = gAnimated.value;

    let a1 = a1Animated.value;
    let a2 = a2Animated.value;
    let a1_v = a1_vAnimated.value;
    let a2_v = a2_vAnimated.value;

    let num1 = -g * (2 * m1 + m2) * Math.sin(a1);
    let num2 = -m2 * g * Math.sin(a1 - 2 * a2);
    let num3 = -2 * Math.sin(a1 - a2) * m2;
    let num4 = a2_v * a2_v * r2 + a1_v * a1_v * r1 * Math.cos(a1 - a2);
    let den = r1 * (2 * m1 + m2 - m2 * Math.cos(2 * a1 - 2 * a2));
    const a1_a = (num1 + num2 + num3 * num4) / den;

    num1 = 2 * Math.sin(a1 - a2);
    num2 = a1_v * a1_v * r1 * (m1 + m2);
    num3 = g * (m1 + m2) * Math.cos(a1);
    num4 = a2_v * a2_v * r2 * m2 * Math.cos(a1 - a2);
    den = r2 * (2 * m1 + m2 - m2 * Math.cos(2 * a1 - 2 * a2));
    const a2_a = (num1 * (num2 + num3 + num4)) / den;

    const x1 = r1 * Math.sin(a1);
    const y1 = r1 * Math.cos(a1);

    const x2 = x1 + r2 * Math.sin(a2);
    const y2 = y1 + r2 * Math.cos(a2);

    a1_v += a1_a;
    a2_v += a2_a;
    a1 += a1_v;
    a2 += a2_v;

    a1_v *= 0.998;
    a2_v *= 0.998;

    const now = frameInfo.timestamp - time.value;
    if (now > fps) {
      time.value = frameInfo.timestamp;

      const nextPoints = {x: x2 + cx, y: y2 + cy};
      points.value = [...points.value, nextPoints];

      //   points.value = points.value.filter((_, i) => i < 500);
      points.value = points.value.slice(-100);
    }

    a1Animated.value = a1;
    a2Animated.value = a2;
    a1_vAnimated.value = a1_v;
    a2_vAnimated.value = a2_v;

    x1Animated.value = x1 + cx;
    y1Animated.value = y1 + cy;
    x2Animated.value = x2 + cx;
    y2Animated.value = y2 + cy;
  });

  const trace = usePathValue(path => {
    'worklet';

    const first = points.value[0];
    if (!first) {
      return;
    }
    path.moveTo(first.x, first.y);

    points.value.forEach(({x, y}) => {
      path.lineTo(x, y);
    });
  });

  return (
    <View style={styles.container}>
      <Canvas style={{width, height, backgroundColor: 'white'}}>
        <Group>
          <Path path={trace} style={'stroke'} strokeWidth={0.6}>
            <SweepGradient
              c={vec(cx, cy)}
              colors={['cyan', 'magenta', 'blue', 'cyan']}
            />
          </Path>

          <Line p1={p1} p2={p2} strokeWidth={2} />
          <Line p1={p0} p2={p1} strokeWidth={2} />

          <Circle cx={x1Animated} cy={y1Animated} r={m1} />
          <Circle cx={x2Animated} cy={y2Animated} r={m2} />
        </Group>
      </Canvas>
    </View>
  );
};
