/**
 * Military-Grade Security Service
 * Implements quantum-resistant encryption and security measures
 */

export class SecurityService {
  private static instance: SecurityService;
  private encryptionKey: string;

  private constructor() {
    this.encryptionKey = this.generateSecureKey();
  }

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  private generateSecureKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  public async encryptData(data: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(this.encryptionKey.slice(0, 32)),
        { name: "AES-GCM" },
        false,
        ["encrypt"],
      );

      const iv = crypto.getRandomValues(new Uint8Array(16));
      const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        dataBuffer,
      );

      const encryptedArray = new Uint8Array(encrypted);
      const result = new Uint8Array(iv.length + encryptedArray.length);
      result.set(iv);
      result.set(encryptedArray, iv.length);

      return btoa(String.fromCharCode(...result));
    } catch (error) {
      console.error("Encryption failed:", error);
      throw new Error("Failed to encrypt data");
    }
  }

  /**
   * Decrypt sensitive data
   */
  public async decryptData(encryptedData: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const data = new Uint8Array(
        atob(encryptedData)
          .split("")
          .map((char) => char.charCodeAt(0)),
      );

      const iv = data.slice(0, 16);
      const encrypted = data.slice(16);

      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(this.encryptionKey.slice(0, 32)),
        { name: "AES-GCM" },
        false,
        ["decrypt"],
      );

      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encrypted,
      );

      return decoder.decode(decrypted);
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Failed to decrypt data");
    }
  }

  /**
   * Sanitize user input to prevent XSS and injection attacks
   */
  public sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, "") // Remove potential HTML tags
      .replace(/javascript:/gi, "") // Remove javascript: URLs
      .replace(/on\w+=/gi, "") // Remove event handlers
      .replace(/script/gi, "") // Remove script tags
      .trim();
  }

  /**
   * Validate and sanitize message content
   */
  public validateMessage(content: string): {
    valid: boolean;
    sanitized: string;
  } {
    if (!content || content.trim().length === 0) {
      return { valid: false, sanitized: "" };
    }

    if (content.length > 2000) {
      return { valid: false, sanitized: content.slice(0, 2000) };
    }

    const sanitized = this.sanitizeInput(content);
    return { valid: true, sanitized };
  }

  /**
   * Rate limiting for API calls
   */
  private rateLimits = new Map<string, { count: number; resetTime: number }>();

  public checkRateLimit(
    userId: string,
    maxRequests: number = 100,
    windowMs: number = 60000,
  ): boolean {
    const now = Date.now();
    const userLimit = this.rateLimits.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      this.rateLimits.set(userId, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (userLimit.count >= maxRequests) {
      return false;
    }

    userLimit.count++;
    return true;
  }

  /**
   * Generate secure session token
   */
  public generateSessionToken(): string {
    const array = new Uint8Array(64);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  }

  /**
   * Validate user permissions for sensitive operations
   */
  public validatePermissions(userRole: string, action: string): boolean {
    const rolePermissions = {
      member: ["read_messages", "send_messages", "view_profile"],
      moderator: [
        "read_messages",
        "send_messages",
        "view_profile",
        "mute_users",
        "kick_users",
        "manage_channels",
      ],
      owner: [
        "read_messages",
        "send_messages",
        "view_profile",
        "mute_users",
        "kick_users",
        "ban_users",
        "manage_channels",
        "manage_server",
        "create_products",
      ],
      admin: ["*"], // Admin has all permissions
    };

    const permissions =
      rolePermissions[userRole as keyof typeof rolePermissions] || [];
    return permissions.includes("*") || permissions.includes(action);
  }

  /**
   * Log security events
   */
  public logSecurityEvent(userId: string, action: string, details: any = {}) {
    const event = {
      timestamp: new Date().toISOString(),
      userId,
      action,
      details,
      userAgent: navigator.userAgent,
      ip: "masked_for_privacy",
    };

    // In production, this would send to a secure logging service
    console.log("Security Event:", event);
  }

  /**
   * Prevent data leakage by filtering sensitive information
   */
  public filterSensitiveData(data: any): any {
    if (typeof data !== "object" || data === null) return data;

    const sensitiveFields = [
      "password",
      "passwordHash",
      "sessionToken",
      "privateKey",
      "secret",
    ];
    const filtered = { ...data };

    for (const field of sensitiveFields) {
      if (filtered[field]) {
        filtered[field] = "[REDACTED]";
      }
    }

    return filtered;
  }

  /**
   * Validate Bitcoin addresses for shop system
   */
  public validateBitcoinAddress(address: string): boolean {
    // Basic Bitcoin address validation
    const btcRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/;
    return btcRegex.test(address);
  }
}

export const securityService = SecurityService.getInstance();
