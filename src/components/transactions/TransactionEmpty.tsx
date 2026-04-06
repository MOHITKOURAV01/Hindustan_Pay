import { View } from "react-native";
import LottieView from "lottie-react-native";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { useRouter } from "expo-router";

export function TransactionEmpty() {
  const router = useRouter();
  return (
    <View style={{ alignItems: "center", paddingVertical: 40, paddingHorizontal: 24 }}>
      <LottieView source={require("../../../assets/lottie/empty-wallet.json")} autoPlay loop style={{ width: 220, height: 220 }} />
      <Typography variant="h1" style={{ marginTop: 8, textAlign: "center" }}>
        No transactions yet
      </Typography>
      <Typography variant="body" color="#8888AA" style={{ marginTop: 8, textAlign: "center" }}>
        Add your first transaction to get started
      </Typography>
      <View style={{ marginTop: 24, width: "100%" }}>
        <Button title="Add transaction" onPress={() => router.push("/modals/add-transaction" as never)} />
      </View>
    </View>
  );
}
