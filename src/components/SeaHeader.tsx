import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import Svg, { Circle, Path } from 'react-native-svg';

export interface SeaHeaderProps {
  height: number;
  children?: ReactNode;
}

/**
 * The sun and sea placeholder used when a spot or boat has no photo yet.
 * Real photos only: no stock boats or fish.
 */
export function SeaHeader({ height, children }: SeaHeaderProps) {
  const { theme } = useUnistyles();
  const c = theme.colors;
  return (
    <View style={styles.wrap(height)} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height={height} viewBox={`0 0 390 ${height}`} preserveAspectRatio="xMidYMid slice">
        <Circle cx={286} cy={height / 2} r={height * 0.23} fill={c.mango} />
        <Path
          d={`M0 ${height * 0.6} C50 ${height * 0.53} 90 ${height * 0.53} 140 ${height * 0.6} S230 ${height * 0.66} 280 ${height * 0.6} S360 ${height * 0.53} 390 ${height * 0.6} V${height} H0 Z`}
          fill={c.dagat}
        />
        <Path
          d={`M0 ${height * 0.79} C50 ${height * 0.72} 90 ${height * 0.72} 140 ${height * 0.79} S230 ${height * 0.86} 280 ${height * 0.79} S360 ${height * 0.72} 390 ${height * 0.79}`}
          fill="none"
          stroke={c.mapWater}
          strokeWidth={7}
          strokeLinecap="round"
        />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrap: (height: number) => ({
    height,
    backgroundColor: theme.colors.mapWater,
    overflow: 'hidden',
  }),
}));
