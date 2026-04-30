import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

// 8 strips, all at the same blur intensity. Opacity steps from 1.0 (outer edge)
// to ~0.125 (inner edge). Keeping intensity constant means no kernel-radius jump
// between strips, so the only transition is in alpha — smooth and imperceptible.
const STRIP_COUNT = 8;
const MAX_INTENSITY = 6;

interface Props {
  edge: 'top' | 'bottom';
  totalHeight: number;
  tint: 'light' | 'dark';
}

export default function EdgeBlurFade({ edge, totalHeight, tint }: Props) {
  const stripHeight = totalHeight / STRIP_COUNT;

  return (
    <>
      {Array.from({ length: STRIP_COUNT }, (_, i) => {
        // Strip 0 = outer edge (full opacity), strip N-1 = inner edge (min opacity)
        const opacity = 1 - (i / STRIP_COUNT);
        const offset = i * stripHeight;
        const positionStyle = edge === 'top' ? { top: offset } : { bottom: offset };

        return (
          <View
            key={i}
            pointerEvents="none"
            style={[styles.strip, positionStyle, { height: stripHeight, opacity }]}
          >
            <BlurView
              intensity={MAX_INTENSITY}
              tint={tint}
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            />
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  strip: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 5,
    overflow: 'hidden',
  },
});
