import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

export default function WaveBackground() {
  return (
    <View style={styles.container}>
      {/* SVG covering full screen */}
      <Svg
        height={height}
        width={width}
        viewBox={`0 0 ${width} ${height}`}
        style={styles.svg}
      >
        <Defs>
          <LinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={COLORS.cardBackground} stopOpacity="1" />
            <Stop offset="100%" stopColor={COLORS.background} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        {/* Top-left section */}
        <Path
          d={`M0,0 L${width},0 L${width},${height * 0.3} Q${width * 0.7},${height * 0.35} ${width * 0.5},${height * 0.45} Q${width * 0.3},${height * 0.55} 0,${height * 0.6} Z`}
          fill="#1c3a5c"
        />
        {/* Diagonal wave transition with gradient */}
        {/* <Path
          d={`M0,${height * 0.6} Q${width * 0.3},${height * 0.55} ${width * 0.5},${height * 0.45} Q${width * 0.7},${height * 0.35} ${width},${height * 0.3} L${width},${height * 0.4} Q${width * 0.7},${height * 0.45} ${width * 0.5},${height * 0.55} Q${width * 0.3},${height * 0.65} 0,${height * 0.7} Z`}
          fill="url(#gradient)"
        /> */}
        {/* Bottom-right section */}
        <Path
          d={`M0,${height * 0.7} Q${width * 0.3},${height * 0.65} ${width * 0.5},${height * 0.55} Q${width * 0.7},${height * 0.45} ${width},${height * 0.4} L${width},${height} L0,${height} Z`}
          fill={COLORS.background}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  topSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    backgroundColor: COLORS.cardBackground,
  },
  wave: {
    position: 'absolute',
    top: height * 0.4 - 100,
    left: 0,
  },
  bottomSection: {
    position: 'absolute',
    top: height * 0.4 + 100,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
  },
});
