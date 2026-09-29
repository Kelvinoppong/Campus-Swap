import { formatCents } from '@campus-swap/shared';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Rise } from '@/components/Rise';
import { ScriptWatermark } from '@/components/ScriptWatermark';
import { findListing } from '@/data/demo';
import { colors, fonts, layout, motion, type } from '@/theme';

interface Bubble {
  id: string;
  from: 'me' | 'them';
  body: string;
}

const OPENING: Bubble[] = [
  { id: 'm1', from: 'me', body: 'Hi! Is this still available?' },
  { id: 'm2', from: 'them', body: "Yes it is. I'm free after 3 most days." },
  { id: 'm3', from: 'me', body: 'Would you take $40?' },
  { id: 'm4', from: 'them', body: 'Deal. Sending a meetup time.' },
];

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const listing = findListing(id ?? '');
  const [messages, setMessages] = useState<Bubble[]>(OPENING);
  const [draft, setDraft] = useState('');
  const [meetupStatus, setMeetupStatus] = useState<'proposed' | 'accepted'>('proposed');

  if (!listing) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>That conversation is gone.</Text>
      </View>
    );
  }

  const offerCents = Math.round(listing.priceCents * 0.9);

  function send() {
    const body = draft.trim();
    if (!body) return;
    // Optimistic append; Weeks 5–7 replaces this with a `message:send` socket
    // emit whose ack reconciles the row by clientId.
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, from: 'me', body }]);
    setDraft('');
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }

  return (
    <View style={styles.screen}>
      <ScriptWatermark size={200} rotate={-10} color={colors.ivoryScript} style={styles.watermark}>
        deal
      </ScriptWatermark>

      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={styles.iconButton}
        >
          <Icon name="back" size={20} color={colors.white} strokeWidth={1.8} />
        </Pressable>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{listing.seller.initials}</Text>
        </View>
        <View style={styles.headerMeta}>
          <Text style={styles.headerName}>{listing.seller.name}</Text>
          <Text style={styles.headerStatus}>Online now</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Listing: ${listing.title}`}
        onPress={() => router.push({ pathname: '/listing/[id]', params: { id: listing.id } })}
        style={styles.listingStrip}
      >
        <Image source={listing.photo} style={styles.stripPhoto} contentFit="cover" />
        <View style={styles.stripMeta}>
          <Text numberOfLines={1} style={styles.stripTitle}>
            {listing.title}
          </Text>
          <Text style={styles.stripPrice}>Listed at {formatCents(listing.priceCents)}</Text>
        </View>
        <View style={styles.offerPill}>
          <Text style={styles.offerPillText}>Offer {formatCents(offerCents)}</Text>
        </View>
      </Pressable>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 60}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.thread}
        >
          <Text style={styles.dayMark}>TODAY</Text>

          {messages.map((message, index) => (
            <Rise key={message.id} delay={Math.min(index * 200, 800)} duration={400} distance={12}>
              <View
                style={[
                  styles.bubble,
                  message.from === 'me' ? styles.bubbleMine : styles.bubbleTheirs,
                ]}
              >
                <Text style={message.from === 'me' ? styles.bubbleTextMine : styles.bubbleText}>
                  {message.body}
                </Text>
              </View>
            </Rise>
          ))}

          <Rise delay={900} duration={500}>
            <View style={styles.meetupCard}>
              <Text style={styles.meetupLabel}>
                {meetupStatus === 'accepted' ? 'MEETUP CONFIRMED' : 'MEETUP PROPOSED'}
              </Text>
              <Text style={styles.meetupPlace}>
                {listing.meetupSpot ?? 'Digital transfer after payment'}
              </Text>
              <Text style={styles.meetupWhen}>
                Thursday, 3:00 PM · agreed price {formatCents(offerCents)}
              </Text>
              {meetupStatus === 'proposed' ? (
                <View style={styles.meetupActions}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setMeetupStatus('accepted')}
                    style={styles.acceptButton}
                  >
                    <Text style={styles.acceptText}>Accept</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" style={styles.suggestButton}>
                    <Text style={styles.suggestText}>Suggest another</Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={styles.meetupConfirmed}>
                  See you there. Meet in public and bring exact cash.
                </Text>
              )}
            </View>
          </Rise>

          <TypingIndicator />
        </ScrollView>

        <View style={[styles.composer, { paddingBottom: insets.bottom + 10 }]}>
          <TextInput
            accessibilityLabel="Message"
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={send}
            placeholder={`Message ${listing.seller.name.split(' ')[0]}…`}
            placeholderTextColor={colors.muted}
            returnKeyType="send"
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            onPress={send}
            style={styles.sendButton}
          >
            <Icon name="send" size={20} color={colors.white} strokeWidth={1.8} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/** Three dots that lift in sequence, matching the `dot` animation. */
function TypingIndicator() {
  return (
    <View style={styles.typing} accessibilityLabel="The seller is typing">
      {[0, 1, 2].map((index) => (
        <TypingDot key={index} index={index} />
      ))}
    </View>
  );
}

function TypingDot({ index }: { index: number }) {
  const reduceMotion = useReducedMotion();
  const lift = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    lift.value = withDelay(
      index * 150,
      withRepeat(
        withTiming(1, { duration: motion.dot / 2, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, [index, lift, reduceMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.25 + lift.value * 0.75,
    transform: [{ translateY: lift.value * -3 }],
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  flex: { flex: 1 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ivory },
  missingText: { ...type.body, color: colors.muted },
  watermark: { left: -30, top: 330 },
  header: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.crimson,
  },
  iconButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.ivory,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.crimson },
  headerMeta: { flex: 1, gap: 2 },
  headerName: { fontFamily: fonts.display, fontSize: 19, color: colors.white },
  headerStatus: { ...type.meta, color: 'rgba(255,255,255,0.85)' },
  listingStrip: {
    margin: 14,
    marginBottom: 0,
    padding: 8,
    borderRadius: 18,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stripPhoto: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.sand },
  stripMeta: { flex: 1, gap: 2 },
  stripTitle: { ...type.bodySmall, fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  stripPrice: { ...type.meta, color: colors.muted },
  offerPill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.blush,
  },
  offerPillText: { ...type.meta, fontFamily: fonts.bodyBold, color: colors.crimson },
  thread: { padding: 14, gap: 8 },
  dayMark: { ...type.label, fontSize: 11, alignSelf: 'center', color: colors.muted },
  bubble: { maxWidth: '78%', paddingHorizontal: 15, paddingVertical: 10 },
  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: colors.crimson,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 20,
  },
  bubbleText: { ...type.body, color: colors.ink },
  bubbleTextMine: { ...type.body, color: colors.white },
  meetupCard: { marginTop: 4, padding: 16, borderRadius: 22, backgroundColor: colors.ink, gap: 10 },
  meetupLabel: { ...type.label, fontSize: 11, letterSpacing: 1.8, color: colors.gold },
  meetupPlace: { fontFamily: fonts.display, fontSize: 22, color: colors.ivory },
  meetupWhen: { ...type.bodySmall, color: 'rgba(248,243,236,0.8)' },
  meetupActions: { flexDirection: 'row', gap: 8 },
  acceptButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.ivory,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptText: { ...type.bodySmall, fontFamily: fonts.bodyBold, fontSize: 14, color: colors.crimson },
  suggestButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(248,243,236,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestText: { ...type.bodySmall, fontSize: 14, color: colors.ivory },
  meetupConfirmed: { ...type.bodySmall, color: 'rgba(248,243,236,0.8)' },
  typing: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 20,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.crimson },
  composer: {
    paddingTop: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.ivory,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.crimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
