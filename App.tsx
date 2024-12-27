/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {StatusBar} from 'react-native';
import {StackParamList} from './src/types';
import {NavigationContainer} from '@react-navigation/native';
import {ExampleScreens} from './src/screens';
import {Home} from './src/Home';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';

const Stack = createNativeStackNavigator<StackParamList>();

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated runs in strict mode by default
});

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <StatusBar hidden />
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="Home"
              key="Home"
              component={Home}
              options={{
                title: 'Creative Animations',
              }}
            />
            {ExampleScreens.map(screen => (
              <Stack.Screen
                name={screen.name}
                key={screen.name}
                component={screen.component}
                options={{
                  title: screen.title,
                  headerShown: false,
                }}
              />
            ))}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
