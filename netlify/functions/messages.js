import { neon } from "@netlify/neon";

export default async function handler(event) {
  const sql = neon();

  try {
    if (event.httpMethod === "GET") {
      const { channelId, serverId, isDm, userId } =
        event.queryStringParameters || {};

      let query =
        "SELECT m.*, u.username, u.display_name FROM messages m LEFT JOIN users u ON m.user_id = u.id";
      const params = [];
      const conditions = [];

      if (channelId) {
        conditions.push("m.channel_id = $" + (params.length + 1));
        params.push(channelId);
      }

      if (serverId) {
        conditions.push("m.server_id = $" + (params.length + 1));
        params.push(serverId);
      }

      if (isDm === "true") {
        conditions.push("m.is_dm = true");
        if (userId) {
          conditions.push(
            "(m.user_id = $" +
              (params.length + 1) +
              " OR m.recipient_id = $" +
              (params.length + 2) +
              ")",
          );
          params.push(userId, userId);
        }
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY m.created_at DESC LIMIT 100";

      const messages = await sql(query, params);

      return {
        statusCode: 200,
        body: JSON.stringify(messages),
      };
    }

    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body);
      const {
        content,
        userId,
        channelId,
        serverId,
        recipientId,
        isDisappearing,
        isDm,
        requiresMutualConsent,
      } = data;

      const newMessage = await sql(
        `INSERT INTO messages (content, user_id, channel_id, server_id, recipient_id, is_disappearing, is_dm, requires_mutual_consent, disappear_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          content,
          userId,
          channelId,
          serverId,
          recipientId,
          isDisappearing,
          isDm,
          requiresMutualConsent,
          isDisappearing ? new Date(Date.now() + 35000) : null,
        ],
      );

      return {
        statusCode: 201,
        body: JSON.stringify(newMessage[0]),
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  } catch (error) {
    console.error("Messages API error:", error);
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
  path: "/messages",
};
