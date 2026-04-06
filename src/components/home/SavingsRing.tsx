import { useEffect } from "react";
import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, { useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { formatCurrency } from "@/utils/formatCurrency";
import type { CurrencyCode } from "@/constants/currencies";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function SavingsRing({
  rate,
  saved,
  target,
  currency,
}: {
  rate: number;
  saved: number;
  target: number;
  currency: CurrencyCode;
}) {
  const { colors } = useTheme();
  const r = 54;
  const stroke = 10;
  const c = 2 * Math.PI * r;
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(Math.min(1, Math.max(0, rate)), { duration: 900 });
  }, [rate, progress]);

  const strokeColor =
    rate < 0.35 ? colors.error : rate < 0.65 ? colors.warning : colors.success;

  const props = useAnimatedProps(() => ({
    strokeDashoffset: c * (1 - progress.value),
  }));

  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ width: 140, height: 140 }}>
        <Svg width={140} height={140}>
          <Circle cx={70} cy={70} r={r} stroke={colors.border} strokeWidth={stroke} fill="none" />
          <AnimatedCircle
            cx={70}
            cy={70}
            r={r}
            stroke={strokeColor}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${c}, ${c}`}
            animatedProps={props}
            strokeLinecap="round"
            rotation="-90"
            origin="70, 70"
          />
        </Svg>
        <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_700Bold", fontSize: 22 }}>{Math.round(rate * 100)}%</Text>
        </View>
      </View>
      <Text style={{ color: colors.textSecondary, marginTop: 8, textAlign: "center", fontSize: 13 }}>
        Monthly savings goal — {formatCurrency(saved, currency)} / {formatCurrency(target, currency)}
      </Text>
    </View>
  );
}
