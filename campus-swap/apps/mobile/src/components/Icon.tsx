import type { ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '@/theme';

/**
 * The line icons drawn in the HTML screens, redrawn as SVG paths on a 24×24
 * grid. Keeping them here means no icon font and no dependency on an icon set
 * whose shapes drift from the design.
 */
const PATHS = {
  menu: 'M4 9h16M8 15h12',
  search: 'm20 20-4-4',
  saved: 'M6 7h12l-1 13H7zM9 7a3 3 0 0 1 6 0',
  home: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
  plus: 'M12 5v14M5 12h14',
  inbox: 'M4 5h16v11H8l-4 4z',
  profile: 'M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6',
  back: 'm15 5-7 7 7 7',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  pin: 'M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11z',
  send: 'M4 12 20 4l-6 16-3-7z',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4z',
  star: 'm12 4 2.4 5 5.6.8-4 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4-3.9 5.6-.8z',
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName;
  size?: number;
  /** ColorValue, not string, so it drops straight into a navigator's tabBarIcon. */
  color?: ColorValue;
  strokeWidth?: number;
  /** `heart` and `star` read better filled. */
  filled?: boolean;
}

export function Icon({
  name,
  size = 22,
  color = colors.ink,
  strokeWidth = 1.6,
  filled = false,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === 'search' ? <Circle cx={11} cy={11} r={6.5} stroke={color} strokeWidth={strokeWidth} /> : null}
      {name === 'profile' ? <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={strokeWidth} /> : null}
      {name === 'pin' ? <Circle cx={12} cy={10} r={2} stroke={color} strokeWidth={strokeWidth} /> : null}
      {name === 'camera' ? (
        <Circle cx={12} cy={13} r={3.5} stroke={color} strokeWidth={strokeWidth} />
      ) : null}
      <Path
        d={PATHS[name]}
        stroke={filled ? 'none' : color}
        fill={filled ? color : 'none'}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
