import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { nanoid } from "nanoid/non-secure";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/hooks/useTheme";
import { useGoalStore } from "@/store/useGoalStore";
import { goalSchema, type GoalFormValues } from "@/utils/validators";

export default function AddGoalModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const { colors } = useTheme();
  const addGoal = useGoalStore((s) => s.addGoal);

  const { control, handleSubmit, watch, setValue } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema) as never,
    defaultValues: {
      title: "",
      type: params.type === "no-spend" || params.type === "challenge" || params.type === "budget" ? (params.type as GoalFormValues["type"]) : "savings",
      targetAmount: 10000,
      emoji: "🎯",
      color: "#6C63FF",
    },
  });

  const type = watch("type");

  useEffect(() => {
    const t = params.type;
    if (t === "no-spend" || t === "challenge" || t === "budget" || t === "savings") {
      setValue("type", t);
    }
  }, [params.type, setValue]);

  const save = handleSubmit((v) => {
    addGoal({
      title: v.title,
      type: v.type,
      targetAmount: Number(v.targetAmount),
      currentAmount: 0,
      deadline: v.deadline ?? null,
      categoryId: v.categoryId ?? null,
      emoji: v.emoji ?? "🎯",
      color: v.color ?? "#6C63FF",
      streakCount: 0,
      isCompleted: false,
    });
    router.back();
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: 48 }}>
      <Pressable onPress={() => router.back()} style={{ paddingHorizontal: 20 }}>
        <Text style={{ color: colors.primary }}>Close</Text>
      </Pressable>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ color: colors.textPrimary, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 20, marginBottom: 16 }}>New goal</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {(["savings", "challenge", "no-spend", "budget"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setValue("type", t)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: type === t ? "rgba(108,99,255,0.25)" : colors.surfaceElevated,
                borderWidth: 1,
                borderColor: type === t ? colors.primary : colors.border,
              }}
            >
              <Text style={{ color: colors.textPrimary, textTransform: "capitalize" }}>{t}</Text>
            </Pressable>
          ))}
        </View>
        <Controller control={control} name="title" render={({ field }) => <Input label="Goal name" value={field.value} onChangeText={field.onChange} />} />
        <Controller
          control={control}
          name="targetAmount"
          render={({ field }) => (
            <Input label="Target amount" value={String(field.value)} onChangeText={(x) => field.onChange(parseFloat(x || "0"))} keyboardType="decimal-pad" />
          )}
        />
        <Controller control={control} name="emoji" render={({ field }) => <Input label="Emoji" value={field.value ?? ""} onChangeText={field.onChange} />} />
        <Controller control={control} name="color" render={({ field }) => <Input label="Color hex" value={field.value ?? ""} onChangeText={field.onChange} />} />
        <Button title="Create goal" onPress={() => void save()} />
      </ScrollView>
    </View>
  );
}
