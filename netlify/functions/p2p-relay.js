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
let relayMessages = [];
let signalingMessages = [];

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  try {
    const path = event.path.replace("/.netlify/functions/p2p-relay", "");

    if (event.httpMethod === "POST" && path === "") {
      // Store relay message
      return await handleStoreMessage(event, headers);
    } else if (event.httpMethod === "GET" && path === "/messages") {
      // Retrieve relay messages
      return await handleGetMessages(event, headers);
    } else if (event.httpMethod === "POST" && path === "/signaling") {
      // Handle WebRTC signaling
      return await handleSignaling(event, headers);
    } else if (event.httpMethod === "GET" && path === "/signaling") {
      // Get signaling messages
      return await handleGetSignaling(event, headers);
    } else if (event.httpMethod === "DELETE" && path.startsWith("/messages/")) {
      // Delete processed message
      return await handleDeleteMessage(event, headers);
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Endpoint not found" }),
    };
  } catch (error) {
    console.error("P2P Relay error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

async function handleStoreMessage(event, headers) {
  const { from, to, content, type, timestamp } = JSON.parse(event.body);

  if (!from || !to || !content) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing required fields" }),
    };
  }

  const message = {
    id: generateId(),
    from,
    to,
    content,
    type: type || "text",
    timestamp: timestamp || Date.now(),
    createdAt: new Date(),
    delivered: false,
  };

  try {
    // Try to use MongoDB if available
    if (process.env.MONGODB_URI) {
      const db = await connectToDatabase();
      await db.collection("relay_messages").insertOne(message);
    } else {
      // Fallback to in-memory storage
      relayMessages.push(message);

      // Clean up old messages (keep only last 1000)
      if (relayMessages.length > 1000) {
        relayMessages = relayMessages.slice(-1000);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        messageId: message.id,
        relayUsed: true,
      }),
    };
  } catch (error) {
    console.error("Store message error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to store message" }),
    };
  }
}

async function handleGetMessages(event, headers) {
  const { from, to } = event.queryStringParameters || {};

  if (!to) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing recipient parameter" }),
    };
  }

  try {
    let messages = [];

    if (process.env.MONGODB_URI) {
      const db = await connectToDatabase();
      const query = { to, delivered: false };
      if (from) query.from = from;

      messages = await db
        .collection("relay_messages")
        .find(query)
        .sort({ timestamp: 1 })
        .limit(100)
        .toArray();

      // Mark messages as delivered
      if (messages.length > 0) {
        const messageIds = messages.map((m) => m._id);
        await db
          .collection("relay_messages")
          .updateMany(
            { _id: { $in: messageIds } },
            { $set: { delivered: true, deliveredAt: new Date() } },
          );
      }
    } else {
      // Fallback to in-memory storage
      messages = relayMessages.filter((m) => {
        const matchesTo = m.to === to;
        const matchesFrom = !from || m.from === from;
        return matchesTo && matchesFrom && !m.delivered;
      });

      // Mark as delivered
      messages.forEach((m) => {
        m.delivered = true;
        m.deliveredAt = new Date();
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(
        messages.map((m) => ({
          id: m.id,
          from: m.from,
          to: m.to,
          content: m.content,
          type: m.type,
          timestamp: m.timestamp,
        })),
      ),
    };
  } catch (error) {
    console.error("Get messages error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to retrieve messages" }),
    };
  }
}

async function handleSignaling(event, headers) {
  const { from, to, message } = JSON.parse(event.body);

  if (!from || !to || !message) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing required signaling fields" }),
    };
  }

  const signalingData = {
    id: generateId(),
    from,
    to,
    message,
    timestamp: Date.now(),
    createdAt: new Date(),
    delivered: false,
  };

  try {
    if (process.env.MONGODB_URI) {
      const db = await connectToDatabase();
      await db.collection("signaling_messages").insertOne(signalingData);
    } else {
      signalingMessages.push(signalingData);

      // Clean up old signaling messages
      if (signalingMessages.length > 500) {
        signalingMessages = signalingMessages.slice(-500);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, messageId: signalingData.id }),
    };
  } catch (error) {
    console.error("Signaling error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to store signaling message" }),
    };
  }
}

async function handleGetSignaling(event, headers) {
  const { to } = event.queryStringParameters || {};

  if (!to) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing recipient parameter" }),
    };
  }

  try {
    let messages = [];

    if (process.env.MONGODB_URI) {
      const db = await connectToDatabase();
      messages = await db
        .collection("signaling_messages")
        .find({ to, delivered: false })
        .sort({ timestamp: 1 })
        .limit(50)
        .toArray();

      // Mark as delivered
      if (messages.length > 0) {
        const messageIds = messages.map((m) => m._id);
        await db
          .collection("signaling_messages")
          .updateMany(
            { _id: { $in: messageIds } },
            { $set: { delivered: true, deliveredAt: new Date() } },
          );
      }
    } else {
      messages = signalingMessages.filter((m) => m.to === to && !m.delivered);
      messages.forEach((m) => {
        m.delivered = true;
        m.deliveredAt = new Date();
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(
        messages.map((m) => ({
          id: m.id,
          from: m.from,
          message: m.message,
          timestamp: m.timestamp,
        })),
      ),
    };
  } catch (error) {
    console.error("Get signaling error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to retrieve signaling messages" }),
    };
  }
}

async function handleDeleteMessage(event, headers) {
  const messageId = event.path.split("/").pop();

  try {
    if (process.env.MONGODB_URI) {
      const db = await connectToDatabase();
      await db.collection("relay_messages").deleteOne({ id: messageId });
    } else {
      relayMessages = relayMessages.filter((m) => m.id !== messageId);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("Delete message error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to delete message" }),
    };
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
