import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import api from "@/src/api/api";
import { useBankAccount } from "@/src/context/BankAccounts";
import { showAlert } from "@/src/utils/utility";

export default function HomeScreen() {
  const { hasBankAccount, selectedAccountId, bankAccounts } = useBankAccount();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleScanQR = () => {
    if (!hasBankAccount) {
      router.push("/accounts");
      showAlert("No Bank Account", "Please link a bank account to proceed.");
    } else if (!selectedAccountId) {
      router.push("/accounts");
      showAlert("No Account Selected", "Please select a bank account.");
    } else {
      router.push("/scan");
    }
  };

  const handleGalleryScan = async () => {
    if (!hasBankAccount) {
      router.push("/accounts");
      showAlert("No Bank Account", "Please link a bank account to proceed.");
      return;
    } else if (!selectedAccountId) {
      router.push("/accounts");
      showAlert("No Account Selected", "Please select a bank account.");
      return;
    }

    setLoading(true);
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showAlert(
          "Permission Denied",
          "We need gallery access to scan QR codes."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const response = await api.post("/claim-money", {
          fundAccountId: selectedAccountId,
        });
        if (response.data.success) {
          showAlert(
            "Success",
            `Money claimed!\nAmount: ₹${response.data.amount}\nPayout ID: ${response.data.payoutId}`
          );
        }
      }
    } catch (error) {
      showAlert(
        "Error",
        "Failed to process QR from gallery: " +
          ((error as any).response?.data?.error || (error as any).message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSettings = () => {
    router.push("/accounts");
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#4c669f", "#3b5998", "#192f6a"]}
        style={styles.gradient}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#4c669f", "#3b5998", "#192f6a"]}
      style={styles.gradient}
    >
      <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
        <FontAwesome name="gear" size={24} color="#fff" />
      </TouchableOpacity>
      <View style={styles.container}>
        <Text style={styles.title}>Claim Your Money</Text>
        <Text style={styles.subtitle}>
          {hasBankAccount
            ? selectedAccountId
              ? "Scan a QR code or select an image to receive money!"
              : "Select a bank account to proceed."
            : "Link a bank account to start claiming money."}
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleScanQR}>
          <Text style={styles.buttonText}>Scan QR Code</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.galleryButton}
          onPress={handleGalleryScan}
        >
          <Text style={styles.buttonText}>Select from Gallery</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  settingsButton: {
    padding: 10,
    alignSelf: "flex-end",
    margin: 10,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#ddd",
    marginBottom: 30,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#00acc1",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  galleryButton: {
    backgroundColor: "#4caf50",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
  },
});
