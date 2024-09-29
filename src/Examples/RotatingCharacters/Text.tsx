import { matchFont, Text, Transforms3d } from "@shopify/react-native-skia";
import { Platform, useColorScheme } from "react-native";
import { useDerivedValue } from "react-native-reanimated";

type RotatingTextProps = {
  char: string;
  radius: number;
  fontSize: number;
  opacity: number;
  angle: number;
  index: number;
};

export const RotatingText: React.FC<RotatingTextProps> = ({
  char,
  fontSize,
  opacity,
  radius,
  angle,
  index,
}) => {
  const fontFamily = Platform.select({ ios: "Helvetica", default: "serif" });
  const fontStyle = {
    fontFamily,
    fontSize: fontSize,
    fontWeight: "bold",
  } as const;
  const font = matchFont(fontStyle);
  const scheme = useColorScheme();
  const isDarkMode = scheme === "dark";

  const transform = useDerivedValue<Transforms3d>(() => {
    return [
      { translateX: radius * Math.cos(index * angle) },
      { translateY: radius * Math.sin(index * angle) },

      { translateX: -fontSize / 2 },
      { translateY: -fontSize / 2 },
      { rotateZ: angle * index + Math.PI / 2 },
      { translateX: fontSize / 2 },
      { translateY: fontSize / 2 },
    ] as const;
  });

  return (
    <Text
      color={isDarkMode ? "white" : "black"}
      origin={{ x: fontSize / 2, y: fontSize / 2 }}
      key={index + char}
      opacity={opacity}
      transform={transform}
      font={font}
      text={char}
    />
  );
};
