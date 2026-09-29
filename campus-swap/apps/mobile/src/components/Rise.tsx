import { useEffect } from 'react';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { motion } from '@/theme';

interface RiseProps {
  children: ReactNode;
  /** Milliseconds to wait before starting; stagger lists with `index * 100`. */
  delay?: number;
  duration?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * The `rise` animation from design/DESIGN.md: fade in while moving up ~18px.
 * With the OS reduce-motion setting on, the content just appears.
 *
 * This drives a shared value rather than a Reanimated `entering` layout
 * animation, because layout animations do not run in the browser and would
 * leave every wrapped element stuck at opacity 0 in the web build.
 */
export function Rise({
  children,
  delay = 0,
  duration = motion.rise.duration,
  distance = motion.rise.distance,
  style,
}: RiseProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) }),
    );
  }, [delay, duration, progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * distance }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
