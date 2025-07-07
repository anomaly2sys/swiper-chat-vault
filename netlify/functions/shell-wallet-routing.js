const { MongoClient } = require("mongodb");

// MongoDB connection setup
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const client = new MongoClient(
    process.env.MONGODB_URI || "mongodb://localhost:27017/swiperempire",
  );
  await client.connect();
  cachedDb = client.db();
  return cachedDb;
}

// In-memory fallback for development
let shellWallets = [];
let feeTransactions = [];
let routingConfig = {
  minMixingRounds: 3,
  maxMixingRounds: 7,
  minDelayMinutes: 30,
  maxDelayMinutes: 180,
  maxWalletBalance: 0.1,
  cycleIntervalHours: 6,
  enableAutomatedMixing: true,
};

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  try {
    const path = event.path.replace(
      "/.netlify/functions/shell-wallet-routing",
      "",
    );

    if (event.httpMethod === "POST" && path === "/route-fee") {
      return await handleRouteFee(event, headers);
    } else if (event.httpMethod === "GET" && path === "/status") {
      return await handleGetStatus(event, headers);
    } else if (event.httpMethod === "GET" && path === "/transaction-status") {
      return await handleGetTransactionStatus(event, headers);
    } else if (event.httpMethod === "GET" && path === "/vendor-summary") {
      return await handleGetVendorSummary(event, headers);
    } else if (event.httpMethod === "POST" && path === "/execute-cycle") {
      return await handleExecuteCycle(event, headers);
    } else if (event.httpMethod === "PUT" && path === "/config") {
      return await handleUpdateConfig(event, headers);
    } else if (event.httpMethod === "GET" && path === "/config") {
      return await handleGetConfig(event, headers);
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Endpoint not found" }),
    };
  } catch (error) {
    console.error("Shell wallet routing error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

async function handleRouteFee(event, headers) {
  const { sourceTransactionId, amount, vendorId } = JSON.parse(event.body);

  if (!sourceTransactionId || !amount) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing required fields" }),
    };
  }

  try {
    // Get or create shell wallet
    const shellWallet = await getAvailableShellWallet();

    // Create fee transaction
    const feeTransaction = {
      id: generateTransactionId(),
      sourceTransactionId,
      vendorId: vendorId || "unknown",
      amount: parseFloat(amount),
      shellWalletId: shellWallet.id,
      timestamp: Date.now(),
      status: "pending",
      mixingRounds: randomBetween(
        routingConfig.minMixingRounds,
        routingConfig.maxMixingRounds,
      ),
      delayMinutes: randomBetween(
        routingConfig.minDelayMinutes,
        routingConfig.maxDelayMinutes,
      ),
      createdAt: new Date(),
    };

    // Store transaction
    if (process.env.MONGODB_URI) {
      const db = await connectToDatabase();
      await db.collection("fee_transactions").insertOne(feeTransaction);

      // Update shell wallet
      await db.collection("shell_wallets").updateOne(
        { id: shellWallet.id },
        {
          $inc: { balance: feeTransaction.amount },
          $set: { lastUsed: Date.now() },
        },
      );
    } else {
      feeTransactions.push(feeTransaction);
      shellWallet.balance += feeTransaction.amount;
      shellWallet.lastUsed = Date.now();
    }

    // Schedule mixing (in a real implementation, this would use a job queue)
    scheduleMixing(feeTransaction.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        transactionId: feeTransaction.id,
        shellWalletId: shellWallet.id,
        estimatedCompletionTime:
          Date.now() + feeTransaction.delayMinutes * 60 * 1000,
      }),
    };
  } catch (error) {
    console.error("Route fee error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to route fee" }),
    };
  }
}

async function handleGetStatus(event, headers) {
  try {
    let totalFeesCollected = 0;
    let feesInMixing = 0;
    let feesDispersed = 0;
    let activeShellWallets = 0;

    if (process.env.MONGODB_URI) {
      const db = await connectToDatabase();

      // Aggregate fee statistics
      const feeStats = await db
        .collection("fee_transactions")
        .aggregate([
          {
            $group: {
              _id: null,
              totalCollected: { $sum: "$amount" },
              inMixing: {
                $sum: {
                  $cond: [
                    { $in: ["$status", ["pending", "mixing"]] },
                    "$amount",
                    0,
                  ],
                },
              },
              dispersed: {
                $sum: {
                  $cond: [
                    { $in: ["$status", ["dispersed", "completed"]] },
                    "$amount",
                    0,
                  ],
                },
              },
            },
          },
        ])
        .toArray();

      if (feeStats.length > 0) {
        totalFeesCollected = feeStats[0].totalCollected || 0;
        feesInMixing = feeStats[0].inMixing || 0;
        feesDispersed = feeStats[0].dispersed || 0;
      }

      // Count active shell wallets
      activeShellWallets = await db
        .collection("shell_wallets")
        .countDocuments({ isActive: true });
    } else {
      // In-memory calculations
      totalFeesCollected = feeTransactions.reduce(
        (sum, tx) => sum + tx.amount,
        0,
      );
      feesInMixing = feeTransactions
        .filter((tx) => ["pending", "mixing"].includes(tx.status))
        .reduce((sum, tx) => sum + tx.amount, 0);
      feesDispersed = feeTransactions
        .filter((tx) => ["dispersed", "completed"].includes(tx.status))
        .reduce((sum, tx) => sum + tx.amount, 0);
      activeShellWallets = shellWallets.filter((w) => w.isActive).length;
    }

    const status = {
      totalFeesCollected,
      feesInMixing,
      feesDispersed,
      activeShellWallets,
      lastCycleTime: 0, // Would be tracked in real implementation
      nextCycleTime:
        Date.now() + routingConfig.cycleIntervalHours * 60 * 60 * 1000,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(status),
    };
  } catch (error) {
    console.error("Get status error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to get status" }),
    };
  }
}

