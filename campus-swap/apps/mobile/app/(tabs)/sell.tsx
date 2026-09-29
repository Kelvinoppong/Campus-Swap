import {
  AUDIENCE_CATEGORIES,
  AUDIENCE_LABELS,
  CATEGORY_CHIP_LABELS,
  CONDITION_LABELS,
  DELIVERY_METHODS,
  DELIVERY_METHOD_LABELS,
  LIMITS,
  LISTING_AUDIENCES,
  LISTING_CATEGORIES,
  LISTING_CONDITIONS,
  SIZED_CATEGORIES,
  parsePriceToCents,
  type DeliveryMethod,
  type ListingAudience,
  type ListingCategory,
  type ListingCondition,
} from '@campus-swap/shared';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Rise } from '@/components/Rise';
import { ScriptWatermark } from '@/components/ScriptWatermark';
import { DEMO_LISTINGS } from '@/data/demo';
import { colors, fonts, layout, radius, type } from '@/theme';

const MEETUP_SPOTS = [
  'Student Union lobby',
  'Main library entrance',
  'Campus police lobby',
  'Rec center entrance',
];

export default function SellScreen() {
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<ListingCategory>('tech');
  const [condition, setCondition] = useState<ListingCondition>('good');
  const [audience, setAudience] = useState<ListingAudience | null>(null);
  const [size, setSize] = useState('');
  const [delivery, setDelivery] = useState<DeliveryMethod>('meetup');
  const [meetupSpot, setMeetupSpot] = useState(MEETUP_SPOTS[0]!);
  const [eventName, setEventName] = useState('');
  const [eventCity, setEventCity] = useState('');

  const showSize = SIZED_CATEGORIES.includes(category);
  const showAudience = AUDIENCE_CATEGORIES.includes(category);
  const isTicket = category === 'tickets';

  const priceCents = parsePriceToCents(price);
  const complete = useMemo(() => {
    if (title.trim().length < 3) return false;
    if (priceCents === null || priceCents > LIMITS.maxPriceCents) return false;
    if (isTicket && eventName.trim().length < 2) return false;
    return true;
  }, [eventName, isTicket, priceCents, title]);

  // Three of four photo slots filled, matching the mockup's "step 2 of 3".
  const progress = complete ? 1 : 0.66;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <ScriptWatermark size={150} driftBy={16} rotate={-8} style={styles.watermark}>
          sell
        </ScriptWatermark>
        <View style={styles.headerRow}>
          <Text style={styles.cancel}>Cancel</Text>
          <Text style={styles.step}>STEP 2 OF 3</Text>
        </View>
        <Text style={styles.heading}>List an item</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 30 }]}
        >
          <Rise delay={100}>
            <View style={styles.photoGrid}>
              <Image
                source={DEMO_LISTINGS[1]!.photo}
                style={styles.photoSlot}
                contentFit="cover"
                accessibilityLabel="Photo 1"
              />
              <Image
                source={DEMO_LISTINGS[1]!.photo}
                style={styles.photoSlot}
                contentFit="cover"
                contentPosition={{ top: '20%' }}
                accessibilityLabel="Photo 2"
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add photo"
                style={styles.addPhoto}
              >
                <Icon name="camera" size={22} color={colors.crimson} />
                <Text style={styles.addPhotoText}>Add photo</Text>
              </Pressable>
            </View>
            <Text style={styles.hint}>Up to {LIMITS.maxListingPhotos} photos. First one leads.</Text>
          </Rise>

          <Rise delay={180}>
            <Field label="TITLE">
              <TextInput
                accessibilityLabel="Title"
                value={title}
                onChangeText={setTitle}
                placeholder="PlayStation 5 + 2 controllers"
                placeholderTextColor={colors.muted}
                maxLength={LIMITS.listingTitleMax}
                style={styles.input}
              />
            </Field>
          </Rise>

          <Rise delay={240}>
            <View style={styles.twoUp}>
              <Field label="PRICE" style={styles.flex}>
                <TextInput
                  accessibilityLabel="Price in dollars"
                  value={price}
                  onChangeText={setPrice}
                  placeholder="$0"
                  placeholderTextColor={colors.muted}
                  keyboardType="decimal-pad"
                  style={[styles.input, styles.priceInput]}
                />
              </Field>
              <Field label="CONDITION" style={styles.flex}>
                <ChipRow
                  values={LISTING_CONDITIONS}
                  labels={CONDITION_LABELS}
                  selected={condition}
                  onSelect={setCondition}
                />
              </Field>
            </View>
          </Rise>

          <Rise delay={300}>
            <Field label="CATEGORY">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipScroll}
              >
                {LISTING_CATEGORIES.map((value) => (
                  <Chip
                    key={value}
                    label={CATEGORY_CHIP_LABELS[value]}
                    active={category === value}
                    onPress={() => setCategory(value)}
                  />
                ))}
              </ScrollView>
            </Field>
          </Rise>

          {showAudience || showSize ? (
            <Rise delay={340}>
              <View style={styles.twoUp}>
                {showAudience ? (
                  <Field label="FIT" style={styles.flex}>
                    <ChipRow
                      values={LISTING_AUDIENCES}
                      labels={AUDIENCE_LABELS}
                      selected={audience}
                      onSelect={(next) => setAudience(audience === next ? null : next)}
                    />
                  </Field>
                ) : null}
                {showSize ? (
                  <Field label="SIZE" style={styles.flex}>
                    <TextInput
                      accessibilityLabel="Size"
                      value={size}
                      onChangeText={setSize}
                      placeholder="M, US 10, 34x32"
                      placeholderTextColor={colors.muted}
                      style={styles.input}
                    />
                  </Field>
                ) : null}
              </View>
            </Rise>
          ) : null}

          {isTicket ? (
            <Rise delay={360}>
              <Field label="EVENT">
                <TextInput
                  accessibilityLabel="Event name"
                  value={eventName}
                  onChangeText={setEventName}
                  placeholder="DevWorld Conference"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                />
              </Field>
              <Field label="WHERE" style={styles.spaced}>
                <TextInput
                  accessibilityLabel="Event city"
                  value={eventCity}
                  onChangeText={setEventCity}
                  placeholder="Berlin, Germany — or on campus"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                />
              </Field>
            </Rise>
          ) : null}

          <Rise delay={400}>
            <Field label="HOW IT CHANGES HANDS">
              <ChipRow
                values={DELIVERY_METHODS}
                labels={DELIVERY_METHOD_LABELS}
                selected={delivery}
                onSelect={setDelivery}
              />
            </Field>
          </Rise>

          {delivery === 'meetup' ? (
            <Rise delay={440}>
              <Field label="MEETUP SPOT">
                <View style={styles.spotList}>
                  {MEETUP_SPOTS.map((spot) => (
                    <Pressable
                      key={spot}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: meetupSpot === spot }}
                      onPress={() => setMeetupSpot(spot)}
                      style={[styles.spot, meetupSpot === spot ? styles.spotActive : null]}
                    >
                      <Icon
                        name="pin"
                        size={16}
                        color={meetupSpot === spot ? colors.crimson : colors.muted}
                        strokeWidth={1.8}
                      />
                      <Text style={styles.spotText}>{spot}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.hint}>Public, well-lit places only.</Text>
              </Field>
            </Rise>
          ) : null}

          <Button
            label="Continue to preview"
            onPress={() => {}}
            disabled={!complete}
            style={styles.submit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function ChipRow<T extends string>({
  values,
  labels,
  selected,
  onSelect,
}: {
  values: readonly T[];
  labels: Record<T, string>;
  selected: T | null;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.chipWrap}>
      {values.map((value) => (
        <Chip
          key={value}
          label={labels[value]}
          active={selected === value}
          onPress={() => onSelect(value)}
        />
      ))}
    </View>
  );
}

