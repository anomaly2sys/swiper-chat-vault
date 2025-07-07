// Production Escrow API for SwiperEmpire
exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const path = event.path.split("/").pop();
    const method = event.httpMethod;

    switch (method) {
      case "GET":
        if (path === "transactions") {
          return await getTransactions(event);
        } else if (path === "fees") {
          return await getFeeSettings();
        }
        break;

      case "POST":
        if (path === "create") {
          return await createEscrowTransaction(event);
        } else if (path === "message") {
          return await addMessage(event);
        }
        break;

      case "PUT":
        if (path === "status") {
          return await updateTransactionStatus(event);
        } else if (path === "fees") {
          return await updateFeeSettings(event);
        }
        break;

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: "Method not allowed" }),
        };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Endpoint not found" }),
    };
  } catch (error) {
    console.error("Escrow API error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error.message,
      }),
    };
  }
};

async function getDatabase() {
  // Initialize database connection
  const hasSupabase = process.env.NETLIFY_SUPABASE_URL;
  const hasNeon = process.env.NEON_DATABASE_URL;

  if (hasSupabase) {
    const { createClient } = require("@supabase/supabase-js");
    return {
      type: "supabase",
      client: createClient(
        process.env.NETLIFY_SUPABASE_URL,
        process.env.NETLIFY_SUPABASE_ANON_KEY,
      ),
    };
  } else if (hasNeon) {
    const { Client } = require("pg");
    const client = new Client({
      connectionString: process.env.NEON_DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();
    return { type: "neon", client };
  }

  throw new Error("No database configuration available");
}

async function getTransactions(event) {
  const db = await getDatabase();
  const userId = event.queryStringParameters?.userId;

  try {
    let transactions;

    if (db.type === "supabase") {
      let query = db.client.from("escrow_transactions").select(`
        *,
        escrow_messages(*)
      `);

      if (userId) {
        query = query.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      transactions = data;
    } else if (db.type === "neon") {
      let sql = `
        SELECT t.*, 
               json_agg(m.*) FILTER (WHERE m.id IS NOT NULL) as messages
        FROM escrow_transactions t
        LEFT JOIN escrow_messages m ON t.id = m.transaction_id
      `;

      if (userId) {
        sql += ` WHERE t.buyer_id = $1 OR t.seller_id = $1`;
      }

      sql += ` GROUP BY t.id ORDER BY t.created_at DESC`;

      const result = await db.client.query(sql, userId ? [userId] : []);
      transactions = result.rows;
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        transactions: transactions || [],
      }),
    };
  } finally {
    if (db.type === "neon") {
      await db.client.end();
    }
  }
}

async function createEscrowTransaction(event) {
  const db = await getDatabase();
  const data = JSON.parse(event.body);

  try {
    // Generate Bitcoin addresses (in production, use real address generation)
    const generateAddress = () => {
      const chars =
        "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
      let result = "1";
      for (let i = 0; i < 33; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const transaction = {
      id: `escrow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      product_id: data.productId || `product-${Date.now()}`,
      product_name: data.productName,
      buyer_id: data.buyerId,
      buyer_username: data.buyerUsername,
      seller_id: data.sellerId,
      seller_username: data.sellerUsername,
      amount: data.amount,
      fee: data.fee,
      empire_elite_fee: data.empireEliteFee || 0,
      buyer_address: generateAddress(),
      seller_address: generateAddress(),
      escrow_address: generateAddress(),
      status: "pending",
    };

    let result;

    if (db.type === "supabase") {
      const { data: insertedData, error } = await db.client
        .from("escrow_transactions")
        .insert([transaction])
        .select();

      if (error) throw error;
      result = insertedData[0];

      // Add system message
      await db.client.from("escrow_messages").insert([
        {
          id: `msg-${Date.now()}`,
          transaction_id: transaction.id,
          user_id: 0,
          username: "Escrow System",
          content: `Escrow transaction created for ${transaction.product_name}. Buyer must fund escrow address to proceed.`,
          is_system: true,
        },
      ]);
    } else if (db.type === "neon") {
      const sql = `
        INSERT INTO escrow_transactions (
          id, product_id, product_name, buyer_id, buyer_username,
          seller_id, seller_username, amount, fee, empire_elite_fee,
          buyer_address, seller_address, escrow_address, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *;
      `;

      const values = [
        transaction.id,
        transaction.product_id,
        transaction.product_name,
        transaction.buyer_id,
        transaction.buyer_username,
        transaction.seller_id,
        transaction.seller_username,
        transaction.amount,
        transaction.fee,
        transaction.empire_elite_fee,
        transaction.buyer_address,
        transaction.seller_address,
        transaction.escrow_address,
        transaction.status,
      ];

      const insertResult = await db.client.query(sql, values);
      result = insertResult.rows[0];

      // Add system message
      await db.client.query(
        `
        INSERT INTO escrow_messages (id, transaction_id, user_id, username, content, is_system)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [
          `msg-${Date.now()}`,
          transaction.id,
          0,
          "Escrow System",
          `Escrow transaction created for ${transaction.product_name}. Buyer must fund escrow address to proceed.`,
          true,
        ],
      );
    }

    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        transaction: result,
      }),
    };
  } finally {
    if (db.type === "neon") {
      await db.client.end();
    }
  }
}

