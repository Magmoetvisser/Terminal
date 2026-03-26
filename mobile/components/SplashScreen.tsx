import React, { useEffect, useMemo } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { colors } from '../constants/theme';
import { useStore } from '../store';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const MATRIX_COLS = Math.floor(SCREEN_W / 18);
const MATRIX_ROWS = Math.floor(SCREEN_H / 22);
const CHARS = '1234567890'.split('');
const TITLE = 'HUSSLE';
const SUBTITLE = 'T E R M I N A L';

// Pre-generate random matrix characters
function generateMatrixGrid() {
  const grid: string[][] = [];
  for (let r = 0; r < MATRIX_ROWS; r++) {
    const row: string[] = [];
    for (let c = 0; c < MATRIX_COLS; c++) {
      row.push(CHARS[Math.floor(Math.random() * CHARS.length)]);
    }
    grid.push(row);
  }
  return grid;
}

// Single matrix rain column
function MatrixColumn({ col, totalCols }: { col: number; totalCols: number }) {
  const opacity = useSharedValue(0);
  const chars = useMemo(
    () => Array.from({ length: MATRIX_ROWS }, () => CHARS[Math.floor(Math.random() * CHARS.length)]),
    []
  );

  useEffect(() => {
    const delay = Math.random() * 1500;
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.7 + Math.random() * 0.3, { duration: 300 + Math.random() * 700 }),
          withTiming(0, { duration: 500 + Math.random() * 1000 }),
        ),
        3,
        false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{ position: 'absolute', left: col * 18, top: 0 }, style]}>
      {chars.map((ch, i) => (
        <Animated.Text
          key={i}
          style={{
            color: i === Math.floor(MATRIX_ROWS / 2) ? '#fff' : '#4ade80',
            fontSize: 14,
            fontFamily: 'monospace',
            lineHeight: 22,
            opacity: 0.15 + Math.random() * 0.4,
          }}
        >
          {ch}
        </Animated.Text>
      ))}
    </Animated.View>
  );
}

// Individual letter of the title
function TitleLetter({ letter, index }: { letter: string; index: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    const delay = 800 + index * 150;
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 400, easing: Easing.out(Easing.back(1.5)) }));
    scale.value = withDelay(delay, withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.5)) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.Text style={[styles.titleLetter, style]}>{letter}</Animated.Text>
  );
}

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const accentColor = useStore((s) => s.accentColor);
  const containerOpacity = useSharedValue(1);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(10);
  const logoScale = useSharedValue(0);
  const logoRotate = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  const columns = useMemo(
    () => Array.from({ length: MATRIX_COLS }, (_, i) => i),
    []
  );

  useEffect(() => {
    // Logo spin-in
    logoScale.value = withDelay(400, withTiming(1, { duration: 600, easing: Easing.out(Easing.back(2)) }));
    logoRotate.value = withDelay(400, withTiming(360, { duration: 600, easing: Easing.out(Easing.cubic) }));

    // Glow pulse
    glowOpacity.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800 }),
          withTiming(0.2, { duration: 800 }),
        ),
        3,
        true
      )
    );

    // Subtitle fade-in after title letters
    const subtitleDelay = 800 + TITLE.length * 150 + 200;
    subtitleOpacity.value = withDelay(subtitleDelay, withTiming(1, { duration: 500 }));
    subtitleTranslateY.value = withDelay(subtitleDelay, withTiming(0, { duration: 500 }));

    // Fade out everything and finish
    const fadeOutDelay = subtitleDelay + 1200;
    containerOpacity.value = withDelay(
      fadeOutDelay,
      withTiming(0, { duration: 600, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) {
          runOnJS(onFinish)();
        }
      })
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotateY: `${logoRotate.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Matrix rain background */}
      <View style={styles.matrixContainer} pointerEvents="none">
        {columns.map((col) => (
          <MatrixColumn key={col} col={col} totalCols={MATRIX_COLS} />
        ))}
      </View>

      {/* Center content */}
      <View style={styles.centerContent}>
        {/* Glow behind logo */}
        <Animated.View style={[styles.glow, { backgroundColor: accentColor }, glowStyle]} />

        {/* Logo icon */}
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <Animated.Text style={[styles.logoIcon, { color: accentColor }]}>{'>'}_</Animated.Text>
        </Animated.View>

        {/* Title letters */}
        <View style={styles.titleRow}>
          {TITLE.split('').map((letter, i) => (
            <TitleLetter key={i} letter={letter} index={i} />
          ))}
        </View>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, subtitleStyle]}>
          {SUBTITLE}
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matrixContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.elevated,
    borderWidth: 2,
    borderColor: '#4ade80',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    fontSize: 32,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  titleLetter: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.text,
    fontFamily: 'monospace',
    letterSpacing: 6,
    textShadowColor: '#4ade80',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#4ade80',
    fontFamily: 'monospace',
    letterSpacing: 4,
    marginTop: 4,
  },
});
