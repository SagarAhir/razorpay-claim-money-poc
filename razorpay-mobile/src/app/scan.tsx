import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { BarcodeScanningResult, Camera, CameraView } from "expo-camera"; // Updated import
import { LinearGradient } from "expo-linear-gradient";
import api from "@/src/api/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showAlert } from "../utils/utility";

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [fundAccountId, setFundAccountId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
    (async () => {
      const result = await AsyncStorage.getItem("selectedAccountId");
      setFundAccountId(result);
    })();
  }, []);

  const handleBarCodeScanned = async (data: BarcodeScanningResult) => {
    setLoading(true);
    if (loading) return;
    try {
      console.log("Data: ", data);
      const qrData = {
        amount: data.data ? Number(data.data) * 100 : 0,
        fundAccountId,
      };
      if (!data.data) return;
      const response = await api.post("/claim-money", qrData);
      if (response.data.success) {
        showAlert(
          "Success",
          `Money claimed!\nAmount: ₹${response.data.amount}\nPayout ID: ${response.data.payoutId}`
        );
      }
    } catch (error) {
      showAlert(
        "Error",
        "Failed to process payout: " +
          ((error as any).response?.data?.error || (error as any).message)
      );
    } finally {
      handleCancel();
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (hasPermission === null) {
    return (
      <LinearGradient
        colors={["#4c669f", "#3b5998", "#192f6a"]}
        style={styles.gradient}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            Requesting camera permission...
          </Text>
        </View>
      </LinearGradient>
    );
  }
  if (hasPermission === false) {
    return (
      <LinearGradient
        colors={["#4c669f", "#3b5998", "#192f6a"]}
        style={styles.gradient}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>No access to camera</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "red" }}>
      <LinearGradient
        colors={["#4c669f", "#3b5998", "#192f6a"]}
        style={styles.gradient}
      >
        <CameraView
          style={styles.camera}
          onBarcodeScanned={handleBarCodeScanned}
        >
          <Text style={styles.scanText}>Scan QR Code</Text>
          <View style={styles.overlay}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Processing payout...</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  camera: {
    flex: 1,
    height: "100%",
    width: "100%",
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  scanText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    alignSelf: "center",
  },
  cancelButton: {
    backgroundColor: "#ff4444",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
  },
});
