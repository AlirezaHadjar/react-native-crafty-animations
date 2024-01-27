import {Firework} from './Examples/Firework';
import {FlappyBird} from './Examples/FlappyBird';
import {FractalTree} from './Examples/FractalTree';
import {Phyllotaxis} from './Examples/Phyllotaxis';
import {Starfield, StarfieldAtlas} from './Examples/Starfield';
import {StackParamList} from './types';

type Screen = {
  name: keyof StackParamList;
  title: string;
  component: any;
};

export const ExampleScreens: Screen[] = [
  {
    name: 'Firework',
    title: '🎆 Firework',
    component: Firework,
  },
  {
    name: 'FractalTree',
    title: '🌴 Fractal Tree',
    component: FractalTree,
  },
  {
    name: 'Phyllotaxis',
    title: '🌀 Phyllotaxis',
    component: Phyllotaxis,
  },
  {
    name: 'Starfield',
    title: '✨ Starfield',
    component: Starfield,
  },
  {
    name: 'StarfieldAtlas',
    title: '✨ Starfield - 🏎️ Atlas',
    component: StarfieldAtlas,
  },
  {
    name: 'FlappyBird',
    title: '🐦 Flappy Bird',
    component: FlappyBird,
  },
];
