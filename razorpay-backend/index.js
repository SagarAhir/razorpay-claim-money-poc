const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs").promises;
require("dotenv").config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_API_URL = "https://api.razorpay.com/v1";
const USERS_FILE = "./users.json";

const initializeUsersFile = async () => {
  try {
    await fs.access(USERS_FILE);
  } catch (error) {
    await fs.writeFile(
      USERS_FILE,
      JSON.stringify({ user1: { bankAccounts: [], transactions: [] } }, null, 2)
    );
  }
};

const loadUsers = async () => {
  const data = await fs.readFile(USERS_FILE, "utf8");
  return JSON.parse(data);
};

const saveUsers = async (users) => {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
};

console.log("RAZORPAY_KEY_ID:", RAZORPAY_KEY_ID);
console.log(
  "RAZORPAY_KEY_SECRET:",
  RAZORPAY_KEY_SECRET ? "Loaded" : "Not loaded"
);

const authHeader =
  "Basic " +
  Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
console.log("Auth Header:", authHeader);

const razorpayApi = axios.create({
  baseURL: RAZORPAY_API_URL,
  headers: {
    Authorization: authHeader,
    "Content-Type": "application/json",
  },
});

razorpayApi.interceptors.request.use(
  (config) => {
    console.log("Razorpay Request:", {
      method: config.method.toUpperCase(),
      url: config.url,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error("Razorpay Request Error:", error.message);
    return Promise.reject(error);
  }
);

razorpayApi.interceptors.response.use(
  (response) => {
    console.log("Razorpay Response:", {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error("Razorpay Response Error:", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

app.get("/user/bank-status", async (req, res) => {
  const userId = "user1";
  const users = await loadUsers();
  const user = users[userId] || { bankAccounts: [], transactions: [] };
  res.json({
    hasBankAccount: user.bankAccounts.length > 0,
    accounts: user.bankAccounts.map((account) => ({
      fundAccountId: account.fundAccountId,
      accountNumber: account.accountNumber,
      ifscCode: account.ifscCode,
      accountHolderName: account.accountHolderName,
    })),
  });
});

app.post("/link-bank", async (req, res) => {
  const { accountNumber, ifscCode, accountHolderName } = req.body;
  const userId = "user1";

  if (!accountNumber || !ifscCode || !accountHolderName) {
    return res.status(400).json({ error: "Missing bank details" });
  }

  const users = await loadUsers();
  const user = users[userId] || { bankAccounts: [], transactions: [] };

  const existingAccount = user.bankAccounts.find(
    (acc) => acc.accountNumber === accountNumber && acc.ifscCode === ifscCode
  );
  if (existingAccount) {
    return res.status(400).json({ error: "Bank account already linked" });
  }

  try {
    const contactResponse = await razorpayApi.post("/contacts", {
      name: accountHolderName,
      email: "user@example.com",
      contact: "9876543210",
      type: "customer",
    });
    const contact = contactResponse.data;

    const fundAccountResponse = await razorpayApi.post("/fund_accounts", {
      contact_id: contact.id,
      account_type: "bank_account",
      bank_account: {
        name: accountHolderName,
        account_number: accountNumber,
        ifsc: ifscCode,
      },
    });
    const fundAccount = fundAccountResponse.data;

    user.bankAccounts.push({
      fundAccountId: fundAccount.id,
      accountNumber,
      ifscCode,
      accountHolderName,
    });
    users[userId] = user;
    await saveUsers(users);

    res.json({ success: true, fundAccountId: fundAccount.id });
  } catch (error) {
    console.error(
      "Error linking bank account:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to link bank account" });
  }
});

app.post("/claim-money", async (req, res) => {
  const { fundAccountId, amount, currency } = req.body; // QR code data
  const userId = "user1";
  const users = await loadUsers();
  const user = users[userId];

  if (!user || user.bankAccounts.length === 0) {
    return res.status(400).json({ error: "No bank account linked" });
  }

  if (
    !fundAccountId ||
    !user.bankAccounts.some((acc) => acc.fundAccountId === fundAccountId)
  ) {
    return res
      .status(400)
      .json({ error: "Invalid or unselected fund account" });
  }

  try {
    const payoutResponse = await razorpayApi.post("/payouts", {
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
      fund_account_id: fundAccountId,
      amount: amount || 1000, // Default ₹10 if QR lacks amount
      currency: currency || "INR",
      mode: "IMPS",
      purpose: "payout",
    });
    const payout = payoutResponse.data;

    // Store transaction
    user.transactions = user.transactions || [];
    user.transactions.push({
      payoutId: payout.id,
      fundAccountId,
      amount: payout.amount,
      currency: payout.currency,
      status: payout.status,
      timestamp: new Date().toISOString(),
    });
    users[userId] = user;
    await saveUsers(users);

    res.json({
      success: true,
      payoutId: payout.id,
      amount: payout.amount / 100,
      status: payout.status,
    });
  } catch (error) {
    console.error(
      "Error processing payout:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to process payout" });
  }
});

app.get("/user/transactions", async (req, res) => {
  const userId = "user1";
  const users = await loadUsers();
  const user = users[userId] || { bankAccounts: [], transactions: [] };
  res.json({
    transactions: user.transactions || [],
  });
});

const startServer = async () => {
  await initializeUsersFile();
  app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
  });
};

startServer();
