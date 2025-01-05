import {
  Atlas,
  Canvas,
  Paint,
  Rect,
  rect,
  useRSXformBuffer,
  useTexture,
  LinearGradient,
  vec,
  Shadow,
  Group,
  Mask,
  Path,
} from '@shopify/react-native-skia';
import React from 'react';
import {Dimensions} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import {
  AnimatedIntervalID,
  clearAnimatedInterval,
  setAnimatedInterval,
} from '../../hooks/useAnimatedInterval';
import {
  AnimatedTimeoutID,
  clearAnimatedTimeout,
  setAnimatedTimeout,
} from '../../hooks/useAnimatedTimeout';

type FallingSandProps = {};

type Particle = {
  x: number;
  y: number;
  velocity: number;
};

// Replace make2DArray with a function that creates an empty array
const createParticleArray = () => {
  'worklet';
  return [] as Particle[];
};

// How big is each square?
const w = 10;

const textureSize = {
  width: w,
  height: w,
};

const gravity = 10;

const {width, height} = Dimensions.get('window');
const cols = Math.floor(width / w);
const rows = Math.floor(height / w);

const length = cols * rows;

// Add this constant at the top with other constants
const MAX_MOVING_PARTICLES = 150;

export const FallingSand: React.FC<FallingSandProps> = ({}) => {
  const particles = useSharedValue<Particle[]>(createParticleArray());
  const fixedParticles = useSharedValue<Particle[]>(createParticleArray());
  const fixedParticlesPath = useDerivedValue(() => {
    'worklet';
    let path = '';
    for (const particle of fixedParticles.value) {
      const x = particle.x * w;
      const y = particle.y * w;
      path += `M ${x} ${y} h ${w} v ${w} h -${w} Z `;
    }
    return path;
  });

  // Update transforms to only handle moving particles
  const transforms = useRSXformBuffer(MAX_MOVING_PARTICLES, (val, index) => {
    'worklet';
    const particle = particles.value[index];
    if (particle) {
      const x = particle.x * w;
      const y = particle.y * w;
      val.set(1, 0, x, y);
    } else {
      val.set(0, 0, 0, 0);
    }
  });

  // Update sprites array to match moving particles
  const sprites = useDerivedValue(() => {
    'worklet';
    return new Array(MAX_MOVING_PARTICLES)
      .fill(0)
      .map(() => rect(0, 0, textureSize.width, textureSize.height));
  });

  // Check if a row is within the bounds
  const withinCols = (i: number) => {
    'worklet';
    return i >= 0 && i <= cols - 1;
  };

  // Check if a column is within the bounds
  const withinRows = (j: number) => {
    'worklet';
    return j >= 0 && j <= rows - 1;
  };

  const update = (x: number, y: number) => {
    'worklet';
    const mouseCol = Math.floor(x / w);
    const mouseRow = Math.floor(y / w);

    if (withinCols(mouseCol) && withinRows(mouseRow)) {
      // Only add new particle if we haven't reached the limit
      if (particles.value.length < MAX_MOVING_PARTICLES) {
        particles.value = [
          ...particles.value,
          {
            x: mouseCol,
            y: mouseRow,
            velocity: 1,
          },
          {
            x: mouseCol,
            y: mouseRow + 1,
            velocity: 1,
          },
          {
            x: mouseCol,
            y: mouseRow + 2,
            velocity: 1,
          },
        ];
      }
    }
  };

  const texture = useTexture(
    <Rect x={0} y={0} height={w} width={w} color={'#fefefe'} />,
    textureSize,
  );

  const longPressInterval = useSharedValue<AnimatedIntervalID>(-1);
  const panInterval = useSharedValue<AnimatedIntervalID>(-1);
  const panTimeout = useSharedValue<AnimatedTimeoutID>(-1);
  const lastUpdate = useSharedValue({value: {x: 0, y: 0}, timestamp: 0});

  const pan = Gesture.Pan()
    .onUpdate(e => {
      clearAnimatedInterval(panInterval.value);
      clearAnimatedTimeout(panTimeout.value);
      update(e.x, e.y);
      lastUpdate.value = {value: {x: e.x, y: e.y}, timestamp: Date.now()};
      panTimeout.value = setAnimatedTimeout(() => {
        panInterval.value = setAnimatedInterval(() => {
          update(e.x, e.y);
        }, 10);
      }, 30);
    })
    .onEnd(() => {
      clearAnimatedInterval(panInterval.value);
      clearAnimatedTimeout(panTimeout.value);
    });

  const longPress = Gesture.LongPress()
    .onStart(e => {
      update(e.x, e.y);
      longPressInterval.value = setAnimatedInterval(() => {
        update(e.x, e.y);
      }, 10);
    })
    .onEnd(() => {
      clearAnimatedInterval(longPressInterval.value);
    });

  useFrameCallback(() => {
    const nextParticles: Particle[] = [];
    const newFixedParticles: Particle[] = [];

    // Helper function to check occupation including nextParticles
    const isPositionOccupied = (x: number, y: number) => {
      'worklet';
      return (
        nextParticles.some(p => p.x === x && p.y === y) ||
        fixedParticles.value.some(p => p.x === x && p.y === y)
      );
    };

    // Process each particle
    for (const particle of particles.value) {
      // Only fix particles if they hit bottom or a fixed particle
      if (particle.y >= rows - 1) {
        newFixedParticles.push({
          ...particle,
          velocity: 0,
        });
        continue;
      }

      const dir = Math.random() < 0.5 ? 1 : -1;

      // Check if the space below is occupied by any particle (moving or fixed)
      if (!isPositionOccupied(particle.x, particle.y + 1)) {
        // Move straight down
        nextParticles.push({
          ...particle,
          y: particle.y + 1,
          velocity: particle.velocity + gravity,
        });
      }
      // Try to slide diagonally
      else if (
        withinCols(particle.x + dir) &&
        !isPositionOccupied(particle.x + dir, particle.y + 1)
      ) {
        nextParticles.push({
          ...particle,
          x: particle.x + dir,
          y: particle.y + 1,
          velocity: particle.velocity + gravity,
        });
      }
      // Try to slide the other diagonal
      else if (
        withinCols(particle.x - dir) &&
        !isPositionOccupied(particle.x - dir, particle.y + 1)
      ) {
        nextParticles.push({
          ...particle,
          x: particle.x - dir,
          y: particle.y + 1,
          velocity: particle.velocity + gravity,
        });
      }
      // If can't move in any direction, check if it should be fixed
      else if (
        fixedParticles.value.some(
          p => p.x === particle.x && p.y === particle.y + 1,
        )
      ) {
        newFixedParticles.push({
          ...particle,
          velocity: 0,
        });
      }
      // If still moving but temporarily blocked, keep in moving particles
      else {
        nextParticles.push(particle);
      }
    }

    particles.value = nextParticles;
    fixedParticles.value = [...fixedParticles.value, ...newFixedParticles];
  });

  const gesture = Gesture.Simultaneous(pan, longPress);
  return (
    <GestureDetector gesture={gesture}>
      <Canvas style={{width, height, backgroundColor: 'black'}}>
        <Mask
          mask={
            <Group>
              <Atlas
                image={texture}
                sprites={sprites.value}
                transforms={transforms}
              />
              <Path path={fixedParticlesPath} color="white" />
            </Group>
          }>
          <Rect x={0} y={0} width={width} height={height}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(width, height)}
              colors={[
                // Reds to Oranges
                '#FF0000',
                '#FF1A00',
                '#FF3300',
                '#FF4D00',
                '#FF6600',
                // Oranges to Yellows
                '#FF8000',
                '#FF9900',
                '#FFB300',
                '#FFCC00',
                '#FFE600',
                // Yellows to Greens
                '#FFFF00',
                '#E6FF00',
                '#CCFF00',
                '#B3FF00',
                '#99FF00',
                // Greens to Teals
                '#80FF00',
                '#66FF00',
                '#4DFF00',
                '#33FF00',
                '#1AFF00',
                // Teals to Blues
                '#00FF00',
                '#00FF1A',
                '#00FF33',
                '#00FF4D',
                '#00FF66',
                // Blues to Indigos
                '#00FF80',
                '#00FF99',
                '#00FFB3',
                '#00FFCC',
                '#00FFE6',
                // Indigos to Violets
                '#00FFFF',
                '#00E6FF',
                '#00CCFF',
                '#00B3FF',
                '#0099FF',
                // Violets to Purples
                '#0080FF',
                '#0066FF',
                '#004DFF',
                '#0033FF',
                '#001AFF',
                // Back to Red (for smooth transition if looped)
                '#FF0000',
              ]}
            />
          </Rect>
        </Mask>
      </Canvas>
    </GestureDetector>
  );
};