async function updateTransactionStatus(event) {
  const db = await getDatabase();
  const { transactionId, status } = JSON.parse(event.body);

  try {
    let result;

    if (db.type === "supabase") {
      const updates = { status, updated_at: new Date().toISOString() };

      if (status === "funded") {
        updates.funded_at = new Date().toISOString();
      } else if (status === "completed") {
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await db.client
        .from("escrow_transactions")
        .update(updates)
        .eq("id", transactionId)
        .select();

      if (error) throw error;
      result = data[0];
    } else if (db.type === "neon") {
      let sql = `UPDATE escrow_transactions SET status = $1, updated_at = CURRENT_TIMESTAMP`;
      let values = [status, transactionId];

      if (status === "funded") {
        sql += `, funded_at = CURRENT_TIMESTAMP`;
      } else if (status === "completed") {
        sql += `, completed_at = CURRENT_TIMESTAMP`;
      }

      sql += ` WHERE id = $2 RETURNING *`;

      const updateResult = await db.client.query(sql, values);
      result = updateResult.rows[0];
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        transaction: result,
      }),
    };
  } finally {
    if (db.type === "neon") {
      await db.client.end();
    }
  }
}

async function getFeeSettings() {
  const db = await getDatabase();

  try {
    let settings;

    if (db.type === "supabase") {
      const { data, error } = await db.client
        .from("fee_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1);

      if (error) throw error;
      settings = data[0];
    } else if (db.type === "neon") {
      const result = await db.client.query(`
        SELECT * FROM fee_settings ORDER BY updated_at DESC LIMIT 1
      `);
      settings = result.rows[0];
    }

    // Default settings if none exist
    if (!settings) {
      settings = {
        empire_elite_fee: 0.0,
        verified_vendor_fee: 3.0,
        regular_vendor_fee: 7.0,
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        settings,
      }),
    };
  } finally {
    if (db.type === "neon") {
      await db.client.end();
    }
  }
}

async function updateFeeSettings(event) {
  const db = await getDatabase();
  const { fees, userId } = JSON.parse(event.body);

  try {
    let result;

    if (db.type === "supabase") {
      const { data, error } = await db.client
        .from("fee_settings")
        .insert([
          {
            empire_elite_fee: fees.empireElite,
            verified_vendor_fee: fees.verifiedVendor,
            regular_vendor_fee: fees.regularVendor,
            updated_by: userId,
          },
        ])
        .select();

      if (error) throw error;
      result = data[0];
    } else if (db.type === "neon") {
      const insertResult = await db.client.query(
        `
        INSERT INTO fee_settings (empire_elite_fee, verified_vendor_fee, regular_vendor_fee, updated_by)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
        [fees.empireElite, fees.verifiedVendor, fees.regularVendor, userId],
      );

      result = insertResult.rows[0];
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        settings: result,
      }),
    };
  } finally {
    if (db.type === "neon") {
      await db.client.end();
    }
  }
}

async function addMessage(event) {
  const db = await getDatabase();
  const { transactionId, userId, username, content } = JSON.parse(event.body);

  try {
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      transaction_id: transactionId,
      user_id: userId,
      username,
      content,
      is_system: false,
    };

    let result;

    if (db.type === "supabase") {
      const { data, error } = await db.client
        .from("escrow_messages")
        .insert([message])
        .select();

      if (error) throw error;
      result = data[0];
    } else if (db.type === "neon") {
      const insertResult = await db.client.query(
        `
        INSERT INTO escrow_messages (id, transaction_id, user_id, username, content, is_system)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
        [
          message.id,
          message.transaction_id,
          message.user_id,
          message.username,
          message.content,
          message.is_system,
        ],
      );

      result = insertResult.rows[0];
    }

    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        message: result,
      }),
    };
  } finally {
    if (db.type === "neon") {
      await db.client.end();
    }
  }
}
