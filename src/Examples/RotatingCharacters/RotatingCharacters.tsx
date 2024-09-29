import {Canvas} from '@shopify/react-native-skia';
import {
  StyleSheet,
  useWindowDimensions,
  View,
  useColorScheme,
  StatusBar,
} from 'react-native';
import {RotatingCircle} from './Circle';

const CHAR_ARRAY = [
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcwxyz',
  'asdlfjaskiwuyeroixzcvweriuoysxzkz',
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcwxyz',
  'asdlfjaskiwuyeroixzcvweriuoysxzkz',
];
const shuffle = (array: string[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};
const shuffledCharArrays = CHAR_ARRAY.map(array => shuffle(array.split('')));

export const RotatingCharacters = () => {
  const {height, width} = useWindowDimensions();
  const PADDING = 90;
  const RADIUS = (width - PADDING) / 2;
  const scheme = useColorScheme();
  const isDarkMode = scheme === 'dark';

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: isDarkMode ? 'black' : 'white'},
      ]}>
      <StatusBar
        backgroundColor={isDarkMode ? 'black' : 'white'}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      <Canvas style={{width, height}}>
        {shuffledCharArrays.map((charArray, index) => {
          const fontSize = 14 - index;
          const radius = RADIUS - index * 20;
          const opacity = 1 - index * 0.25;

          return (
            <RotatingCircle
              key={index + charArray.join('')}
              index={index}
              charArray={charArray}
              fontSize={fontSize}
              opacity={opacity}
              radius={radius}
              height={height}
              width={width}
            />
          );
        })}
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
