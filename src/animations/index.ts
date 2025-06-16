import {
  withTiming,
  withSpring,
  withSequence,
  Easing,
  SharedValue,
} from 'react-native-reanimated';

// Animation Presets
export const animationPresets = {
  timing: {
    fast: { duration: 150, easing: Easing.out(Easing.quad) },
    normal: { duration: 300, easing: Easing.out(Easing.quad) },
    slow: { duration: 500, easing: Easing.out(Easing.quad) },
  },
  
  spring: {
    gentle: { damping: 20, stiffness: 90 },
    bouncy: { damping: 10, stiffness: 150 },
  },
};

// Animation Functions
export const fadeIn = (sharedValue: SharedValue<number>, duration: number = 300) => {
  sharedValue.value = withTiming(1, { duration, easing: Easing.out(Easing.quad) });
};

export const fadeOut = (sharedValue: SharedValue<number>, duration: number = 300) => {
  sharedValue.value = withTiming(0, { duration, easing: Easing.in(Easing.quad) });
};

export const scaleIn = (sharedValue: SharedValue<number>, duration: number = 300) => {
  sharedValue.value = 0.8;
  sharedValue.value = withTiming(1, { duration, easing: Easing.out(Easing.back(1.2)) });
};

export const slideInUp = (sharedValue: SharedValue<number>, duration: number = 300) => {
  sharedValue.value = 50;
  sharedValue.value = withTiming(0, { duration, easing: Easing.out(Easing.quad) });
};

export const pulseAnimation = (sharedValue: SharedValue<number>) => {
  sharedValue.value = withSequence(
    withTiming(1.1, { duration: 300 }),
    withTiming(1, { duration: 300 })
  );
};

export const springScale = (sharedValue: SharedValue<number>, toValue: number = 1) => {
  sharedValue.value = withSpring(toValue, animationPresets.spring.gentle);
}; 