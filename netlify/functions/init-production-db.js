// Netlify Function to initialize production database
const { Handler } = require("@netlify/functions");

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    // Check for database environment variables
    const hasSupabase =
      process.env.NETLIFY_SUPABASE_URL && process.env.NETLIFY_SUPABASE_ANON_KEY;
    const hasNeon = process.env.NEON_DATABASE_URL;

    if (!hasSupabase && !hasNeon) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error:
            "No database configuration found. Please configure Supabase or Neon in Netlify environment variables.",
        }),
      };
    }

    // Initialize database based on available service
    let dbType = "unknown";
    let initResult = null;

    if (hasSupabase) {
      dbType = "supabase";
      initResult = await initializeSupabase();
    } else if (hasNeon) {
      dbType = "neon";
      initResult = await initializeNeon();
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `SwiperEmpire production database initialized successfully with ${dbType}`,
        database: dbType,
        timestamp: new Date().toISOString(),
        result: initResult,
      }),
    };
  } catch (error) {
    console.error("Database initialization error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Failed to initialize database",
        details: error.message,
      }),
    };
  }
};

async function initializeSupabase() {
  const { createClient } = require("@supabase/supabase-js");

  const supabase = createClient(
    process.env.NETLIFY_SUPABASE_URL,
    process.env.NETLIFY_SUPABASE_ANON_KEY,
  );

  // Create tables using Supabase SQL
  const tables = await createTables(supabase);

  return {
    tablesCreated: tables.length,
    url: process.env.NETLIFY_SUPABASE_URL,
  };
}

async function initializeNeon() {
  const { Client } = require("pg");

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const tables = await createTablesWithPG(client);

    return {
      tablesCreated: tables.length,
      connected: true,
    };
  } finally {
    await client.end();
  }
}

async function createTables(supabase) {
  const tableSQLs = getTableDefinitions();
  const results = [];

  for (const [tableName, sql] of Object.entries(tableSQLs)) {
    try {
      const { error } = await supabase.rpc("exec_sql", { sql });
      if (error) throw error;
      results.push(tableName);
      console.log(`✅ Table ${tableName} created/verified`);
    } catch (error) {
      console.error(`❌ Failed to create table ${tableName}:`, error);
      throw error;
    }
  }

  return results;
}

async function createTablesWithPG(client) {
  const tableSQLs = getTableDefinitions();
  const results = [];

  for (const [tableName, sql] of Object.entries(tableSQLs)) {
    try {
      await client.query(sql);
      results.push(tableName);
      console.log(`✅ Table ${tableName} created/verified`);
    } catch (error) {
      console.error(`❌ Failed to create table ${tableName}:`, error);
      throw error;
    }
  }

  return results;
}

function getTableDefinitions() {
  return {
    users: `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        bio TEXT,
        profile_picture TEXT,
        is_admin BOOLEAN DEFAULT FALSE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'offline',
        is_verified BOOLEAN DEFAULT FALSE,
        is_banned BOOLEAN DEFAULT FALSE,
        is_muted BOOLEAN DEFAULT FALSE,
        muted_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,

    servers: `
      CREATE TABLE IF NOT EXISTS servers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        owner_id INTEGER REFERENCES users(id),
        icon TEXT,
        invite_code VARCHAR(20) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,

    channels: `
      CREATE TABLE IF NOT EXISTS channels (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'voice', 'announcements', 'shop')),
        server_id VARCHAR(50) REFERENCES servers(id) ON DELETE CASCADE,
        category_id VARCHAR(50),
        position INTEGER DEFAULT 0,
        is_private BOOLEAN DEFAULT FALSE,
        description TEXT,
        topic TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,

    messages: `
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(50) PRIMARY KEY,
        content TEXT NOT NULL,
        author_id INTEGER REFERENCES users(id),
        channel_id VARCHAR(50) REFERENCES channels(id) ON DELETE CASCADE,
        server_id VARCHAR(50) REFERENCES servers(id) ON DELETE CASCADE,
        is_disappearing BOOLEAN DEFAULT FALSE,
        disappear_at TIMESTAMP,
        requires_mutual_consent BOOLEAN DEFAULT FALSE,
        is_encrypted BOOLEAN DEFAULT TRUE,
        status VARCHAR(20) DEFAULT 'sent',
        edited_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,

    user_roles: `
      CREATE TABLE IF NOT EXISTS user_roles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        server_id VARCHAR(50) REFERENCES servers(id) ON DELETE CASCADE,
        roles JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, server_id)
      );
    `,

    escrow_transactions: `
      CREATE TABLE IF NOT EXISTS escrow_transactions (
        id VARCHAR(50) PRIMARY KEY,
        product_id VARCHAR(50),
        product_name VARCHAR(255) NOT NULL,
        buyer_id INTEGER REFERENCES users(id),
        buyer_username VARCHAR(50),
        seller_id INTEGER REFERENCES users(id),
        seller_username VARCHAR(50),
        amount BIGINT NOT NULL,
        fee BIGINT NOT NULL,
        empire_elite_fee BIGINT DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'funded', 'completed', 'disputed', 'cancelled')),
        buyer_address VARCHAR(100),
        seller_address VARCHAR(100),
        escrow_address VARCHAR(100),
        funded_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,

    escrow_messages: `
      CREATE TABLE IF NOT EXISTS escrow_messages (
        id VARCHAR(50) PRIMARY KEY,
        transaction_id VARCHAR(50) REFERENCES escrow_transactions(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        username VARCHAR(50),
        content TEXT NOT NULL,
        is_system BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,

    support_tickets: `
      CREATE TABLE IF NOT EXISTS support_tickets (
        id VARCHAR(50) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        username VARCHAR(50),
        title VARCHAR(255) NOT NULL,
        category VARCHAR(50),
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_response', 'resolved', 'closed')),
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,

    fee_settings: `
      CREATE TABLE IF NOT EXISTS fee_settings (
        id SERIAL PRIMARY KEY,
        empire_elite_fee DECIMAL(5,2) DEFAULT 0.00,
        verified_vendor_fee DECIMAL(5,2) DEFAULT 3.00,
        regular_vendor_fee DECIMAL(5,2) DEFAULT 7.00,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER REFERENCES users(id)
      );
    `,

    audit_logs: `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50),
        target_id VARCHAR(50),
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,
  };
}
