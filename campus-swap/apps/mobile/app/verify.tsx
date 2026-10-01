import { LIMITS } from '@campus-swap/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { verifySignInCode } from '@/api/auth';
import { ApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Rise } from '@/components/Rise';
import { ScriptWatermark } from '@/components/ScriptWatermark';
import { useAuth } from '@/state/auth';
import { colors, fonts, layout, type } from '@/theme';

export default function VerifyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email: string }>();
  const signIn = useAuth((state) => state.signIn);

  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const digits = Array.from({ length: LIMITS.signInCodeLength }, (_, i) => code[i] ?? '');

  async function handleVerify() {
    if (code.length < LIMITS.signInCodeLength) {
      setError(`Enter all ${LIMITS.signInCodeLength} digits`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const session = await verifySignInCode(email ?? '', code);
      await signIn(session);
      router.replace('/(tabs)');
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not verify that code.');
      // Clearing lets the user retype without deleting six digits by hand.
      setCode('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScriptWatermark size={170} rotate={-8} driftBy={18} style={styles.watermark}>
        verify
      </ScriptWatermark>

      <View style={[styles.content, { paddingTop: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Icon name="back" size={20} color={colors.white} strokeWidth={1.8} />
        </Pressable>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.body}>
            <Rise>
              <Text style={styles.label}>STEP 2 OF 2</Text>
              <Text style={styles.heading}>Check your email</Text>
              <Text style={styles.subtitle}>
                We sent a {LIMITS.signInCodeLength}-digit code to {email}. It expires in{' '}
                {LIMITS.signInCodeTtlMinutes} minutes.
              </Text>
            </Rise>

            <Rise delay={120}>
              <Pressable
                accessibilityRole="none"
                onPress={() => inputRef.current?.focus()}
                style={styles.codeRow}
              >
                {digits.map((digit, index) => (
                  <View
                    key={index}
                    style={[styles.codeBox, index === code.length ? styles.codeBoxActive : null]}
                  >
                    <Text style={styles.codeDigit}>{digit}</Text>
                  </View>
                ))}
              </Pressable>

              {/* One real input behind the boxes: the OS gets a normal field
                  for SMS/email autofill, the design gets six cells. */}
              <TextInput
                ref={inputRef}
                accessibilityLabel={`${LIMITS.signInCodeLength} digit sign-in code`}
                value={code}
                onChangeText={(next) => {
                  setCode(next.replace(/\D/g, '').slice(0, LIMITS.signInCodeLength));
                  if (error) setError(null);
                }}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                autoFocus
                maxLength={LIMITS.signInCodeLength}
                style={styles.hiddenInput}
              />

              {error ? (
                <Text style={styles.error} accessibilityLiveRegion="polite">
                  {error}
                </Text>
              ) : null}
            </Rise>

            <Rise delay={240} style={styles.actions}>
              <Button
                label="Verify and continue"
                variant="ivory"
                loading={submitting}
                onPress={() => {
                  void handleVerify();
                }}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => router.back()}
                style={styles.resend}
              >
                <Text style={styles.resendText}>Use a different email</Text>
              </Pressable>
            </Rise>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.crimson },
  flex: { flex: 1 },
  watermark: { left: -20, top: 150 },
  content: { flex: 1, paddingHorizontal: 24 },
  backButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    marginLeft: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, justifyContent: 'center', gap: 28, paddingBottom: 60 },
  label: { ...type.label, color: 'rgba(255,255,255,0.85)', marginBottom: 10 },
  heading: { ...type.h1, color: colors.white, marginBottom: 10 },
  subtitle: { ...type.body, color: 'rgba(255,255,255,0.88)' },
  codeRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  codeBox: {
    flex: 1,
    height: 60,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBoxActive: { borderColor: colors.gold, borderWidth: 1.5 },
  codeDigit: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.white },
  hiddenInput: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  error: { ...type.meta, color: colors.gold, marginTop: 10 },
  actions: { gap: 14 },
  resend: { minHeight: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center' },
  resendText: { ...type.bodySmall, color: 'rgba(255,255,255,0.88)' },
});
