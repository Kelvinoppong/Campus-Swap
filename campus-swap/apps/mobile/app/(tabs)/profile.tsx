import { formatCents } from '@campus-swap/shared';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Rise } from '@/components/Rise';
import { ScriptWatermark } from '@/components/ScriptWatermark';
import { DEMO_LISTINGS, type DemoListing } from '@/data/demo';
import { useAuth } from '@/state/auth';
import { colors, fonts, layout, type } from '@/theme';

type Badge = 'LIVE' | 'PENDING' | 'SOLD';

const MY_LISTINGS: { listing: DemoListing; badge: Badge; note: string }[] = [
  { listing: DEMO_LISTINGS[9]!, badge: 'LIVE', note: '3 people interested' },
  { listing: DEMO_LISTINGS[5]!, badge: 'PENDING', note: 'meetup Thursday' },
  { listing: DEMO_LISTINGS[8]!, badge: 'LIVE', note: '5 people interested' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuth((state) => state.user);
  const signOut = useAuth((state) => state.signOut);

  const displayName = user?.displayName ?? 'Your Name';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <View style={styles.screen}>
      <View style={[styles.cover, { paddingTop: insets.top + 10 }]}>
        <ScriptWatermark size={170} driftBy={18} rotate={-8} style={styles.watermark}>
          seller
        </ScriptWatermark>
        <View style={styles.coverRow}>
          <Text style={styles.wordmark}>Campus Swap</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={() => {
              void signOut().then(() => router.replace('/sign-in'));
            }}
            style={styles.iconButton}
          >
            <Icon name="menu" size={22} color={colors.white} strokeWidth={1.5} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
      >
        <Rise style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.verified}>Verified · {user?.schoolName ?? 'yourschool.edu'}</Text>
        </Rise>

        <Rise delay={100}>
          <View style={styles.stats}>
            <Stat value="12" label="SOLD" />
            <Stat value="4.9" label="RATING" accent />
            <Stat value="3" label="ACTIVE" />
          </View>
        </Rise>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Your listings</Text>
          <Text style={styles.soldLink}>SOLD ITEMS</Text>
        </View>

        {MY_LISTINGS.map(({ listing, badge, note }, index) => (
          <Rise key={listing.id} delay={200 + index * 100}>
            <Link href={{ pathname: '/listing/[id]', params: { id: listing.id } }} asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`${listing.title}, ${badge.toLowerCase()}`}
                style={styles.row}
              >
                <Image source={listing.photo} style={styles.rowPhoto} contentFit="cover" />
                <View style={styles.rowMeta}>
                  <Text numberOfLines={1} style={styles.rowTitle}>
                    {listing.title}
                  </Text>
                  <Text style={styles.rowNote}>
                    {formatCents(listing.priceCents)} · {note}
                  </Text>
                </View>
                <View style={[styles.badge, badge === 'PENDING' ? styles.badgePending : null]}>
                  <Text
                    style={[styles.badgeText, badge === 'PENDING' ? styles.badgeTextPending : null]}
                  >
                    {badge}
                  </Text>
                </View>
              </Pressable>
            </Link>
          </Rise>
        ))}
      </ScrollView>
    </View>
  );
}

function Stat({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, accent ? styles.statAccent : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  cover: { height: 230, backgroundColor: colors.crimson, overflow: 'hidden' },
  watermark: { left: -20, top: 40 },
  coverRow: {
    paddingHorizontal: layout.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: { fontFamily: fonts.display, fontSize: 22, color: colors.white },
  iconButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -10,
  },
  scroll: { marginTop: -70 },
  scrollContent: { paddingHorizontal: layout.screenPadding, gap: 16 },
  identity: { alignItems: 'center', gap: 6 },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 5,
    borderColor: colors.ivory,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.display, fontSize: 44, color: colors.ivory },
  name: { fontFamily: fonts.display, fontSize: 28, color: colors.ink, marginTop: 4 },
  verified: { ...type.bodySmall, color: colors.muted },
  stats: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.ink },
  statAccent: { color: colors.crimson },
  statLabel: { ...type.label, fontSize: 11, letterSpacing: 1.4, color: colors.muted },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { ...type.h3, color: colors.ink },
  soldLink: { ...type.meta, fontFamily: fonts.bodyBold, letterSpacing: 1.4, color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowPhoto: { width: 64, height: 64, borderRadius: 14, backgroundColor: colors.sand },
  rowMeta: { flex: 1, gap: 3 },
  rowTitle: { ...type.body, fontFamily: fonts.bodyBold, color: colors.ink },
  rowNote: { ...type.bodySmall, color: colors.muted },
  badge: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.ink,
  },
  badgePending: { backgroundColor: colors.blush },
  badgeText: { ...type.label, fontSize: 11, letterSpacing: 1, color: colors.ivory },
  badgeTextPending: { color: colors.crimson },
});
