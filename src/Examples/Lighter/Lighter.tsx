/* eslint-disable react-native/no-inline-styles */
import {BlurMask, Canvas, LinearGradient, Path, Transforms3d, useClock, vec} from '@shopify/react-native-skia';
import React, {useEffect} from 'react';
import {StyleSheet, useWindowDimensions} from 'react-native';
import {useDerivedValue, useSharedValue, withSpring} from 'react-native-reanimated';
import {createNoise2D} from '../../utils/noise';

type LighterProps = {};

const styles = StyleSheet.create({
  container: {},
});

const createFlamePath = () => {
  const randomControlX1 = Math.random() * 100 + 350;
  const randomControlY1 = Math.random() * 100 + 400;
  const randomControlX2 = Math.random() * 100 + 400;
  const randomControlY2 = Math.random() * 100 + 450;

  const flamePathData = `M400 550 Q${randomControlX1} ${randomControlY1} ${randomControlX2} ${randomControlY2} Q450 450 400 550`;

  return flamePathData;
};

function getRandomFireColor() {
  const red = Math.floor(Math.random() * 256); // Random value between 0 and 255
  const green = Math.floor(Math.random() * 100); // Limit green to a lower value for more warmth
  const blue = 0; // Set blue to 0 for warmer colors

  return `rgb(${red},${green},${blue})`;
}

const flamesCount = 1;

const flameColor = 'rgb(253, 157, 30)';

const flames = new Array(flamesCount).fill(0).map(() => createFlamePath());

const noiseX1 = createNoise2D();
const noiseX2 = createNoise2D();
const noiseY1 = createNoise2D();
const noiseY2 = createNoise2D();
const noiseTopHeight = createNoise2D();
const noiseTopX = createNoise2D();

export const Lighter: React.FC<LighterProps> = ({}) => {
  const F = 0.0005;
  const AX = 5;
  const AY = 10;
  const ATopHeight = 12;
  const ATopX = 10;
  const {width, height} = useWindowDimensions();
  const clock = useClock();
  const flameHeight = useSharedValue(0);
  const flameWidth = useDerivedValue(() => flameHeight.value / 7, [flameHeight]);

  const animatedFlameHeight = useDerivedValue(() => {
    const d = ATopHeight * noiseTopHeight(0, clock.value * F);
    return d + flameHeight.value;
  }, [clock]);

  const flameTopX = useDerivedValue(() => {
    const d = ATopX * noiseTopX(0, clock.value * F);
    return d;
  }, [clock]);

  const noise = useDerivedValue(() => {
    const dx1 = AX * noiseX1(0, clock.value * F);
    const dx2 = AX * noiseX2(0, clock.value * F);
    const dy1 = AY * noiseY1(0, clock.value * F);
    const dy2 = AY * noiseY2(0, clock.value * F);
    return {dx1, dx2, dy1, dy2};
  }, [clock]);

  const path = useDerivedValue(() => {
    const {dx1, dx2, dy1, dy2} = noise.value;

    const controlX1 = -flameWidth.value + dx1;
    const controlY1 = -animatedFlameHeight.value / 2 + dy1;
    const controlX2 = flameWidth.value + dx2;
    const controlY2 = -animatedFlameHeight.value / 2 + dy2;

    const pathData = `M0 0 Q${controlX1} ${controlY1} ${
      flameTopX.value
    } ${-animatedFlameHeight.value} Q${controlX2} ${controlY2} 0 0`;

    return pathData;
  }, [noise, flameTopX, animatedFlameHeight]);

  useEffect(() => {
    flameHeight.value = withSpring(height / 3, {
      mass: 2.1,
      damping: 10,
      stiffness: 30,
      overshootClamping: false,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 2,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  // const gradientEnd = useDerivedValue(() => vec(0, -flameHeight), [flameHeight]);

  const transform: Transforms3d = [{translateY: height * (2 / 3)}, {translateX: width / 2}];

  return (
    <Canvas style={{width, height, backgroundColor: 'black'}}>
      <Path transform={transform} path={path} color={flameColor}>
        <BlurMask blur={12} style={'normal'} />
      </Path>
      <Path transform={transform} path={path} color="white">
        <LinearGradient
          colors={['rgb(1, 20, 51)', flameColor, 'rgb(255, 255, 255)', 'rgba(255, 255, 255, 0.8)']}
          positions={[0, 0.3, 0.6, 0.99, 1]}
          start={vec(0, 0)}
          end={vec(0, -height / 3)}
        />
      </Path>
    </Canvas>
  );
};
