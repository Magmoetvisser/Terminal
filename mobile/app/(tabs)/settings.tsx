import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store';

const ACCENT_KEY = 'hussle_accent_color';

const THEME_COLORS = [
  { color: '#4ade80', label: 'Groen' },
  { color: '#60a5fa', label: 'Blauw' },
  { color: '#c084fc', label: 'Paars' },
  { color: '#f472b6', label: 'Roze' },
  { color: '#facc15', label: 'Geel' },
  { color: '#fb923c', label: 'Oranje' },
  { color: '#f87171', label: 'Rood' },
  { color: '#2dd4bf', label: 'Teal' },
  { color: '#e0e0e0', label: 'Wit' },
];

// --- Color conversion helpers ---

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

// --- Slider component ---

function ColorSlider({
  value,
  onValueChange,
  onSlideStart,
  onSlideEnd,
  gradientColors,
  label,
  displayValue,
}: {
  value: number;
  onValueChange: (v: number) => void;
  onSlideStart: () => void;
  onSlideEnd: () => void;
  gradientColors: string[];
  label: string;
  displayValue: string;
}) {
  const trackRef = useRef<View>(null);
  const callbackRef = useRef(onValueChange);
  callbackRef.current = onValueChange;

  const startRef = useRef(onSlideStart);
  startRef.current = onSlideStart;
  const endRef = useRef(onSlideEnd);
  endRef.current = onSlideEnd;

  const getRatio = (pageX: number) => {
    return new Promise<number>((resolve) => {
      trackRef.current?.measureInWindow((x, _y, width) => {
        if (width > 0) {
          resolve(clamp((pageX - x) / width, 0, 1));
        }
      });
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: async (evt) => {
          startRef.current();
          const ratio = await getRatio(evt.nativeEvent.pageX);
          callbackRef.current(ratio);
        },
        onPanResponderMove: async (evt) => {
          const ratio = await getRatio(evt.nativeEvent.pageX);
          callbackRef.current(ratio);
        },
        onPanResponderRelease: () => {
          endRef.current();
        },
        onPanResponderTerminate: () => {
          endRef.current();
        },
      }),
    []
  );

  return (
    <View style={sliderStyles.wrapper}>
      <View style={sliderStyles.labelRow}>
        <Text style={sliderStyles.label}>{label}</Text>
        <Text style={sliderStyles.value}>{displayValue}</Text>
      </View>
      <View
        ref={trackRef}
        style={sliderStyles.track}
        {...panResponder.panHandlers}
      >
        <View style={sliderStyles.gradientRow} pointerEvents="none">
          {gradientColors.map((color, i) => (
            <View
              key={i}
              style={[sliderStyles.gradientSegment, { backgroundColor: color }]}
            />
          ))}
        </View>
        <View
          pointerEvents="none"
          style={[
            sliderStyles.thumb,
            { left: `${clamp(value, 0, 1) * 100}%` },
          ]}
        />
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: { color: '#888', fontSize: 13 },
  value: { color: '#666', fontSize: 13, fontFamily: 'monospace' },
  track: {
    height: 36,
    borderRadius: 18,
    position: 'relative',
    justifyContent: 'center',
  },
  gradientRow: {
    flexDirection: 'row',
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  gradientSegment: {
    flex: 1,
  },
  thumb: {
    position: 'absolute',
    top: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginLeft: -16,
    borderWidth: 3,
    borderColor: '#0a0a0a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 5,
  },
});

// --- Main screen ---

export default function SettingsScreen() {
  const { accentColor, setAccentColor } = useStore();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [hue, setHue] = useState(0);
  const [sat, setSat] = useState(80);
  const [lit, setLit] = useState(60);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const slidingRef = useRef(false);

  useEffect(() => {
    SecureStore.getItemAsync(ACCENT_KEY).then((stored) => {
      if (stored) setAccentColor(stored);
    });
  }, []);

  // Sync HSL sliders when accent color changes externally (presets),
  // but NOT while actively sliding (prevents feedback loop)
  useEffect(() => {
    if (slidingRef.current) return;
    const [h, s, l] = hexToHsl(accentColor);
    setHue(h);
    setSat(s);
    setLit(l);
  }, [accentColor]);

  const pickColor = async (color: string) => {
    setAccentColor(color);
    await SecureStore.setItemAsync(ACCENT_KEY, color);
  };

  const onSlideStart = () => {
    slidingRef.current = true;
    setScrollEnabled(false);
  };

  const onSlideEnd = () => {
    slidingRef.current = false;
    setScrollEnabled(true);
  };

  // Use refs so slider callbacks always read latest HSL values
  const hueRef = useRef(hue);
  hueRef.current = hue;
  const satRef = useRef(sat);
  satRef.current = sat;
  const litRef = useRef(lit);
  litRef.current = lit;

  const onHueChange = (ratio: number) => {
    const h = Math.round(ratio * 360);
    setHue(h);
    pickColor(hslToHex(h, satRef.current, litRef.current));
  };

  const onSatChange = (ratio: number) => {
    const s = Math.round(ratio * 100);
    setSat(s);
    pickColor(hslToHex(hueRef.current, s, litRef.current));
  };

  const onLitChange = (ratio: number) => {
    const l = Math.round(ratio * 100);
    setLit(l);
    pickColor(hslToHex(hueRef.current, satRef.current, l));
  };

  // Generate hue gradient colors (12 stops around the color wheel)
  const hueStops = Array.from({ length: 13 }, (_, i) =>
    hslToHex((i / 12) * 360, sat, lit)
  );

  const satStops = [
    hslToHex(hue, 0, lit),
    hslToHex(hue, 50, lit),
    hslToHex(hue, 100, lit),
  ];

  const litStops = [
    hslToHex(hue, sat, 0),
    hslToHex(hue, sat, 25),
    hslToHex(hue, sat, 50),
    hslToHex(hue, sat, 75),
    hslToHex(hue, sat, 100),
  ];

  return (
    <ScrollView style={styles.container} scrollEnabled={scrollEnabled}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Themakleur</Text>
        <Text style={styles.sectionDesc}>
          Kies een accentkleur voor de app
        </Text>
        <View style={styles.colorGrid}>
          {THEME_COLORS.map((item) => (
            <TouchableOpacity
              key={item.color}
              style={[
                styles.colorOption,
                {
                  borderColor:
                    accentColor === item.color ? item.color : '#2a2a2a',
                },
              ]}
              onPress={() => pickColor(item.color)}
              activeOpacity={0.7}
            >
              <View
                style={[styles.colorSwatch, { backgroundColor: item.color }]}
              >
                {accentColor === item.color && (
                  <Ionicons name="checkmark" size={20} color="#0a0a0a" />
                )}
              </View>
              <Text
                style={[
                  styles.colorLabel,
                  accentColor === item.color && { color: item.color },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Custom color picker */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.pickerToggle}
          onPress={() => setPickerOpen(!pickerOpen)}
          activeOpacity={0.7}
        >
          <View style={styles.pickerToggleLeft}>
            <Ionicons name="color-palette" size={20} color={accentColor} />
            <Text style={styles.sectionTitle}>Eigen kleur kiezen</Text>
          </View>
          <Ionicons
            name={pickerOpen ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#888"
          />
        </TouchableOpacity>

        {pickerOpen && (
          <View style={styles.pickerContainer}>
            <View style={styles.pickerPreview}>
              <View
                style={[
                  styles.pickerPreviewSwatch,
                  { backgroundColor: accentColor },
                ]}
              />
              <Text style={styles.pickerPreviewHex}>
                {accentColor.toUpperCase()}
              </Text>
            </View>

            <ColorSlider
              value={hue / 360}
              onValueChange={onHueChange}
              onSlideStart={onSlideStart}
              onSlideEnd={onSlideEnd}
              gradientColors={hueStops}
              label="Tint"
              displayValue={`${hue}°`}
            />
            <ColorSlider
              value={sat / 100}
              onValueChange={onSatChange}
              onSlideStart={onSlideStart}
              onSlideEnd={onSlideEnd}
              gradientColors={satStops}
              label="Verzadiging"
              displayValue={`${sat}%`}
            />
            <ColorSlider
              value={lit / 100}
              onValueChange={onLitChange}
              onSlideStart={onSlideStart}
              onSlideEnd={onSlideEnd}
              gradientColors={litStops}
              label="Helderheid"
              displayValue={`${lit}%`}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#e0e0e0',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionDesc: {
    color: '#888',
    fontSize: 13,
    marginBottom: 16,
    marginTop: 4,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    width: 90,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  colorLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
  },
  pickerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pickerToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pickerContainer: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  pickerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  pickerPreviewSwatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#2a2a2a',
  },
  pickerPreviewHex: {
    color: '#e0e0e0',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
});