function Chip({
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 22,
    backgroundColor: colors.crimson,
    overflow: 'hidden',
    gap: 12,
  },
  watermark: { right: -30, top: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cancel: { ...type.bodySmall, fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  step: { ...type.label, color: 'rgba(255,255,255,0.88)' },
  heading: { fontFamily: fonts.display, fontSize: 32, color: colors.white },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  progressFill: { height: 4, backgroundColor: colors.ivory },
  form: { padding: layout.screenPadding, gap: 16 },
  photoGrid: { flexDirection: 'row', gap: 10 },
  photoSlot: { flex: 1, height: 110, borderRadius: radius.card, backgroundColor: colors.sand },
  addPhoto: {
    flex: 1,
    height: 110,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.crimson,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addPhotoText: { ...type.meta, fontFamily: fonts.bodyBold, color: colors.crimson },
  hint: { ...type.meta, color: colors.muted, marginTop: 8 },
  field: { gap: 6 },
  spaced: { marginTop: 14 },
  fieldLabel: { ...type.label, fontSize: 11, color: colors.muted },
  input: {
    height: layout.inputHeight,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.photo,
    backgroundColor: colors.white,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
  },
  priceInput: {
    borderWidth: 1.5,
    borderColor: colors.crimson,
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.crimson,
  },
  twoUp: { flexDirection: 'row', gap: 12 },
  chipScroll: { gap: 8, paddingRight: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { ...type.bodySmall, fontSize: 14, color: colors.ink },
  chipTextActive: { fontFamily: fonts.bodyBold, color: colors.ivory },
  spotList: { gap: 8 },
  spot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: layout.inputHeight,
    paddingHorizontal: 14,
    borderRadius: radius.photo,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
  },
  spotActive: { borderColor: colors.crimson, borderWidth: 1.5 },
  spotText: { ...type.bodySmall, fontSize: 15, color: colors.ink },
  submit: { marginTop: 8 },
});
