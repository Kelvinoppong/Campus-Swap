/**
 * The whole visual language of the app, from design/DESIGN.md. Components pull
 * colours, fonts and spacing from here and never hard-code a hex or a family.
 */

export const colors = {
  crimson: '#9B1C1F',
  crimsonDark: '#6E1114',
  /** Script watermark words painted on a crimson background. */
  crimsonScript: '#7E1519',
  ivory: '#F8F3EC',
  sand: '#EFE6DA',
  line: '#E4D8CA',
  inputBorder: '#D8CBBB',
  ink: '#1C1414',
  inkSoft: '#4A3F3D',
  muted: '#6B5F5C',
  gold: '#E8C07A',
  blush: '#F4E3E1',
  white: '#FFFFFF',
  /** Watermark on an ivory background, as on the chat screen. */
  ivoryScript: '#EFE3D4',
  tabBorder: '#E9DFD3',
} as const;

export const fonts = {
  display: 'BodoniModa_500Medium',
  displayBold: 'BodoniModa_600SemiBold',
  script: 'PinyonScript_400Regular',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
} as const;

export const radius = { card: 16, photo: 14, sheet: 28, bigSheet: 32, pill: 999 } as const;

/** 4px grid. `space(5)` is the 20px screen padding used on every screen. */
export const space = (n: number): number => n * 4;

export const layout = {
  screenPadding: space(5),
  buttonHeight: 56,
  inputHeight: 50,
  /** Nothing tappable is smaller than this. */
  minTouchTarget: 44,
  tabBarHeight: 82,
  archWidth: 270,
  archHeight: 290,
} as const;

/**
 * Text styles lifted straight from the HTML screens, so a heading is one
 * `type.h1` rather than a font/size/weight trio repeated in five files.
 */
export const type = {
  wordmark: { fontFamily: fonts.display, fontSize: 24, letterSpacing: 0.2 },
  hero: { fontFamily: fonts.display, fontSize: 50, lineHeight: 50, letterSpacing: -1 },
  heroScript: { fontFamily: fonts.script, fontSize: 96, lineHeight: 106 },
  h1: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38 },
  h2: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28 },
  h3: { fontFamily: fonts.display, fontSize: 22, lineHeight: 26 },
  price: { fontFamily: fonts.displayBold, fontSize: 36 },
  priceSmall: { fontFamily: fonts.displayBold, fontSize: 18 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodySmall: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  meta: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16 },
  button: { fontFamily: fonts.bodyBold, fontSize: 16, letterSpacing: 0.3 },
  /** Uppercase eyebrow labels: "NEW THIS WEEK", "TITLE", "STEP 2 OF 3". */
  label: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1.6 },
  labelWide: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 2 },
  tab: { fontFamily: fonts.bodyMedium, fontSize: 11 },
} as const;

/** Durations and stagger from the Motion table in design/DESIGN.md. */
export const motion = {
  rise: { duration: 700, distance: 18, stagger: 100 },
  riseSlow: { duration: 900, distance: 20, stagger: 150 },
  reveal: 1100,
  zoomIn: 1600,
  kenburns: 16000,
  floaty: 6000,
  drift: 14000,
  beat: 1800,
  dot: 1200,
} as const;

export const shadows = {
  arch: {
    shadowColor: '#280608',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  card: {
    shadowColor: '#3C1414',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  chip: {
    shadowColor: '#280608',
    shadowOpacity: 0.3,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;
