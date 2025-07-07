import { neon } from "@netlify/neon";
import bcrypt from "bcryptjs";

export default async function handler(event) {
  const sql = neon();

  try {
    // GET /users - Get all users
    if (event.httpMethod === "GET") {
      const pathSegments = event.path.split("/");
      const username = pathSegments[pathSegments.length - 1];

      if (username && username !== "users") {
        // Get specific user by username
        const users = await sql(
          "SELECT id, username, display_name, email, phone, bio, profile_picture, is_admin, status, joined_at, last_seen, is_verified, is_banned, is_muted, muted_until FROM users WHERE username = $1",
          [username],
        );

        if (users.length === 0) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: "User not found" }),
          };
        }

        return {
          statusCode: 200,
          body: JSON.stringify(users[0]),
        };
      } else {
        // Get all users
        const users = await sql(
          "SELECT id, username, display_name, email, phone, bio, profile_picture, is_admin, status, joined_at, last_seen, is_verified, is_banned, is_muted, muted_until FROM users ORDER BY joined_at DESC",
        );

        return {
          statusCode: 200,
          body: JSON.stringify(users),
        };
      }
    }

    // POST /users - Create user
    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body);
      const {
        username,
        displayName,
        email,
        phone,
        passwordHash,
        bio,
        profilePicture,
        isAdmin,
      } = data;

      // Check if user exists
      const existingUser = await sql(
        "SELECT id FROM users WHERE username = $1",
        [username],
      );

      if (existingUser.length > 0) {
        return {
          statusCode: 409,
          body: JSON.stringify({ error: "Username already exists" }),
        };
      }

      // Create user
      const newUser = await sql(
        `INSERT INTO users (username, display_name, email, phone, password_hash, bio, profile_picture, is_admin, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'online')
         RETURNING id, username, display_name, email, phone, bio, profile_picture, is_admin, status, joined_at, last_seen, is_verified, is_banned, is_muted`,
        [
          username,
          displayName,
          email,
          phone,
          passwordHash,
          bio,
          profilePicture,
          isAdmin || false,
        ],
      );

      return {
        statusCode: 201,
        body: JSON.stringify(newUser[0]),
      };
    }

    // PUT /users/:id - Update user
    if (event.httpMethod === "PUT") {
      const pathSegments = event.path.split("/");
      const userId = pathSegments[pathSegments.length - 1];
      const data = JSON.parse(event.body);

      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      Object.entries(data).forEach(([key, value]) => {
        if (key !== "id" && value !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "No valid fields to update" }),
        };
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(userId);

      const updatedUser = await sql(
        `UPDATE users SET ${updateFields.join(", ")} WHERE id = $${paramIndex}
         RETURNING id, username, display_name, email, phone, bio, profile_picture, is_admin, status, joined_at, last_seen, is_verified, is_banned, is_muted`,
        values,
      );

      if (updatedUser.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: "User not found" }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify(updatedUser[0]),
      };
    }

    // DELETE /users/:id - Delete user
    if (event.httpMethod === "DELETE") {
      const pathSegments = event.path.split("/");
      const userId = pathSegments[pathSegments.length - 1];

      await sql("DELETE FROM users WHERE id = $1", [userId]);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  } catch (error) {
    console.error("Database error:", error);
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
  path: "/users/*",
};
