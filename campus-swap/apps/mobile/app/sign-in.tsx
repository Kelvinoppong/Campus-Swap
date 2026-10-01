import { eduEmailSchema } from '@campus-swap/shared';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { requestSignInCode } from '@/api/auth';
import { ApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Rise } from '@/components/Rise';
import { SIGN_IN_PHOTO } from '@/data/demo';
import { colors, fonts, layout, motion, type } from '@/theme';

const AnimatedImage = Animated.createAnimatedComponent(Image);

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // kenburns: a slow, endless 1.06 -> 1.16 push on the hero photo.
  const zoom = useSharedValue(1.06);
  useEffect(() => {
    if (reduceMotion) return;
    zoom.value = withRepeat(
      withTiming(1.16, { duration: motion.kenburns, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [reduceMotion, zoom]);

  const heroStyle = useAnimatedStyle(() => ({ transform: [{ scale: zoom.value }] }));

  async function handleSubmit() {
    const parsed = eduEmailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Enter your school email');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await requestSignInCode(parsed.data);
      router.push({ pathname: '/verify', params: { email: parsed.data } });
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : 'Could not send the code. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <AnimatedImage
        source={SIGN_IN_PHOTO}
        style={[StyleSheet.absoluteFill, heroStyle]}
        contentFit="cover"
        contentPosition={{ top: '20%', left: '30%' }}
        accessibilityLabel="A smiling student with a backpack walking on campus"
      />
      <LinearGradient
        colors={[
          'rgba(28,20,20,0.45)',
          'rgba(28,20,20,0)',
          'rgba(110,17,20,0.35)',
          'rgba(110,17,20,0.92)',
          colors.crimsonDark,
        ]}
        locations={[0, 0.22, 0.48, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { top: insets.top + 8 }]}>
        <Text style={styles.wordmark}>Campus Swap</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Menu"
          style={styles.iconButton}
          onPress={() => {}}
        >
          <Icon name="menu" size={24} color={colors.white} strokeWidth={1.5} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Rise delay={200} duration={900} distance={20} style={styles.headline}>
            <Text style={styles.headlineDisplay}>trade the</Text>
            <Text style={styles.headlineScript}>semester</Text>
            <Text style={styles.headlineTag}>student to student</Text>
          </Rise>

          <Rise delay={400} duration={900} distance={20}>
            <Text style={styles.subtitle}>
              Consoles, coats, dorm gear, bikes, books and tickets — from people on your campus.
            </Text>
          </Rise>

          <Rise delay={550} duration={900} distance={20} style={styles.field}>
            <Text style={styles.label} nativeID="email-label">
              SCHOOL EMAIL
            </Text>
            <TextInput
              accessibilityLabelledBy="email-label"
              accessibilityLabel="School email"
              value={email}
              onChangeText={(next) => {
                setEmail(next);
                if (error) setError(null);
              }}
              onSubmitEditing={() => {
                void handleSubmit();
              }}
              placeholder="you@yourschool.edu"
              placeholderTextColor="rgba(255,255,255,0.72)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              returnKeyType="go"
              style={[styles.input, error ? styles.inputError : null]}
            />
            {error ? (
              <Text style={styles.error} accessibilityLiveRegion="polite">
                {error}
              </Text>
            ) : null}
          </Rise>

          <Rise delay={700} duration={900} distance={20}>
            <Button
              label="Send sign-in code"
              variant="ivory"
              loading={submitting}
              onPress={() => {
                void handleSubmit();
              }}
            />
          </Rise>

          <Text style={styles.footnote}>Verified .edu students only</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  flex: { flex: 1 },
  header: {
    position: 'absolute',
    left: 22,
    right: 12,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: { fontFamily: fonts.display, fontSize: 25, color: colors.white, letterSpacing: 0.2 },
  iconButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    gap: 14,
  },
  headline: { height: 150, justifyContent: 'flex-start' },
  headlineDisplay: {
    ...type.hero,
    color: colors.white,
  },
  headlineScript: {
    position: 'absolute',
    left: 30,
    top: 24,
    ...type.heroScript,
    color: colors.white,
  },
  headlineTag: {
    position: 'absolute',
    right: 8,
    bottom: 0,
    fontFamily: fonts.script,
    fontSize: 26,
    lineHeight: 32,
    color: colors.gold,
  },
  subtitle: {
    ...type.body,
    color: 'rgba(255,255,255,0.88)',
  },
  field: { gap: 8 },
  label: {
    ...type.label,
    color: 'rgba(255,255,255,0.85)',
  },
  input: {
    height: 54,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.12)',
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.white,
  },
  inputError: { borderColor: colors.gold },
  error: { ...type.meta, color: colors.gold, paddingHorizontal: 18 },
  footnote: {
    ...type.meta,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.8)',
  },
});
