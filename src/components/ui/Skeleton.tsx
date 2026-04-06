import { useEffect } from "react";
import { View, type DimensionValue, type LayoutChangeEvent } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";
import { radius } from "@/constants/theme";

function ShimmerBox({
  height,
  width,
  borderRadius: br,
}: {
  height: number;
  width: DimensionValue;
  borderRadius: number;
}) {
  const { colors } = useTheme();
  const barW = useSharedValue(200);
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [t]);

  const onLayout = (e: LayoutChangeEvent) => {
    barW.value = Math.max(120, e.nativeEvent.layout.width);
  };

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(t.value, [0, 1], [-barW.value, barW.value]) }],
  }));

  return (
    <View
      onLayout={onLayout}
      style={{
        height,
        width,
        borderRadius: br,
        overflow: "hidden",
        backgroundColor: colors.surfaceElevated,
      }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            bottom: 0,
            width: "50%",
            left: 0,
          },
          barStyle,
        ]}
      >
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.2)", "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

export function Skeleton({ height = 16, width = "100%" as const }: { height?: number; width?: number | `${number}%` }) {
  return <ShimmerBox height={height} width={width} borderRadius={radius.sm} />;
}

export function SkeletonText({ width = "70%" as const }: { width?: number | `${number}%` }) {
  return <ShimmerBox height={14} width={width} borderRadius={radius.sm} />;
}

export function SkeletonCard() {
  return <ShimmerBox height={88} width="100%" borderRadius={radius.lg} />;
}

export function SkeletonAvatar() {
  return <ShimmerBox height={48} width={48} borderRadius={radius.full} />;
}
