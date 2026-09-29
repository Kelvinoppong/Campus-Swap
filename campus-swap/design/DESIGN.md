# Campus Swap — Design Spec

Open any file in `design/screens/` in a browser to see the screen with its animations. Each one is a 390 × 844 phone frame. Buttons link between screens.

| File | Screen |
| --- | --- |
| `01-sign-in.html` | .edu email sign-in over a full-bleed photo |
| `02-home-feed.html` | Arch-framed featured collection + New Arrivals row |
| `03-listing-detail.html` | Large photo, serif price, seller row, Message seller |
| `04-create-listing.html` | Photos, title, price, category, condition, meetup spot |
| `05-chat-meetup.html` | Chat bubbles, meetup proposal card, typing indicator |
| `06-profile.html` | Crimson cover, stats, your listings |

## Colors

| Token | Hex | Use |
| --- | --- | --- |
| `crimson` | `#9B1C1F` | Primary brand, buttons, headers, prices |
| `crimsonDark` | `#6E1114` | Pressed states, photo gradients |
| `crimsonScript` | `#7E1519` | Script watermark words on crimson |
| `ivory` | `#F8F3EC` | App background, light buttons on crimson |
| `sand` | `#EFE6DA` | Image placeholders, arch backing |
| `line` | `#E4D8CA` | Dividers and hairlines |
| `inputBorder` | `#D8CBBB` | Input borders |
| `ink` | `#1C1414` | Primary text, dark cards |
| `inkSoft` | `#4A3F3D` | Secondary text |
| `muted` | `#6B5F5C` | Labels, meta text |
| `gold` | `#E8C07A` | Small script accents, meetup label |
| `blush` | `#F4E3E1` | Pending badge, offer chip |

## Type

| Role | Font | Size / weight |
| --- | --- | --- |
| Display (titles, prices, wordmark) | Bodoni Moda | 24–50 / 500–600 |
| Script (watermark words, flourishes) | Pinyon Script | 26–250 / 400 |
| Body and UI | DM Sans | 11–16 / 400, 500, 700 |
| Labels | DM Sans, uppercase, letter-spacing 1.4–2px | 11–12 / 700 |

All three are free Google Fonts. In Expo use `@expo-google-fonts/bodoni-moda`, `@expo-google-fonts/pinyon-script` and `@expo-google-fonts/dm-sans`.

## Shape and spacing

- Screen side padding 20px; spacing on a 4px grid (8, 12, 16, 20, 24)
- Buttons: 56px tall, fully rounded (radius 28); icon buttons 44px minimum touch target
- Cards and photos: radius 14–16; big photo sheets radius 28–32
- Arch frame: width 270, height 290, radius `135 135 20 20`

## Motion

| Name | What it does | Timing |
| --- | --- | --- |
| rise | Fade in + move up 16–20px | 0.4–0.9s ease, staggered 0.1s per item |
| kenburns / zoom | Slow photo scale 1.06→1.16 (hero) or 1.14→1.0 (on enter) | 16s alternate / 1.6–2.2s |
| reveal | Arch photo wipes up (clip-path) | 1.1s cubic-bezier(0.2, 0.8, 0.2, 1) |
| floaty | Arch bobs 7px | 6s infinite |
| drift | Script watermark slides 18–22px | 12–14s infinite |
| beat | Save heart pulses | 1.8s infinite |
| dot | Typing indicator dots | 1.2s infinite, 0.15s offsets |

Respect reduced motion: when the OS setting is on, skip all of these (in React Native, check `AccessibilityInfo.isReduceMotionEnabled()` or use Reanimated's `useReducedMotion`). Use `react-native-reanimated` for the animations.

## Theme file to start from

```ts
// app/theme.ts
export const colors = {
  crimson: '#9B1C1F', crimsonDark: '#6E1114', crimsonScript: '#7E1519',
  ivory: '#F8F3EC', sand: '#EFE6DA', line: '#E4D8CA', inputBorder: '#D8CBBB',
  ink: '#1C1414', inkSoft: '#4A3F3D', muted: '#6B5F5C',
  gold: '#E8C07A', blush: '#F4E3E1', white: '#FFFFFF',
} as const;

export const fonts = {
  display: 'BodoniModa_500Medium',
  displayBold: 'BodoniModa_600SemiBold',
  script: 'PinyonScript_400Regular',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
} as const;

export const radius = { card: 16, sheet: 28, pill: 999 } as const;
export const space = (n: number) => n * 4;
```