async function handleGetTransactionStatus(event, headers) {
  const { transactionId } = event.queryStringParameters || {};

  if (!transactionId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing transaction ID" }),
    };
  }

  try {
    let transaction = null;

    if (process.env.MONGODB_URI) {
      const db = await connectToDatabase();
      transaction = await db
        .collection("fee_transactions")
        .findOne({ id: transactionId });
    } else {
      transaction = feeTransactions.find((tx) => tx.id === transactionId);
    }

    if (!transaction) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Transaction not found" }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        mixingRounds: transaction.mixingRounds,
        timestamp: transaction.timestamp,
        destinationAddress: transaction.destinationAddress,
      }),
    };
  } catch (error) {
    console.error("Get transaction status error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to get transaction status" }),
    };
  }
}

async function handleGetVendorSummary(event, headers) {
  const { vendorId } = event.queryStringParameters || {};

  if (!vendorId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing vendor ID" }),
    };
  }

  try {
    let summary = {
      totalFees: 0,
      transactionsCount: 0,
      lastFeeTime: 0,
    };

    if (process.env.MONGODB_URI) {
      const db = await connectToDatabase();
      const vendorStats = await db
        .collection("fee_transactions")
        .aggregate([
          { $match: { vendorId } },
          {
            $group: {
              _id: null,
              totalFees: { $sum: "$amount" },
              transactionsCount: { $sum: 1 },
              lastFeeTime: { $max: "$timestamp" },
            },
          },
        ])
        .toArray();

      if (vendorStats.length > 0) {
        summary = vendorStats[0];
        delete summary._id;
      }
    } else {
      const vendorTransactions = feeTransactions.filter(
        (tx) => tx.vendorId === vendorId,
      );
      summary = {
        totalFees: vendorTransactions.reduce((sum, tx) => sum + tx.amount, 0),
        transactionsCount: vendorTransactions.length,
        lastFeeTime: Math.max(
          ...vendorTransactions.map((tx) => tx.timestamp),
          0,
        ),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(summary),
    };
  } catch (error) {
    console.error("Get vendor summary error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to get vendor summary" }),
    };
  }
}

async function getAvailableShellWallet() {
  // Find available wallet or create new one
  let availableWallet = null;

  if (process.env.MONGODB_URI) {
    const db = await connectToDatabase();
    availableWallet = await db.collection("shell_wallets").findOne({
      isActive: true,
      balance: { $lt: routingConfig.maxWalletBalance },
    });

    if (!availableWallet) {
      availableWallet = createShellWallet();
      await db.collection("shell_wallets").insertOne(availableWallet);
    }
  } else {
    availableWallet = shellWallets.find(
      (w) => w.isActive && w.balance < routingConfig.maxWalletBalance,
    );

    if (!availableWallet) {
      availableWallet = createShellWallet();
      shellWallets.push(availableWallet);
    }
  }

  return availableWallet;
}

function createShellWallet() {
  return {
    id: generateWalletId(),
    address: generateWalletAddress(),
    balance: 0,
    createdAt: Date.now(),
    lastUsed: Date.now(),
    isActive: true,
    cycleNumber: Math.floor(
      Date.now() / (1000 * 60 * 60 * routingConfig.cycleIntervalHours),
    ),
  };
}

function generateWalletAddress() {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let address = "1";
  for (let i = 0; i < 33; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return address;
}

function scheduleMixing(transactionId) {
  // In a real implementation, this would use a job queue like Bull or AWS SQS
  // For now, we'll simulate with a timeout
  setTimeout(async () => {
    try {
      await executeMixingProcess(transactionId);
    } catch (error) {
      console.error("Mixing process failed:", error);
    }
  }, 60000); // 1 minute delay for demo
}

async function executeMixingProcess(transactionId) {
  let transaction = null;

  if (process.env.MONGODB_URI) {
    const db = await connectToDatabase();
    transaction = await db
      .collection("fee_transactions")
      .findOne({ id: transactionId });

    if (transaction && transaction.status === "pending") {
      await db.collection("fee_transactions").updateOne(
        { id: transactionId },
        {
          $set: {
            status: "completed",
            destinationAddress: generateDestinationAddress(),
            completedAt: new Date(),
          },
        },
      );
    }
  } else {
    transaction = feeTransactions.find((tx) => tx.id === transactionId);
    if (transaction && transaction.status === "pending") {
      transaction.status = "completed";
      transaction.destinationAddress = generateDestinationAddress();
      transaction.completedAt = new Date();
    }
  }
}

function generateDestinationAddress() {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let address = "bc1";
  for (let i = 0; i < 39; i++) {
    address += chars
      .charAt(Math.floor(Math.random() * chars.length))
      .toLowerCase();
  }
  return address;
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateTransactionId() {
  return "tx_" + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function generateWalletId() {
  return (
    "shell_" + Date.now().toString(36) + Math.random().toString(36).substr(2)
  );
}

async function handleExecuteCycle(event, headers) {
  // Manual cycle execution endpoint
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: "Cycle execution initiated",
    }),
  };
}

async function handleUpdateConfig(event, headers) {
  const newConfig = JSON.parse(event.body);

  // Validate config
  if (typeof newConfig !== "object") {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid config format" }),
    };
  }

  // Update routing config
  routingConfig = { ...routingConfig, ...newConfig };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, config: routingConfig }),
  };
}

async function handleGetConfig(event, headers) {
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(routingConfig),
  };
}
