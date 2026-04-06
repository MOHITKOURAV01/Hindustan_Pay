import { useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { MotiView } from "moti";

export function ParticleField() {
  const { width, height } = Dimensions.get("window");
  const dots = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        key: i,
        left: Math.random() * width,
        top: Math.random() * height * 0.4,
        delay: i * 120,
        size: 2 + Math.random() * 3,
      })),
    [width, height],
  );
  return (
    <View pointerEvents="none" style={{ ...StyleSheet.absoluteFillObject }} collapsable={false}>
      {dots.map((d) => (
        <MotiView
          key={d.key}
          from={{ opacity: 0.15, translateY: 0 }}
          animate={{ opacity: 0.55, translateY: 12 }}
          transition={{ loop: true, type: "timing", duration: 2400 + d.delay, delay: d.delay }}
          style={{
            position: "absolute",
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            borderRadius: 99,
            backgroundColor: "rgba(108,99,255,0.6)",
          }}
        />
      ))}
    </View>
  );
}
