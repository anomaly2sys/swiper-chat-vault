// Simple verification service
interface VerificationCode {
  code: string;
  type: "email" | "sms";
  recipient: string;
  expiresAt: Date;
  attempts: number;
  isUsed: boolean;
}

class VerificationService {
  private codes = new Map();
  private maxAttempts = 3;
  private codeExpiration = 10 * 60 * 1000;

  generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async sendEmailVerification(email, username) {
    try {
      const code = this.generateCode();
      const codeId = "email-" + Date.now();

      const verificationCode = {
        code: code,
        type: "email",
        recipient: email,
        expiresAt: new Date(Date.now() + this.codeExpiration),
        attempts: 0,
        isUsed: false,
      };

      this.codes.set(codeId, verificationCode);

      console.log("Email verification code: " + code + " sent to " + email);

      return {
        success: true,
        message: "Verification code sent to your email",
        codeId: codeId,
      };
    } catch (error) {
      return {
        success: false,
        message: "Email service temporarily unavailable",
      };
    }
  }

  async sendSMSVerification(phone, username) {
    try {
      const code = this.generateCode();
      const codeId = "sms-" + Date.now();

      const verificationCode = {
        code: code,
        type: "sms",
        recipient: phone,
        expiresAt: new Date(Date.now() + this.codeExpiration),
        attempts: 0,
        isUsed: false,
      };

      this.codes.set(codeId, verificationCode);

      console.log("SMS verification code: " + code + " sent to " + phone);

      return {
        success: true,
        message: "Verification code sent to your phone",
        codeId: codeId,
      };
    } catch (error) {
      return {
        success: false,
        message: "SMS service temporarily unavailable",
      };
    }
  }

  async verifyCode(codeId, inputCode) {
    const verificationCode = this.codes.get(codeId);

    if (!verificationCode) {
      return {
        success: false,
        message: "Invalid or expired verification code",
      };
    }

    if (verificationCode.isUsed) {
      return {
        success: false,
        message: "Verification code already used",
      };
    }

    if (new Date() > verificationCode.expiresAt) {
      this.codes.delete(codeId);
      return {
        success: false,
        message: "Verification code expired",
      };
    }

    if (verificationCode.attempts >= this.maxAttempts) {
      this.codes.delete(codeId);
      return {
        success: false,
        message: "Too many verification attempts",
      };
    }

    verificationCode.attempts++;

    if (verificationCode.code === inputCode.toUpperCase()) {
      verificationCode.isUsed = true;
      return {
        success: true,
        message: "Verification successful",
      };
    } else {
      if (verificationCode.attempts >= this.maxAttempts) {
        this.codes.delete(codeId);
        return {
          success: false,
          message: "Too many failed attempts. Please request a new code.",
        };
      }

      const remaining = this.maxAttempts - verificationCode.attempts;
      return {
        success: false,
        message: "Invalid code. " + remaining + " attempts remaining.",
      };
    }
  }

  cleanupExpiredCodes() {
    const now = new Date();
    for (const [codeId, code] of this.codes.entries()) {
      if (now > code.expiresAt) {
        this.codes.delete(codeId);
      }
    }
  }

  getVerificationStats() {
    let emailCount = 0;
    let smsCount = 0;
    let usedCount = 0;

    for (const code of this.codes.values()) {
      if (code.type === "email") emailCount++;
      if (code.type === "sms") smsCount++;
      if (code.isUsed) usedCount++;
    }

    return {
      totalCodes: this.codes.size,
      emailCodes: emailCount,
      smsCodes: smsCount,
      usedCodes: usedCount,
      successRate:
        usedCount > 0
          ? ((usedCount / this.codes.size) * 100).toFixed(1) + "%"
          : "0%",
    };
  }
}

export const verificationService = new VerificationService();

setInterval(
  () => {
    verificationService.cleanupExpiredCodes();
  },
  5 * 60 * 1000,
);
