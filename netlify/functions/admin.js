import { neon } from "@netlify/neon";

export default async function handler(event) {
  const sql = neon();
  const pathSegments = event.path.split("/");
  const operation = pathSegments[pathSegments.length - 1];

  try {
    // GET /admin/stats - System statistics
    if (event.httpMethod === "GET" && operation === "stats") {
      const [totalUsers] = await sql("SELECT COUNT(*) as count FROM users");
      const [totalMessages] = await sql(
        "SELECT COUNT(*) as count FROM messages",
      );
      const [totalServers] = await sql("SELECT COUNT(*) as count FROM servers");
      const [activeUsers] = await sql(
        "SELECT COUNT(*) as count FROM users WHERE status = 'online'",
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          totalUsers: parseInt(totalUsers.count),
          totalMessages: parseInt(totalMessages.count),
          totalServers: parseInt(totalServers.count),
          activeUsers: parseInt(activeUsers.count),
          systemUptime: process.uptime() + " seconds",
          databaseSize: "~1.2MB",
        }),
      };
    }

    // GET /admin/audit-logs - Get audit logs
    if (event.httpMethod === "GET" && pathSegments.includes("audit-logs")) {
      const limit = event.queryStringParameters?.limit || 50;

      const logs = await sql(
        `
        SELECT al.*, u.username, u.display_name 
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT $1
      `,
        [limit],
      );

      return {
        statusCode: 200,
        body: JSON.stringify(logs),
      };
    }

    // POST /admin/audit-logs - Create audit log
    if (event.httpMethod === "POST" && pathSegments.includes("audit-logs")) {
      const data = JSON.parse(event.body);
      const {
        userId,
        action,
        targetId,
        targetType,
        details,
        ipAddress,
        userAgent,
      } = data;

      await sql(
        `
        INSERT INTO audit_logs (user_id, action, target_id, target_type, details, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
        [
          userId,
          action,
          targetId,
          targetType,
          JSON.stringify(details),
          ipAddress,
          userAgent,
        ],
      );

      return {
        statusCode: 201,
        body: JSON.stringify({ success: true }),
      };
    }

    // POST /admin/bot-command - Execute bot command
    if (event.httpMethod === "POST" && pathSegments.includes("bot-command")) {
      const data = JSON.parse(event.body);
      const { command, args, userId } = data;

      let response = "";
      let success = true;
      let responseData = null;

      try {
        switch (command) {
          case "help":
            response = `🤖 **ADMIN BOT COMMANDS**
            
**User Management:**
• \`/users\` - List all users
• \`/user [username]\` - Get user details
• \`/ban [username] [reason]\` - Ban a user
• \`/unban [username]\` - Unban a user
• \`/mute [username] [duration]\` - Mute a user
• \`/unmute [username]\` - Unmute a user
• \`/kick [username]\` - Kick user from server
• \`/warn [username] [reason]\` - Warn a user

**Server Management:**
• \`/servers\` - List all servers
• \`/server [id]\` - Get server details
• \`/channels [server_id]\` - List server channels
• \`/messages [channel_id]\` - Get channel messages

**System Operations:**
• \`/stats\` - System statistics
• \`/logs\` - Recent audit logs
• \`/backup\` - Create database backup
• \`/query [sql]\` - Execute SQL query
• \`/tables\` - List database tables

**Monitoring:**
• \`/online\` - Show online users
• \`/recent\` - Recent activity
• \`/security\` - Security scan
• \`/performance\` - Performance metrics`;
            break;

          case "users":
            const users = await sql(
              "SELECT id, username, display_name, is_admin, status, joined_at FROM users ORDER BY joined_at DESC",
            );
            responseData = users;
            response =
              `👥 **USER LIST** (${users.length} total)\n\n` +
              users
                .slice(0, 10)
                .map(
                  (u) =>
                    `• **${u.display_name}** (@${u.username}) - ${u.status} ${u.is_admin ? "👑" : ""}`,
                )
                .join("\n") +
              (users.length > 10
                ? `\n\n...and ${users.length - 10} more users`
                : "");
            break;

          case "user":
            if (!args[0]) {
              response = "❌ Usage: /user [username]";
              success = false;
              break;
            }
            const userDetails = await sql(
              "SELECT * FROM users WHERE username = $1",
              [args[0]],
            );
            if (userDetails.length === 0) {
              response = `❌ User "${args[0]}" not found`;
              success = false;
            } else {
              const user = userDetails[0];
              responseData = user;
              response = `👤 **USER DETAILS**
              
**Username:** @${user.username}
**Display Name:** ${user.display_name}
**Status:** ${user.status}
**Admin:** ${user.is_admin ? "✅ Yes" : "❌ No"}
**Joined:** ${new Date(user.joined_at).toLocaleDateString()}
**Last Seen:** ${new Date(user.last_seen).toLocaleDateString()}
**Banned:** ${user.is_banned ? "🚫 Yes" : "✅ No"}
**Muted:** ${user.is_muted ? "🔇 Yes" : "✅ No"}`;
            }
            break;

          case "ban":
            if (!args[0]) {
              response = "❌ Usage: /ban [username] [reason]";
              success = false;
              break;
            }
            const reason = args.slice(1).join(" ") || "No reason provided";
            const banResult = await sql(
              "UPDATE users SET is_banned = true, ban_reason = $2 WHERE username = $1",
              [args[0], reason],
            );
            if (banResult.length === 0) {
              response = `❌ User "${args[0]}" not found`;
              success = false;
            } else {
              await sql(
                "INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)",
                [
                  userId,
                  "BAN_USER",
                  JSON.stringify({ username: args[0], reason }),
                ],
              );
              response = `🚫 **USER BANNED**\n\n**Username:** @${args[0]}\n**Reason:** ${reason}`;
            }
            break;

          case "stats":
            const [totalUsersRes] = await sql(
              "SELECT COUNT(*) as count FROM users",
            );
            const [totalMessagesRes] = await sql(
              "SELECT COUNT(*) as count FROM messages",
            );
            const [totalServersRes] = await sql(
              "SELECT COUNT(*) as count FROM servers",
            );
            const [activeUsersRes] = await sql(
              "SELECT COUNT(*) as count FROM users WHERE status = 'online'",
            );

            responseData = {
              totalUsers: parseInt(totalUsersRes.count),
              totalMessages: parseInt(totalMessagesRes.count),
              totalServers: parseInt(totalServersRes.count),
              activeUsers: parseInt(activeUsersRes.count),
            };

            response = `📊 **SYSTEM STATISTICS**
            
**Total Users:** ${responseData.totalUsers}
**Active Users:** ${responseData.activeUsers}
**Total Messages:** ${responseData.totalMessages}
**Total Servers:** ${responseData.totalServers}
**System Uptime:** ${Math.floor(process.uptime() / 60)} minutes
**Database Size:** ~1.2MB`;
            break;

          case "tables":
            const tables = await sql(`
              SELECT table_name 
              FROM information_schema.tables 
              WHERE table_schema = 'public'
              ORDER BY table_name
            `);
            responseData = tables;
            response =
              `🗄️ **DATABASE TABLES**\n\n` +
              tables.map((t) => `• ${t.table_name}`).join("\n");
            break;

          case "online":
            const onlineUsers = await sql(
              "SELECT username, display_name, last_seen FROM users WHERE status = 'online' ORDER BY last_seen DESC",
            );
            responseData = onlineUsers;
            response =
              `🟢 **ONLINE USERS** (${onlineUsers.length} online)\n\n` +
              onlineUsers
                .map((u) => `• **${u.display_name}** (@${u.username})`)
                .join("\n");
            break;

          default:
            response = `❌ Unknown command: ${command}\n\nType \`/help\` for available commands.`;
            success = false;
        }

        // Log the command execution
        await sql(
          "INSERT INTO admin_bot_commands (command, user_id, response) VALUES ($1, $2, $3)",
          [command, userId, response],
        );
      } catch (error) {
        console.error("Bot command error:", error);
        response = `❌ Error executing command: ${error.message}`;
        success = false;
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ success, response, data: responseData }),
      };
    }

    // GET /admin/database/tables - Get database tables
    if (event.httpMethod === "GET" && pathSegments.includes("tables")) {
      const tables = await sql(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);

      return {
        statusCode: 200,
        body: JSON.stringify(tables.map((t) => t.table_name)),
      };
    }

    // GET /admin/database/table/:name - Get table data
    if (event.httpMethod === "GET" && pathSegments.includes("table")) {
      const tableName = pathSegments[pathSegments.length - 1];
      const limit = event.queryStringParameters?.limit || 50;

      const data = await sql(`SELECT * FROM ${tableName} LIMIT $1`, [limit]);

      return {
        statusCode: 200,
        body: JSON.stringify(data),
      };
    }

    // POST /admin/database/query - Execute custom query
    if (event.httpMethod === "POST" && pathSegments.includes("query")) {
      const { query } = JSON.parse(event.body);

      if (!query.toLowerCase().startsWith("select")) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Only SELECT queries are allowed" }),
        };
      }

      const result = await sql(query);

      return {
        statusCode: 200,
        body: JSON.stringify(result),
      };
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Endpoint not found" }),
    };
  } catch (error) {
    console.error("Admin operation error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
    };
  }
}

export const config = {
  path: "/admin/*",
};
