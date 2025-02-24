import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/src/api/api";
import { BankAccountItem } from "@/src/types";

interface BankAccountContextType {
  hasBankAccount: boolean;
  bankAccounts: BankAccountItem[];
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string | null) => void;
  refreshBankAccounts: () => Promise<void>;
}

const BankAccountContext = createContext<BankAccountContextType | undefined>(
  undefined
);

export const BankAccountProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [hasBankAccount, setHasBankAccount] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>([]);
  const [selectedAccountId, setSelectedAccountIdState] = useState<
    string | null
  >(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await api.get("/user/bank-status");
        setHasBankAccount(response.data.hasBankAccount);
        setBankAccounts(response.data.accounts);
      } catch (error) {
        console.error("Failed to load bank accounts:", error);
      }
    };
    loadData();
  }, []);

  const setSelectedAccountId = async (id: string | null) => {
    setSelectedAccountIdState(id);
    if (id) {
      await AsyncStorage.setItem("selectedAccountId", id);
    } else {
      await AsyncStorage.removeItem("selectedAccountId");
    }
  };

  const refreshBankAccounts = async () => {
    try {
      const response = await api.get("/user/bank-status");
      setHasBankAccount(response.data.hasBankAccount);
      setBankAccounts(response.data.accounts);
    } catch (error) {
      console.error("Failed to refresh bank accounts:", error);
    }
  };

  return (
    <BankAccountContext.Provider
      value={{
        hasBankAccount,
        bankAccounts,
        selectedAccountId,
        setSelectedAccountId,
        refreshBankAccounts,
      }}
    >
      {children}
    </BankAccountContext.Provider>
  );
};

export const useBankAccount = () => {
  const context = useContext(BankAccountContext);
  if (!context) {
    throw new Error("useBankAccount must be used within a BankAccountProvider");
  }
  return context;
};
