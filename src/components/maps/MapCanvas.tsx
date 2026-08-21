import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';

interface MapCanvasProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  muted?: boolean;
}

interface MapPinDefinition {
  icon: keyof typeof Ionicons.glyphMap;
  top?: DimensionValue;
  right?: DimensionValue;
  bottom?: DimensionValue;
  left?: DimensionValue;
  color: string;
}

const PINS: MapPinDefinition[] = [
  { icon: 'restaurant' as const, top: '24%', left: '28%', color: colors.coral },
  { icon: 'musical-notes' as const, top: '18%', right: '16%', color: colors.blueDark },
  { icon: 'cafe' as const, top: '58%', left: '12%', color: colors.blueDark },
  { icon: 'wine' as const, bottom: '14%', right: '12%', color: colors.coral },
  { icon: 'camera' as const, bottom: '20%', left: '28%', color: colors.blueDark },
];

export function MapCanvas({ children, style, muted = false }: MapCanvasProps) {
  return (
    <View style={[styles.map, muted && styles.muted, style]} accessibilityLabel="Stylised map of nearby Adelaide experiences">
      <View style={styles.water} />
      <View style={[styles.road, styles.roadOne]} />
      <View style={[styles.road, styles.roadTwo]} />
      <View style={[styles.road, styles.roadThree]} />
      <View style={[styles.road, styles.roadFour]} />
      <View style={[styles.road, styles.roadFive]} />
      <View style={styles.parkOne} />
      <View style={styles.parkTwo} />
      <Text style={[styles.areaLabel, styles.northLabel]}>NORTH{`\n`}ADELAIDE</Text>
      <Text style={[styles.streetLabel, styles.streetOne]}>North Terrace</Text>
      <Text style={[styles.streetLabel, styles.streetTwo]}>King William St</Text>
      {!muted
        ? PINS.map((pin, index) => (
            <View
              key={pin.icon}
              style={[
                styles.pin,
                {
                  top: pin.top,
                  right: pin.right,
                  bottom: pin.bottom,
                  left: pin.left,
                  backgroundColor: pin.color,
                },
              ]}
            >
              <Ionicons name={pin.icon} size={16} color={colors.surface} />
              <View style={[styles.pinTail, { backgroundColor: pin.color }]} />
            </View>
          ))
        : null}
      <View style={styles.radiusRing} />
      <View style={styles.userHalo}>
        <View style={styles.userDot} />
      </View>
      {children}
    </View>
  );
}

export function MapSearchBar() {
  return (
    <View style={styles.searchBar}>
      <Ionicons name="search" size={19} color={colors.charcoalMuted} />
      <Text style={styles.searchText}>What feels good right now?</Text>
      <Ionicons name="navigate" size={18} color={colors.blueDark} />
    </View>
  );
}

const styles = StyleSheet.create({
  map: { overflow: 'hidden', backgroundColor: colors.mapLand, borderRadius: radius.xl },
  muted: { opacity: 0.5 },
  water: { position: 'absolute', width: '28%', height: '115%', left: -20, top: -15, backgroundColor: colors.mapWater, transform: [{ rotate: '5deg' }] },
  road: { position: 'absolute', backgroundColor: colors.surface, borderWidth: 1, borderColor: '#EFE9DB' },
  roadOne: { width: '120%', height: 30, top: '25%', left: '-8%', transform: [{ rotate: '-9deg' }] },
  roadTwo: { width: '120%', height: 25, top: '53%', left: '-8%', transform: [{ rotate: '-12deg' }] },
  roadThree: { width: '118%', height: 24, bottom: '12%', left: '-8%', transform: [{ rotate: '-14deg' }] },
  roadFour: { width: 24, height: '120%', left: '47%', top: '-10%', transform: [{ rotate: '8deg' }] },
  roadFive: { width: 20, height: '120%', right: '18%', top: '-10%', transform: [{ rotate: '-4deg' }] },
  parkOne: { position: 'absolute', width: 90, height: 62, borderRadius: radius.md, backgroundColor: '#DDEED9', top: '8%', right: '24%', opacity: 0.9 },
  parkTwo: { position: 'absolute', width: 78, height: 92, borderRadius: radius.md, backgroundColor: '#E1F1DA', bottom: '27%', left: '22%', opacity: 0.9 },
  areaLabel: { ...typography.caption, color: '#9AA2A9', letterSpacing: 1, textAlign: 'center', fontSize: 10 },
  northLabel: { position: 'absolute', top: '9%', left: '31%' },
  streetLabel: { ...typography.caption, position: 'absolute', color: '#8C929A', fontSize: 8 },
  streetOne: { top: '45%', left: '36%', transform: [{ rotate: '-11deg' }] },
  streetTwo: { bottom: '25%', right: '24%', transform: [{ rotate: '86deg' }] },
  pin: { position: 'absolute', width: 35, height: 35, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.surface, zIndex: 5, ...shadows.card },
  pinTail: { position: 'absolute', width: 11, height: 11, bottom: -4, borderRadius: 2, transform: [{ rotate: '45deg' }], zIndex: -1 },
  radiusRing: { position: 'absolute', width: 90, height: 90, borderRadius: 45, borderWidth: 1, borderColor: 'rgba(91,167,255,0.28)', top: '48%', left: '43%' },
  userHalo: { position: 'absolute', width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(91,167,255,0.22)', top: '54%', left: '49%', alignItems: 'center', justifyContent: 'center', zIndex: 7 },
  userDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.blueDark, borderWidth: 3, borderColor: colors.surface },
  searchBar: { minHeight: 48, borderRadius: radius.pill, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, ...shadows.card },
  searchText: { ...typography.caption, color: colors.charcoalMuted, flex: 1, fontWeight: '500' },
});
