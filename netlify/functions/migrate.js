import { neon } from "@netlify/neon";

export default async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const sql = neon();

    // Create users table
    await sql(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100),
        email VARCHAR(255),
        phone VARCHAR(20),
        password_hash VARCHAR(255) NOT NULL,
        bio TEXT,
        profile_picture TEXT,
        is_admin BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'offline',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_verified BOOLEAN DEFAULT FALSE,
        is_banned BOOLEAN DEFAULT FALSE,
        is_muted BOOLEAN DEFAULT FALSE,
        muted_until TIMESTAMP,
        ban_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create servers table
    await sql(`
      CREATE TABLE IF NOT EXISTS servers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon_url TEXT,
        owner_id INTEGER REFERENCES users(id),
        is_public BOOLEAN DEFAULT TRUE,
        member_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create channels table
    await sql(`
      CREATE TABLE IF NOT EXISTS channels (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        type VARCHAR(20) DEFAULT 'text',
        server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE,
        category_id INTEGER,
        position INTEGER DEFAULT 0,
        is_private BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create messages table
    await sql(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id),
        channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
        server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE,
        is_disappearing BOOLEAN DEFAULT FALSE,
        disappear_at TIMESTAMP,
        is_encrypted BOOLEAN DEFAULT FALSE,
        requires_mutual_consent BOOLEAN DEFAULT FALSE,
        is_dm BOOLEAN DEFAULT FALSE,
        recipient_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_roles table
    await sql(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        server_id INTEGER REFERENCES servers(id),
        role_name VARCHAR(50),
        permissions JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create audit_logs table
    await sql(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        target_id INTEGER,
        target_type VARCHAR(50),
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create admin_bot_commands table
    await sql(`
      CREATE TABLE IF NOT EXISTS admin_bot_commands (
        id SERIAL PRIMARY KEY,
        command VARCHAR(100) NOT NULL,
        user_id INTEGER REFERENCES users(id),
        response TEXT,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create default admin user if not exists
    const adminUser = await sql(
      "SELECT id FROM users WHERE username = 'admin'",
    );

    if (adminUser.length === 0) {
      await sql(`
        INSERT INTO users (username, display_name, password_hash, is_admin, status)
        VALUES ('admin', 'System Administrator', '$2b$12$rEeEhGLk8O4bW8VZ7/XJc.B6vXlGJ5E1nCrBh8oPVMKRmKrHdELSu', true, 'online')
      `);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Database migrated successfully",
      }),
    };
  } catch (error) {
    console.error("Migration error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Migration failed",
        details: error.message,
      }),
    };
  }
}
