import { Group, Transforms3d } from "@shopify/react-native-skia";
import {
  cancelAnimation,
  Easing,
  interpolate,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { RotatingText } from "./Text";
import { useEffect } from "react";

type RotatingCircleProps = {
  charArray: string[];
  width: number;
  height: number;
  radius: number;
  fontSize: number;
  opacity: number;
  index: number;
};

export const RotatingCircle: React.FC<RotatingCircleProps> = ({
  charArray,
  fontSize,
  height,
  radius,
  width,
  opacity,
  index,
}) => {
  const circleRotation = Math.PI * 2 + (index * Math.PI) / 4;
  const progress = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      progress.value = withRepeat(
        withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }, index * 200);
    return () => {
      cancelAnimation(progress);
    };
  }, []);
  const ANGLE = (2 * Math.PI) / charArray.length;

  const transform = useDerivedValue<Transforms3d>(() => {
    const scale = interpolate(progress.value, [0, 0.5, 1], [1, 1.15, 1]);
    return [
      { scale },
      { rotateZ: progress.value * circleRotation },
      { translateX: width / 2 },
      { translateY: height / 2 },
    ];
  });

  return (
    <Group transform={transform} origin={{ x: width / 2, y: height / 2 }}>
      {charArray.map((char, index) => (
        <RotatingText
          char={char}
          angle={ANGLE}
          fontSize={fontSize}
          index={index}
          opacity={opacity}
          radius={radius}
          key={char + index}
        />
      ))}
    </Group>
  );
};
