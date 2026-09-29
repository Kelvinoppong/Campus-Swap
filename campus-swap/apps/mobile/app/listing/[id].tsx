import {
  AUDIENCE_LABELS,
  CATEGORY_CHIP_LABELS,
  CONDITION_LABELS,
  DELIVERY_METHOD_LABELS,
  formatCents,
  percentOff,
} from '@campus-swap/shared';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Rise } from '@/components/Rise';
import { findListing } from '@/data/demo';
import { colors, fonts, layout, motion, radius, type } from '@/theme';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState(false);

  const listing = findListing(id ?? '');

  if (!listing) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>That listing is gone.</Text>
      </View>
    );
  }

  const discount = percentOff(listing.compareAtPriceCents, listing.priceCents);
  const audience = listing.audience ? AUDIENCE_LABELS[listing.audience] : null;

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      >
        <View style={styles.photoWrap}>
          <ZoomPhoto source={listing.photo} />
          <LinearGradient
            colors={['rgba(28,20,20,0.35)', 'rgba(28,20,20,0)']}
            locations={[0, 0.28]}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={[styles.backButton, { top: insets.top + 6 }]}
          >
            <Icon name="back" size={20} color={colors.ink} strokeWidth={1.8} />
          </Pressable>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>
              {CATEGORY_CHIP_LABELS[listing.category].toUpperCase()}
            </Text>
          </View>
          <View style={styles.photoCount}>
            <Text style={styles.photoCountText}>1 / 1</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Rise delay={200}>
            <Text style={styles.title}>{listing.title}</Text>
          </Rise>
          <Rise delay={280}>
            <Text style={styles.subtitle}>{listing.subtitle}</Text>
          </Rise>

          <Rise delay={360} style={styles.priceRow}>
            <Text style={styles.price}>{formatCents(listing.priceCents)}</Text>
            {listing.compareAtPriceCents ? (
              <Text style={styles.compare}>
                <Text style={styles.strike}>{formatCents(listing.compareAtPriceCents)}</Text>
                {discount ? ` · ${discount}% off retail` : ''}
              </Text>
            ) : null}
          </Rise>

          <Rise delay={420}>
            <View style={styles.factRow}>
              <Fact label="CONDITION" value={CONDITION_LABELS[listing.condition]} />
              {listing.size ? <Fact label="SIZE" value={listing.size} /> : null}
              {audience ? <Fact label="FIT" value={audience} /> : null}
              {listing.brand ? <Fact label="BRAND" value={listing.brand} /> : null}
            </View>
          </Rise>

          <Rise delay={460}>
            <Text style={styles.description}>{listing.description}</Text>
          </Rise>

          <Rise delay={500}>
            <View style={styles.sellerRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{listing.seller.initials}</Text>
              </View>
              <View style={styles.sellerMeta}>
                <Text style={styles.sellerName}>{listing.seller.name}</Text>
                <Text style={styles.sellerStats}>
                  Verified student · {listing.seller.rating.toFixed(1)} ★ · {listing.seller.sales}{' '}
                  sales
                </Text>
              </View>
              <Pressable accessibilityRole="button" style={styles.profileLink}>
                <Text style={styles.profileLinkText}>PROFILE</Text>
              </Pressable>
            </View>
          </Rise>

          {listing.event ? (
            <Rise delay={540}>
              <View style={styles.eventCard}>
                <Text style={styles.eventLabel}>EVENT</Text>
                <Text style={styles.eventName}>{listing.event.name}</Text>
                <Text style={styles.eventMeta}>
                  {listing.event.startsAt} · {listing.event.venue}
                </Text>
                <Text style={styles.eventMeta}>{listing.event.city}</Text>
              </View>
            </Rise>
          ) : null}

          <Rise delay={560}>
            <View style={styles.meetupRow}>
              <Icon name="pin" size={18} color={colors.crimson} strokeWidth={1.8} />
              <Text style={styles.meetupText}>
                {listing.meetupSpot ? (
                  <>
                    Meet at <Text style={styles.meetupSpot}>{listing.meetupSpot}</Text>
                  </>
                ) : (
                  DELIVERY_METHOD_LABELS[listing.deliveryMethod]
                )}
              </Text>
            </View>
          </Rise>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Remove from saved' : 'Save listing'}
          accessibilityState={{ selected: saved }}
          onPress={() => setSaved((prev) => !prev)}
          style={styles.saveButton}
        >
          <BeatingHeart active={saved} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/chat/[id]', params: { id: listing.id } })}
          style={({ pressed }) => [styles.messageButton, pressed ? styles.messagePressed : null]}
        >
          <Text style={styles.messageText}>Message seller</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

/** The hero photo settles out of a 1.14 zoom as the screen opens. */
function ZoomPhoto({ source }: { source: ImageSourcePropType }) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(reduceMotion ? 1.02 : 1.14);

  useEffect(() => {
    if (reduceMotion) return;
    scale.value = withTiming(1.02, {
      duration: motion.zoomIn + 600,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
    });
  }, [reduceMotion, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Image source={source} style={styles.photo} contentFit="cover" contentPosition="center" />
    </Animated.View>
  );
}

/** The save heart pulses, matching the `beat` animation in the design spec. */
function BeatingHeart({ active }: { active: boolean }) {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    pulse.value = withRepeat(
      withTiming(1.14, { duration: motion.beat / 2, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse, reduceMotion]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <Animated.View style={style}>
      <Icon name="heart" size={22} color={active ? colors.crimson : colors.crimson} filled />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ivory },
  missingText: { ...type.body, color: colors.muted },
  photoWrap: {
    height: 440,
    borderBottomLeftRadius: radius.bigSheet,
    borderBottomRightRadius: radius.bigSheet,
    overflow: 'hidden',
    backgroundColor: colors.sand,
  },
  photo: { width: '100%', height: '100%' },
  backButton: {
    position: 'absolute',
    left: 16,
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: layout.minTouchTarget / 2,
    backgroundColor: 'rgba(248,243,236,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPill: {
    position: 'absolute',
    left: 20,
    bottom: 22,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: colors.crimson,
  },
  categoryPillText: { ...type.label, fontSize: 11, color: colors.white },
  photoCount: {
    position: 'absolute',
    right: 20,
    bottom: 22,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(28,20,20,0.6)',
  },
  photoCountText: { ...type.meta, color: colors.white },
  body: { padding: 22, gap: 12 },
  title: { fontFamily: fonts.display, fontSize: 27, lineHeight: 31, color: colors.ink },
  subtitle: { ...type.bodySmall, fontSize: 14, color: colors.muted },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' },
  price: { ...type.price, color: colors.crimson },
  compare: { ...type.bodySmall, fontSize: 14, color: colors.muted },
  strike: { textDecorationLine: 'line-through' },
  factRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  fact: { gap: 3 },
  factLabel: { ...type.label, fontSize: 10, letterSpacing: 1.4, color: colors.muted },
  factValue: { ...type.bodySmall, fontSize: 14, color: colors.ink },
  description: { ...type.body, color: colors.inkSoft },
  sellerRow: {
    marginTop: 4,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.display, fontSize: 17, color: colors.ivory },
  sellerMeta: { flex: 1, gap: 2 },
  sellerName: { ...type.body, fontFamily: fonts.bodyBold, color: colors.ink },
  sellerStats: { ...type.meta, color: colors.muted },
  profileLink: { minHeight: layout.minTouchTarget, justifyContent: 'center' },
  profileLinkText: { ...type.meta, fontFamily: fonts.bodyBold, letterSpacing: 1.2, color: colors.ink },
  eventCard: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.ink,
    gap: 6,
  },
  eventLabel: { ...type.label, fontSize: 11, letterSpacing: 1.8, color: colors.gold },
  eventName: { fontFamily: fonts.display, fontSize: 22, color: colors.ivory },
  eventMeta: { ...type.bodySmall, color: 'rgba(248,243,236,0.8)' },
  meetupRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meetupText: { ...type.bodySmall, fontSize: 14, color: colors.inkSoft, flex: 1 },
  meetupSpot: { fontFamily: fonts.bodyBold, color: colors.ink },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: layout.screenPadding,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.ivory,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  saveButton: {
    width: layout.buttonHeight,
    height: layout.buttonHeight,
    borderRadius: layout.buttonHeight / 2,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageButton: {
    flex: 1,
    height: layout.buttonHeight,
    borderRadius: layout.buttonHeight / 2,
    backgroundColor: colors.crimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagePressed: { backgroundColor: colors.crimsonDark },
  messageText: { ...type.button, color: colors.white },
});
