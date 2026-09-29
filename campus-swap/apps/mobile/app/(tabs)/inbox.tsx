import { formatCents } from '@campus-swap/shared';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Rise } from '@/components/Rise';
import { ScriptWatermark } from '@/components/ScriptWatermark';
import { DEMO_LISTINGS, type DemoListing } from '@/data/demo';
import { colors, fonts, layout, type } from '@/theme';

interface Thread {
  listing: DemoListing;
  preview: string;
  when: string;
  unread: number;
}

const THREADS: Thread[] = [
  {
    listing: DEMO_LISTINGS[0]!,
    preview: 'Deal. Sending a meetup time.',
    when: '2m',
    unread: 2,
  },
  { listing: DEMO_LISTINGS[1]!, preview: 'Is the second controller included?', when: '1h', unread: 0 },
  { listing: DEMO_LISTINGS[3]!, preview: 'How does the transfer work?', when: 'Yesterday', unread: 1 },
  { listing: DEMO_LISTINGS[2]!, preview: 'Could I see it in daylight?', when: '2d', unread: 0 },
];

export default function InboxScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <ScriptWatermark size={150} driftBy={16} rotate={-8} style={styles.watermark}>
          inbox
        </ScriptWatermark>
        <Text style={styles.wordmark}>Campus Swap</Text>
        <Text style={styles.heading}>Messages</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 30 }]}
      >
        {THREADS.map((thread, index) => (
          <Rise key={thread.listing.id} delay={index * 90}>
            <Link href={{ pathname: '/chat/[id]', params: { id: thread.listing.id } }} asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Conversation about ${thread.listing.title}${
                  thread.unread ? `, ${thread.unread} unread` : ''
                }`}
                style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
              >
                <Image source={thread.listing.photo} style={styles.photo} contentFit="cover" />
                <View style={styles.meta}>
                  <View style={styles.metaTop}>
                    <Text numberOfLines={1} style={styles.name}>
                      {thread.listing.seller.name}
                    </Text>
                    <Text style={styles.when}>{thread.when}</Text>
                  </View>
                  <Text numberOfLines={1} style={styles.listingTitle}>
                    {thread.listing.title} · {formatCents(thread.listing.priceCents)}
                  </Text>
                  <View style={styles.previewRow}>
                    <Text
                      numberOfLines={1}
                      style={[styles.preview, thread.unread ? styles.previewUnread : null]}
                    >
                      {thread.preview}
                    </Text>
                    {thread.unread ? (
                      <View style={styles.unreadDot}>
                        <Text style={styles.unreadText}>{thread.unread}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            </Link>
          </Rise>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 22,
    backgroundColor: colors.crimson,
    overflow: 'hidden',
    gap: 10,
  },
  watermark: { right: -20, top: 40 },
  wordmark: { fontFamily: fonts.display, fontSize: 22, color: colors.white },
  heading: { fontFamily: fonts.display, fontSize: 32, color: colors.white },
  list: { paddingHorizontal: layout.screenPadding, paddingTop: 16, gap: 16 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  rowPressed: { opacity: 0.7 },
  photo: { width: 56, height: 56, borderRadius: 14, backgroundColor: colors.sand },
  meta: { flex: 1, gap: 2 },
  metaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  name: { ...type.body, fontFamily: fonts.bodyBold, color: colors.ink, flex: 1 },
  when: { ...type.meta, color: colors.muted },
  listingTitle: { ...type.meta, color: colors.muted },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  preview: { ...type.bodySmall, color: colors.inkSoft, flex: 1 },
  previewUnread: { fontFamily: fonts.bodyBold, color: colors.ink },
  unreadDot: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: colors.crimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.white },
});
