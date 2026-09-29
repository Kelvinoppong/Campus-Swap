import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, layout, radius, type } from '@/theme';

type Variant = 'crimson' | 'ivory' | 'outline';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** The 56px fully-rounded button used on every screen. */
export function Button({
  label,
  onPress,
  variant = 'crimson',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        VARIANTS[variant].container,
        pressed && !isDisabled ? VARIANTS[variant].pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={VARIANTS[variant].label.color} />
      ) : (
        <Text style={[type.button, VARIANTS[variant].label]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: layout.buttonHeight,
    borderRadius: layout.buttonHeight / 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  disabled: { opacity: 0.55 },
});

const VARIANTS: Record<
  Variant,
  { container: ViewStyle; pressed: ViewStyle; label: { color: string } }
> = {
  crimson: {
    container: { backgroundColor: colors.crimson },
    pressed: { backgroundColor: colors.crimsonDark },
    label: { color: colors.white },
  },
  ivory: {
    container: { backgroundColor: colors.ivory },
    pressed: { backgroundColor: colors.sand },
    label: { color: colors.crimson },
  },
  outline: {
    container: { borderWidth: 1.5, borderColor: colors.ink, borderRadius: radius.pill },
    pressed: { backgroundColor: colors.sand },
    label: { color: colors.ink },
  },
};
