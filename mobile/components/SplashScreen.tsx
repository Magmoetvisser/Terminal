import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  withSpring,
  interpolate,
  Easing,
  SharedValue,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const ACCENT = '#4ade80';
const BG = '#0a0a0a';
const HUSSLE = 'HUSSLE';
const TAGLINE = 'terminal control';

// Matrix rain characters
const MATRIX_CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモ';

interface Props {
  onFinish: () => void;
  accentColor?: string;
}

// Single matrix rain column
function MatrixColumn({ index, total, accent }: { index: number; total: number; accent: string }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-SCREEN_H * 0.3);

  const delay = Math.random() * 1200;
  const duration = 1800 + Math.random() * 1200;
  const x = (index / total) * SCREEN_W;

  useEffect(() => {
    opacity.value = withDelay(delay, withSequence(
      withTiming(0.15 + Math.random() * 0.25, { duration: 300 }),
      withDelay(duration, withTiming(0, { duration: 600 })),
    ));
    translateY.value = withDelay(delay, withTiming(SCREEN_H * 0.6, {
      duration,
      easing: Easing.linear,
    }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Generate a short string of characters for this column
  const chars = Array.from({ length: 5 + Math.floor(Math.random() * 8) }, () =>
    MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
  ).join('\n');

  return (
    <Animated.Text
      style={[
        {
          position: 'absolute',
          left: x,
          top: 0,
          color: accent,
          fontSize: 11,
          fontFamily: 'monospace',
          lineHeight: 14,
          textShadowColor: accent,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 4,
        },
        style,
      ]}
    >
      {chars}
    </Animated.Text>
  );
}

// Extracted letter component — hooks called at top level (Rules of Hooks safe)
function AnimatedLetter({ char, opacity, translateY, accent }: {
  char: string;
  opacity: SharedValue<number>;
  translateY: SharedValue<number>;
  accent: string;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  return (
    <Animated.Text style={[styles.titleChar, { color: accent }, style]}>
      {char}
    </Animated.Text>
  );
}

export default function SplashScreen({ onFinish, accentColor }: Props) {
  const accent = accentColor || ACCENT;

  // Logo circle
  const logoScale = useSharedValue(0);
  const logoRotate = useSharedValue(0);
  const logoGlow = useSharedValue(0);

  // Letters — individual hooks (HUSSLE is a constant, length never changes)
  const l0o = useSharedValue(0); const l0y = useSharedValue(12);
  const l1o = useSharedValue(0); const l1y = useSharedValue(12);
  const l2o = useSharedValue(0); const l2y = useSharedValue(12);
  const l3o = useSharedValue(0); const l3y = useSharedValue(12);
  const l4o = useSharedValue(0); const l4y = useSharedValue(12);
  const l5o = useSharedValue(0); const l5y = useSharedValue(12);
  const letterOpacities = [l0o, l1o, l2o, l3o, l4o, l5o];
  const letterYs = [l0y, l1y, l2y, l3y, l4y, l5y];

  // Tagline
  const taglineOpacity = useSharedValue(0);
  const taglineY = useSharedValue(8);

  // Cursor blink
  const cursorOpacity = useSharedValue(0);

  // Final exit
  const exitOpacity = useSharedValue(1);
  const exitScale = useSharedValue(1);

  const finish = useCallback(() => {
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    // Phase 1: Logo appears (0-500ms)
    logoScale.value = withSpring(1, { damping: 12, stiffness: 120 });
    logoRotate.value = withTiming(360, { duration: 800, easing: Easing.out(Easing.cubic) });
    logoGlow.value = withDelay(300, withTiming(1, { duration: 400 }));

    // Phase 2: Letters type in (500-1100ms)
    letterOpacities.forEach((opacity, i) => {
      opacity.value = withDelay(500 + i * 90, withTiming(1, { duration: 150 }));
    });
    letterYs.forEach((y, i) => {
      y.value = withDelay(500 + i * 90, withSpring(0, { damping: 14, stiffness: 150 }));
    });

    // Phase 3: Cursor blink (600-1800ms)
    cursorOpacity.value = withDelay(500, withRepeat(
      withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 100 }),
        withTiming(0, { duration: 300 }),
      ),
      4,
      false,
    ));

    // Phase 4: Tagline fade in (1200-1500ms)
    taglineOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));
    taglineY.value = withDelay(1200, withSpring(0, { damping: 14, stiffness: 120 }));

    // Phase 5: Exit (2400ms)
    exitScale.value = withDelay(2400, withTiming(1.08, { duration: 300, easing: Easing.in(Easing.cubic) }));
    exitOpacity.value = withDelay(2400, withTiming(0, { duration: 400, easing: Easing.in(Easing.cubic) }));

    // Call onFinish after animation
    const timer = setTimeout(() => finish(), 2900);
    return () => clearTimeout(timer);
  }, []);

  // Animated styles
  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotate.value}deg` },
    ],
    opacity: interpolate(logoScale.value, [0, 0.5, 1], [0, 0.8, 1]),
  }));

  const logoGlowStyle = useAnimatedStyle(() => ({
    opacity: logoGlow.value * 0.6,
    transform: [{ scale: 1 + logoGlow.value * 0.3 }],
  }));

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineY.value }],
  }));

  const exitStyle = useAnimatedStyle(() => ({
    opacity: exitOpacity.value,
    transform: [{ scale: exitScale.value }],
  }));

  // Matrix columns
  const matrixColumns = Array.from({ length: 20 }, (_, i) => (
    <MatrixColumn key={i} index={i} total={20} accent={accent} />
  ));

  return (
    <Animated.View style={[styles.container, exitStyle]}>
      {/* Matrix rain background */}
      <View style={styles.matrixLayer} pointerEvents="none">
        {matrixColumns}
      </View>

      {/* Center content */}
      <View style={styles.center}>
        {/* Glow behind logo */}
        <Animated.View style={[styles.logoGlow, { backgroundColor: accent }, logoGlowStyle]} />

        {/* Logo circle */}
        <Animated.View style={[styles.logoCircle, { borderColor: accent }, logoStyle]}>
          <Animated.Text style={[styles.logoIcon, { color: accent }]}>{'>_'}</Animated.Text>
        </Animated.View>

        {/* HUSSLE text */}
        <View style={styles.titleRow}>
          {HUSSLE.split('').map((char, i) => (
            <AnimatedLetter
              key={i}
              char={char}
              opacity={letterOpacities[i]}
              translateY={letterYs[i]}
              accent={accent}
            />
          ))}
          {/* Blinking cursor */}
          <Animated.Text style={[styles.cursor, { color: accent }, cursorStyle]}>|</Animated.Text>
        </View>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, taglineStyle]}>{TAGLINE}</Animated.Text>
      </View>

      {/* Bottom line accent */}
      <Animated.View style={[styles.bottomLine, { backgroundColor: accent }, taglineStyle]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  matrixLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BG,
    marginBottom: 20,
  },
  logoIcon: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleChar: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 6,
    fontFamily: 'monospace',
  },
  cursor: {
    fontSize: 36,
    fontWeight: '300',
    marginLeft: 2,
  },
  tagline: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  bottomLine: {
    position: 'absolute',
    bottom: 60,
    width: 40,
    height: 2,
    borderRadius: 1,
  },
});
