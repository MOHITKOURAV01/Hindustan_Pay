import * as Crypto from "expo-crypto";

export async function hashPIN(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
}

export async function verifyPIN(input: string, storedHash: string): Promise<boolean> {
  const h = await hashPIN(input);
  return h === storedHash;
}
