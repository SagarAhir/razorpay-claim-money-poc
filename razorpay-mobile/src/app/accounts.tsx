import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import api from "@/src/api/api";
import { useBankAccount } from "@/src/context/BankAccounts";
import { BankAccountItem } from "@/src/types";
import { showAlert } from "../utils/utility";

export default function AccountSelectionScreen() {
  const {
    bankAccounts,
    selectedAccountId,
    setSelectedAccountId,
    refreshBankAccounts,
  } = useBankAccount();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    ifscCode: "",
    accountHolderName: "",
  });
  const router = useRouter();

  const handleInputChange = (field: string, value: string) => {
    setBankDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleLinkBankAccount = async () => {
    if (
      !bankDetails.accountNumber ||
      !bankDetails.ifscCode ||
      !bankDetails.accountHolderName
    ) {
      showAlert("Error", "Please fill in all bank details.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/link-bank", bankDetails);
      if (response.data.success) {
        await refreshBankAccounts(); // Refresh accounts from API
        setSelectedAccountId(response.data.fundAccountId);
        setShowForm(false);
        showAlert("Success", "Bank account linked successfully!");
      }
    } catch (error) {
      showAlert(
        "Error",
        "Failed to link account: " +
          ((error as any).response?.data?.error || (error as any).message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setBankDetails({ accountNumber: "", ifscCode: "", accountHolderName: "" });
  };

  const handleSelectAccount = async () => {
    if (selectedAccountId) {
      await setSelectedAccountId(selectedAccountId); // Updates AsyncStorage via context
      router.back();
    } else {
      showAlert("Error", "Please select an account.");
    }
  };

  const renderAccountItem = ({ item }: { item: BankAccountItem }) => (
    <TouchableOpacity
      style={[
        styles.card,
        selectedAccountId === item.fundAccountId && styles.selectedCard,
      ]}
      onPress={() => setSelectedAccountId(item.fundAccountId)}
    >
      <Text style={styles.cardTitle}>{item.accountHolderName}</Text>
      <Text style={styles.cardText}>A/C: {item.accountNumber.slice(-4)}</Text>
      <Text style={styles.cardText}>IFSC: {item.ifscCode}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <LinearGradient
        colors={["#4c669f", "#3b5998", "#192f6a"]}
        style={styles.gradient}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading accounts...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (showForm) {
    return (
      <LinearGradient
        colors={["#4c669f", "#3b5998", "#192f6a"]}
        style={styles.gradient}
      >
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Add New Bank Account</Text>
          <Text style={styles.label}>Account Holder Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter name"
            placeholderTextColor="#aaa"
            value={bankDetails.accountHolderName}
            onChangeText={(text) =>
              handleInputChange("accountHolderName", text)
            }
            selectionColor="#fff"
          />
          <Text style={styles.label}>Account Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter account number"
            placeholderTextColor="#aaa"
            value={bankDetails.accountNumber}
            onChangeText={(text) => handleInputChange("accountNumber", text)}
            keyboardType="numeric"
            selectionColor="#fff"
          />
          <Text style={styles.label}>IFSC Code</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., SBIN0001234"
            placeholderTextColor="#aaa"
            value={bankDetails.ifscCode}
            onChangeText={(text) => handleInputChange("ifscCode", text)}
            selectionColor="#fff"
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={handleLinkBankAccount}
            >
              <Text style={styles.buttonText}>Add Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#4c669f", "#3b5998", "#192f6a"]}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Select Bank Account</Text>
        <FlatList
          data={bankAccounts}
          renderItem={renderAccountItem}
          keyExtractor={(item) => item.fundAccountId}
          style={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No accounts linked</Text>
          }
        />
        <View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowForm(true)}
          >
            <Text style={styles.buttonText}>Add New Account</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={handleSelectAccount}
          >
            <Text style={styles.buttonText}>Select Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 15,
    margin: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 5,
    alignSelf: "flex-start",
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    color: "#fff",
    marginBottom: 15,
  },
  list: {
    width: "100%",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    backgroundColor: "#e0f7fa",
    borderWidth: 2,
    borderColor: "#00acc1",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  cardText: {
    fontSize: 14,
    color: "#666",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 10,
  },
  linkButton: {
    backgroundColor: "#00acc1",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  backButton: {
    backgroundColor: "#ff4444",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  addButton: {
    backgroundColor: "#00acc1",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 10,
    alignSelf: "center",
  },
  selectButton: {
    backgroundColor: "#4caf50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 10,
    alignSelf: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  emptyText: {
    color: "#ddd",
    fontSize: 16,
    textAlign: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
  },
});
