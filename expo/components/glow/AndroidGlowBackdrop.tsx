import { Platform, View } from 'react-native';

interface Props {
  color: string;
  intensity: number;
  shape: 'circle' | 'rect';
  size: { width: number; height: number };
  borderRadius?: number;
}

export default function AndroidGlowBackdrop({ color, intensity, shape, size, borderRadius = 0 }: Props) {
  if (Platform.OS === 'ios' || intensity === 0) return null;

  const layers = [
    { spread: 4 + intensity * 12, opacity: 0.15 + intensity * 0.35 },
    { spread: 2 + intensity * 8,  opacity: 0.10 + intensity * 0.25 },
    { spread: intensity * 4,      opacity: 0.08 + intensity * 0.15 },
  ].filter(l => l.spread > 0);

  return (
    <>
      {layers.map((layer, i) => {
        const w = size.width + layer.spread * 2;
        const h = size.height + layer.spread * 2;
        const br = shape === 'circle' ? w / 2 : borderRadius + layer.spread;
        return (
          <View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: w,
              height: h,
              left: -layer.spread,
              top: -layer.spread,
              borderRadius: br,
              backgroundColor: color,
              opacity: layer.opacity,
            }}
          />
        );
      })}
    </>
  );
}
