// Production Database Service for Netlify with Supabase/Neon
// This will be used when NETLIFY_SUPABASE_URL or NEON_DATABASE_URL is available

interface DatabaseConfig {
  type: "supabase" | "neon" | "local";
  url?: string;
  key?: string;
}

class ProductionDatabaseService {
  private config: DatabaseConfig;

  constructor() {
    // Auto-detect available database service
    if (process.env.NETLIFY_SUPABASE_URL) {
      this.config = {
        type: "supabase",
        url: process.env.NETLIFY_SUPABASE_URL,
        key: process.env.NETLIFY_SUPABASE_ANON_KEY,
      };
    } else if (process.env.NEON_DATABASE_URL) {
      this.config = {
        type: "neon",
        url: process.env.NEON_DATABASE_URL,
      };
    } else {
      this.config = { type: "local" };
    }
  }

  async initializeDatabase() {
    if (this.config.type === "local") {
      console.log("Using local storage for development");
      return;
    }

    try {
      await this.createTables();
      console.log(
        `✅ Production database initialized with ${this.config.type}`,
      );
    } catch (error) {
      console.error("Failed to initialize production database:", error);
      throw error;
    }
  }

  private async createTables() {
    const tables = {
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
          amount BIGINT NOT NULL, -- in satoshis
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

    // Execute table creation
    for (const [tableName, sql] of Object.entries(tables)) {
      try {
        await this.executeQuery(sql);
        console.log(`✅ Table ${tableName} created/verified`);
      } catch (error) {
        console.error(`❌ Failed to create table ${tableName}:`, error);
        throw error;
      }
    }

    // Insert default fee settings
    await this.executeQuery(`
      INSERT INTO fee_settings (empire_elite_fee, verified_vendor_fee, regular_vendor_fee)
      VALUES (0.00, 3.00, 7.00)
      ON CONFLICT DO NOTHING;
    `);
  }

  private async executeQuery(sql: string, params: any[] = []) {
    if (this.config.type === "supabase") {
      // Supabase implementation
      const response = await fetch(
        `${this.config.url}/rest/v1/rpc/execute_sql`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: this.config.key || "",
            Authorization: `Bearer ${this.config.key}`,
          },
          body: JSON.stringify({ sql, params }),
        },
      );

      if (!response.ok) {
        throw new Error(`Supabase query failed: ${response.statusText}`);
      }

      return response.json();
    } else if (this.config.type === "neon") {
      // Neon implementation with pg
      const { Client } = await import("pg");
      const client = new Client({ connectionString: this.config.url });

      try {
        await client.connect();
        const result = await client.query(sql, params);
        return result;
      } finally {
        await client.end();
      }
    }

    throw new Error("No database configuration available");
  }

  // User operations
  async createUser(userData: any) {
    const sql = `
      INSERT INTO users (username, display_name, email, phone, bio, is_admin)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    return this.executeQuery(sql, [
      userData.username,
      userData.displayName,
      userData.email,
      userData.phone,
      userData.bio,
      userData.isAdmin || false,
    ]);
  }

  async getUserByUsername(username: string) {
    const sql = `SELECT * FROM users WHERE username = $1;`;
    return this.executeQuery(sql, [username]);
  }

  // Escrow operations
  async createEscrowTransaction(transaction: any) {
    const sql = `
      INSERT INTO escrow_transactions (
        id, product_id, product_name, buyer_id, buyer_username,
        seller_id, seller_username, amount, fee, empire_elite_fee,
        buyer_address, seller_address, escrow_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;

    return this.executeQuery(sql, [
      transaction.id,
      transaction.productId,
      transaction.productName,
      transaction.buyerId,
      transaction.buyerUsername,
      transaction.sellerId,
      transaction.sellerUsername,
      transaction.amount,
      transaction.fee,
      transaction.empireEliteFee,
      transaction.buyerAddress,
      transaction.sellerAddress,
      transaction.escrowAddress,
    ]);
  }

  async updateEscrowStatus(transactionId: string, status: string) {
    const sql = `
      UPDATE escrow_transactions 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `;

    return this.executeQuery(sql, [status, transactionId]);
  }

  // Fee settings operations
  async getFeeSettings() {
    const sql = `SELECT * FROM fee_settings ORDER BY updated_at DESC LIMIT 1;`;
    return this.executeQuery(sql);
  }

  async updateFeeSettings(fees: any, userId: number) {
    const sql = `
      INSERT INTO fee_settings (empire_elite_fee, verified_vendor_fee, regular_vendor_fee, updated_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    return this.executeQuery(sql, [
      fees.empireElite,
      fees.verifiedVendor,
      fees.regularVendor,
      userId,
    ]);
  }

  // Audit logging
  async logAction(userId: number, action: string, details: any = {}) {
    const sql = `
      INSERT INTO audit_logs (user_id, action, details)
      VALUES ($1, $2, $3);
    `;

    return this.executeQuery(sql, [userId, action, JSON.stringify(details)]);
  }
}

export const productionDatabaseService = new ProductionDatabaseService();
export default productionDatabaseService;
