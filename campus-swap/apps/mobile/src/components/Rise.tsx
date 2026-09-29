import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

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
 */
export function Rise({
  children,
  delay = 0,
  duration = motion.rise.duration,
  distance = motion.rise.distance,
  style,
}: RiseProps) {
  const reduceMotion = useReducedMotion();

  return (
    <Animated.View
      style={style}
      entering={
        reduceMotion ? undefined : FadeInDown.duration(duration).delay(delay).withInitialValues({
          transform: [{ translateY: distance }],
        })
      }
    >
      {children}
    </Animated.View>
  );
}
