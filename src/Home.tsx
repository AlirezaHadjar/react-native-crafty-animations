/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ExampleScreens} from './screens';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {StackParamList} from './types';

type HomeProps = {};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export const Home: React.FC<HomeProps> = ({}) => {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackScreenProps<StackParamList>['navigation']>();

  return (
    <View style={styles.container}>
      <FlatList
        data={ExampleScreens}
        contentContainerStyle={{
          gap: 16,
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: insets.bottom,
        }}
        renderItem={({item: screen}) => {
          return (
            <TouchableOpacity
              onPress={() => navigation.navigate(screen.name)}
              style={{
                width: '100%',
                height: 80,
                backgroundColor: '#fefefe',
                borderRadius: 16,
                justifyContent: 'center',
                paddingHorizontal: 16,
              }}>
              <Text style={{fontWeight: '500', fontSize: 18, color: 'black'}}>
                {screen.title}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};
