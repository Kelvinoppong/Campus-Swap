import { useEffect } from 'react';
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors, fonts, motion } from '@/theme';

interface ScriptWatermarkProps {
  children: string;
  size: number;
  color?: string;
  /** Degrees; the mockups tilt these words -6 to -10. */
  rotate?: number;
  /** How far the word slides before coming back. 0 pins it in place. */
  driftBy?: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
}

/**
 * The oversized Pinyon Script words behind the crimson panels ("campus",
 * "swap", "sell", "seller", "deal"). Decorative only, so it is hidden from
 * screen readers.
 */
export function ScriptWatermark({
  children,
  size,
  color = colors.crimsonScript,
  rotate = 0,
  driftBy = 0,
  duration = motion.drift,
  style,
}: ScriptWatermarkProps) {
  const progress = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion || driftBy === 0) return;
    progress.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [driftBy, duration, progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * -driftBy }, { rotate: `${rotate}deg` }],
  }));

  return (
    <Animated.Text
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      numberOfLines={1}
      style={[
        styles.text,
        { fontSize: size, lineHeight: size * 1.1, color },
        animatedStyle,
        style,
      ]}
    >
      {children}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: {
    position: 'absolute',
    fontFamily: fonts.script,
  },
});
