import * as LocalAuthentication from "expo-local-authentication";
import { useCallback, useState } from "react";

export function useBiometric() {
  const [available, setAvailable] = useState(false);

  const check = useCallback(async () => {
    const has = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setAvailable(has && enrolled);
    return has && enrolled;
  }, []);

  const authenticate = useCallback(async (reason: string) => {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: "Use PIN",
    });
    return res.success;
  }, []);

  return { available, check, authenticate };
}
