import React, { useEffect } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, { interpolate, useAnimatedProps, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { radius } from "@/constants/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  score: number;
  grade: string;
  label: string;
  color: string;
  onPress: () => void;
};

export function HealthScoreCard({ score, grade, label, color, onPress }: Props) {
  const { colors, isDark } = useTheme();
  const progress = useSharedValue(0);
  
  const size = 100;
  const strokeWidth = 10;
  const radiusCircle = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusCircle;

  useEffect(() => {
    progress.value = withTiming(score / 100, { duration: 1500 });
  }, [score, progress]);

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: circumference * (1 - progress.value),
    };
  });

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.left}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Financial Health</Text>
        <Text style={[styles.label, { color }]}>{label}</Text>
        <Text style={[styles.tip, { color: colors.textSecondary }]}>Tap for breakdown</Text>
      </View>
      
      <View style={styles.right}>
        <Svg width={size} height={size} style={styles.svg}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radiusCircle}
            stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radiusCircle}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
            fill="none"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.gradeContainer}>
          <Text style={[styles.grade, { color: colors.textPrimary }]}>{grade}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  left: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: "SpaceGrotesk_600SemiBold",
  },
  label: {
    fontSize: 22,
    fontFamily: "SpaceGrotesk_700Bold",
    marginTop: 4,
  },
  tip: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  right: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  svg: {
    position: "absolute",
  },
  gradeContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  grade: {
    fontSize: 24,
    fontFamily: "SpaceGrotesk_700Bold",
  },
});
