import { Share, Alert, Platform } from "react-native";

/**
 * App Sharing & Deep Linking logic.
 * Demonstrates viral growth features (Referrals, Social Share).
 */

export const shareInsight = async (title: string, body: string) => {
  try {
    const message = `${title}\n\n${body}\n\nCheck out my financial health on Hindustan Pay! 🇮🇳\nDownload now.`;
    const result = await Share.share({
      title,
      message,
      url: "https://hindustanpay.com/app", // Demo link
    });

    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        // Shared with activity type of result.activityType
      } else {
        // Shared
      }
    } else if (result.action === Share.dismissedAction) {
      // Dismissed
    }
  } catch (error) {
    Alert.alert("Error sharing insight", (error as Error).message);
  }
};

export const shareApp = async () => {
  try {
    const result = await Share.share({
      message: "Take control of your finances with Hindustan Pay — India's premium wealth tracker. Download now at https://hindustanpay.com",
    });
    if (result.action === Share.sharedAction) {
      // Success
    }
  } catch (error) {
     Alert.alert("Error sharing app", (error as Error).message);
  }
};

/**
 * Deep Link handler logic stub.
 * In expo-router, this is handled by mapping the 'scheme' in app.json.
 */
export const openDeepLink = (path: string) => {
  const url = `hindustanpay://${path}`;
  // Linking.openURL(url);
  console.log(`[DeepLink] Triggered: ${url}`);
};
