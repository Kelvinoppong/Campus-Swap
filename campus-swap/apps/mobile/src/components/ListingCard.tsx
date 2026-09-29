import { AUDIENCE_LABELS, formatCents } from '@campus-swap/shared';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DemoListing } from '@/data/demo';
import { colors, radius, type } from '@/theme';

interface ListingCardProps {
  listing: DemoListing;
  /** Card width; the New Arrivals rail uses 150, the grid uses half the screen. */
  width: number;
}

export function ListingCard({ listing, width }: ListingCardProps) {
  const audience = listing.audience ? AUDIENCE_LABELS[listing.audience] : null;

  return (
    <Link href={{ pathname: '/listing/[id]', params: { id: listing.id } }} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${listing.title}, ${formatCents(listing.priceCents)}`}
        style={({ pressed }) => [{ width }, pressed ? styles.pressed : null]}
      >
        <View style={[styles.photoWrap, { width, height: width }]}>
          <Image source={listing.photo} style={styles.photo} contentFit="cover" transition={200} />
          {listing.deliveryMethod !== 'meetup' ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {listing.deliveryMethod === 'digital' ? 'DIGITAL' : 'SHIPS'}
              </Text>
            </View>
          ) : null}
        </View>
        <Text numberOfLines={1} style={styles.title}>
          {listing.title}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatCents(listing.priceCents)}</Text>
          {audience ? <Text style={styles.audience}>{audience}</Text> : null}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
  photoWrap: {
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.sand,
    marginBottom: 5,
  },
  photo: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    left: 8,
    top: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(28,20,20,0.72)',
  },
  badgeText: { fontFamily: type.label.fontFamily, fontSize: 9, letterSpacing: 1.2, color: colors.white },
  title: { ...type.bodySmall, fontFamily: type.bodySmall.fontFamily, color: colors.inkSoft },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 },
  price: { ...type.priceSmall, color: colors.ink },
  audience: { ...type.meta, fontSize: 11, color: colors.muted },
});
