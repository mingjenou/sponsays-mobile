import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { radius } from '@/src/theme';

interface ExperienceArtworkProps {
  style?: StyleProp<ViewStyle>;
  rounded?: boolean;
}

const BUILDINGS = [34, 58, 43, 76, 51, 91, 62, 45, 80, 54, 68, 39];

export function ExperienceArtwork({ style, rounded = true }: ExperienceArtworkProps) {
  return (
    <LinearGradient
      colors={['#777FB1', '#E7A67F', '#FFCF83']}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={[styles.artwork, rounded && styles.rounded, style]}
    >
      <View style={styles.sun} />
      <View style={styles.stringLine} />
      {[10, 24, 39, 55, 70, 84].map((left, index) => (
        <View key={left} style={[styles.bulb, { left: `${left}%`, top: 26 + (index % 2) * 9 }]} />
      ))}
      <View style={styles.skyline}>
        {BUILDINGS.map((height, index) => (
          <View key={`${height}-${index}`} style={[styles.building, { height, flex: index % 3 === 0 ? 1.25 : 1 }]}>
            {index % 2 === 0 ? <View style={styles.window} /> : null}
          </View>
        ))}
      </View>
      <View style={styles.rooftop}>
        {[0, 1, 2, 3, 4].map((person) => (
          <View key={person} style={styles.person}>
            <View style={styles.head} />
            <View style={styles.body} />
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  artwork: { overflow: 'hidden', backgroundColor: '#A77C88' },
  rounded: { borderRadius: radius.lg },
  sun: { position: 'absolute', width: 92, height: 92, borderRadius: 46, right: 24, top: 34, backgroundColor: 'rgba(255,211,139,0.7)' },
  stringLine: { position: 'absolute', top: 28, left: -10, width: '115%', height: 1, backgroundColor: 'rgba(31,31,35,0.78)', transform: [{ rotate: '8deg' }] },
  bulb: { position: 'absolute', width: 5, height: 8, borderRadius: 4, backgroundColor: '#FFE6A7', shadowColor: '#FFD26D', shadowOpacity: 0.9, shadowRadius: 5 },
  skyline: { position: 'absolute', bottom: 42, left: 0, right: 0, height: 110, flexDirection: 'row', alignItems: 'flex-end' },
  building: { backgroundColor: '#23262F', marginRight: 2, minWidth: 14, opacity: 0.96 },
  window: { width: 3, height: 5, backgroundColor: '#F6C76E', margin: 5 },
  rooftop: { position: 'absolute', height: 48, left: 0, right: 0, bottom: 0, backgroundColor: '#18191D', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-around', paddingTop: 3 },
  person: { alignItems: 'center' },
  head: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2D2524' },
  body: { width: 18, height: 26, borderRadius: 8, backgroundColor: '#3E3030', marginTop: -1 },
});
