import {
  CATEGORY_CHIP_LABELS,
  LISTING_CATEGORIES,
  formatCents,
  type ListingCategory,
} from '@campus-swap/shared';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { ListingCard } from '@/components/ListingCard';
import { Rise } from '@/components/Rise';
import { ScriptWatermark } from '@/components/ScriptWatermark';
import { DEMO_LISTINGS, FEATURED_PHOTO } from '@/data/demo';
import { colors, layout, motion, radius, shadows, type } from '@/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 12;
const GRID_CARD = (SCREEN_WIDTH - layout.screenPadding * 2 - GRID_GAP) / 2;

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<ListingCategory | null>(null);

  const newArrivals = useMemo(() => DEMO_LISTINGS.slice(0, 4), []);
  const filtered = useMemo(
    () => (category ? DEMO_LISTINGS.filter((l) => l.category === category) : DEMO_LISTINGS),
    [category],
  );

  return (
    <View style={styles.screen}>
      <ScriptWatermark size={250} driftBy={22} rotate={0} style={styles.campusMark}>
        campus
      </ScriptWatermark>
      <ScriptWatermark size={190} rotate={-10} style={styles.swapMark}>
        swap
      </ScriptWatermark>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Text style={styles.wordmark}>Campus Swap</Text>
          <View style={styles.headerActions}>
            <HeaderButton label="Saved items" icon="saved" />
            <HeaderButton label="Search" icon="search" />
            <HeaderButton label="Menu" icon="menu" />
          </View>
        </View>

        <View style={styles.featured}>
          <Rise duration={motion.rise.duration}>
            <Text style={styles.eyebrow}>NEW THIS WEEK</Text>
          </Rise>
          <Rise delay={100} duration={motion.rise.duration}>
            <Text style={styles.featuredTitle}>The Move-Out Edit</Text>
          </Rise>
          <ArchHero />
        </View>

        <View style={styles.sheet}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            <CategoryChip
              label="All"
              active={category === null}
              onPress={() => setCategory(null)}
            />
            {LISTING_CATEGORIES.map((value) => (
              <CategoryChip
                key={value}
                label={CATEGORY_CHIP_LABELS[value]}
                active={category === value}
                onPress={() => setCategory(category === value ? null : value)}
              />
            ))}
          </ScrollView>

          {category === null ? (
            <>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>New Arrivals</Text>
                <Text style={styles.viewAll}>VIEW ALL</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rail}
              >
                {newArrivals.map((listing, index) => (
                  <Rise key={listing.id} delay={700 + index * 120} duration={600}>
                    <ListingCard listing={listing} width={150} />
                  </Rise>
                ))}
              </ScrollView>
            </>
          ) : null}

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>
              {category ? CATEGORY_CHIP_LABELS[category] : 'Everything on campus'}
            </Text>
            <Text style={styles.count}>{filtered.length} items</Text>
          </View>

          <View style={styles.grid}>
            {filtered.map((listing, index) => (
              <Rise key={listing.id} delay={index * 60} duration={550}>
                <ListingCard listing={listing} width={GRID_CARD} />
              </Rise>
            ))}
          </View>

          {filtered.length === 0 ? (
            <Text style={styles.empty}>Nothing here yet. Be the first to post one.</Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function HeaderButton({ label, icon }: { label: string; icon: 'saved' | 'search' | 'menu' }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} style={styles.iconButton}>
      <Icon name={icon} size={21} color={colors.white} strokeWidth={1.5} />
    </Pressable>
  );
}

function CategoryChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : null]}
    >
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

/**
 * The arch-framed featured photo: it wipes up on mount, the photo settles out
 * of a slight zoom, and then the whole thing bobs gently forever.
 */
function ArchHero() {
  const reduceMotion = useReducedMotion();
  const reveal = useSharedValue(reduceMotion ? 1 : 0);
  const bob = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      reveal.value = 1;
      return;
    }
    reveal.value = withDelay(
      200,
      withTiming(1, { duration: motion.reveal, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }),
    );
    bob.value = withDelay(
      1400,
      withRepeat(
        withTiming(1, { duration: motion.floaty / 2, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, [bob, reduceMotion, reveal]);

  const wipeStyle = useAnimatedStyle(() => ({
    height: layout.archHeight * reveal.value,
  }));
  const photoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + (1 - reveal.value) * 0.12 }],
  }));
  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value * -7 }],
  }));

  return (
    <Animated.View style={[styles.archWrap, bobStyle]}>
      <Link href={{ pathname: '/listing/[id]', params: { id: 'l-lights' } }} asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="The Move-Out Edit, dorm finds from $15"
        >
          <Animated.View style={[styles.arch, wipeStyle]}>
            <Animated.View style={[styles.archInner, photoStyle]}>
              <Image
                source={FEATURED_PHOTO}
                style={styles.archPhoto}
                contentFit="cover"
                contentPosition={{ top: '18%' }}
              />
            </Animated.View>
          </Animated.View>
        </Pressable>
      </Link>

      <Rise delay={1000} duration={700} style={styles.archChip}>
        <View style={styles.chipCard}>
          <Text style={styles.chipCardText}>
            Dorm finds from <Text style={styles.chipCardPrice}>{formatCents(1500)}</Text>
          </Text>
        </View>
      </Rise>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.crimson },
  campusMark: { left: -60, top: 150 },
  swapMark: { right: -40, top: 330 },
  header: {
    paddingHorizontal: layout.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: { ...type.wordmark, color: colors.white },
  headerActions: { flexDirection: 'row', gap: 2, marginRight: -10 },
  iconButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featured: { paddingHorizontal: layout.screenPadding, paddingTop: 14, gap: 4 },
  eyebrow: { ...type.labelWide, color: 'rgba(255,255,255,0.88)' },
  featuredTitle: { ...type.h1, color: colors.white },
  archWrap: { alignSelf: 'center', marginTop: 14, width: layout.archWidth },
  arch: {
    width: layout.archWidth,
    height: layout.archHeight,
    borderTopLeftRadius: layout.archWidth / 2,
    borderTopRightRadius: layout.archWidth / 2,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.sand,
    justifyContent: 'flex-end',
    ...shadows.arch,
  },
  archInner: { width: layout.archWidth, height: layout.archHeight },
  archPhoto: { width: '100%', height: '100%' },
  archChip: { position: 'absolute', left: -14, bottom: 22 },
  chipCard: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: colors.ivory,
    ...shadows.chip,
  },
  chipCardText: { ...type.bodySmall, fontFamily: type.button.fontFamily, color: colors.ink },
  chipCardPrice: { color: colors.crimson },
  sheet: {
    marginTop: 18,
    paddingTop: 18,
    paddingBottom: 24,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: colors.ivory,
    gap: 12,
  },
  chipRow: { paddingHorizontal: layout.screenPadding, gap: 8 },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { ...type.bodySmall, color: colors.ink },
  chipTextActive: { color: colors.ivory, fontFamily: type.button.fontFamily },
  sectionHead: {
    paddingHorizontal: layout.screenPadding,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: { ...type.h2, color: colors.ink },
  viewAll: { ...type.meta, fontFamily: type.button.fontFamily, letterSpacing: 1.5, color: colors.ink },
  count: { ...type.meta, color: colors.muted },
  rail: { paddingHorizontal: layout.screenPadding, gap: GRID_GAP },
  grid: {
    paddingHorizontal: layout.screenPadding,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  empty: { ...type.body, textAlign: 'center', color: colors.muted, paddingVertical: 30 },
});
