import { BlurView } from 'expo-blur';

const STRIP_INTENSITIES = [6, 4, 2, 1];

interface Props {
  edge: 'top' | 'bottom';
  totalHeight: number;
  tint: 'light' | 'dark';
}

export default function EdgeBlurFade({ edge, totalHeight, tint }: Props) {
  const stripCount = STRIP_INTENSITIES.length;
  const stripHeight = totalHeight / stripCount;

  return (
    <>
      {STRIP_INTENSITIES.map((intensity, i) => {
        const offset = i * stripHeight;
        const positionStyle = edge === 'top' ? { top: offset } : { bottom: offset };
        return (
          <BlurView
            key={i}
            intensity={intensity}
            tint={tint}
            experimentalBlurMethod="dimezisBlurView"
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: stripHeight,
              zIndex: 5,
              overflow: 'hidden',
              ...positionStyle,
            }}
          />
        );
      })}
    </>
  );
}
