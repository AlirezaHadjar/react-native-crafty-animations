/* eslint-disable react-native/no-inline-styles */
import React, {useState} from 'react';
import {Canvas} from '@shopify/react-native-skia';
import {
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {Star} from './Star';
import Slider from '@react-native-community/slider';

const STARS_ARRAY = new Array(100).fill(0);

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

export const Starfield = () => {
  const {width, height} = useWindowDimensions();
  const [speed, setSpeed] = useState(0);
  const [ellipse, setEllipse] = useState(false);

  return (
    <View style={styles.container}>
      <Canvas style={{width, height, backgroundColor: 'black'}}>
        {STARS_ARRAY.map((_, i) => (
          <Star key={i} speed={speed} ellipse={ellipse} />
        ))}
      </Canvas>
      <View style={styles.controlContainer}>
        <View style={styles.switch}>
          <Text style={{color: 'white'}}>Ellipse Mode</Text>
          <Switch value={ellipse} onValueChange={setEllipse} />
        </View>
        <Slider
          style={styles.slider}
          onValueChange={setSpeed}
          step={2}
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
