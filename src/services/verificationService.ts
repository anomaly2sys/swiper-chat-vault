// Email and SMS verification service
// In production, this would use real SMTP server and Twilio

interface VerificationCode {
  code: string;
  type: "email" | "sms";
  recipient: string;
  expiresAt: Date;
  attempts: number;
  isUsed: boolean;
}

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class VerificationService {
  private codes: Map<string, VerificationCode> = new Map();
  private maxAttempts = 3;
  private codeExpiration = 10 * 60 * 1000; // 10 minutes

  // SMTP Configuration (use environment variables in production)
  private smtpConfig: SMTPConfig = {
    host: process.env.REACT_APP_SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.REACT_APP_SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.REACT_APP_SMTP_USER || "your-email@gmail.com",
      pass: process.env.REACT_APP_SMTP_PASS || "your-app-password",
    },
  };

  // Twilio Configuration
  private twilioConfig = {
    accountSid: process.env.REACT_APP_TWILIO_SID || "",
    authToken: process.env.REACT_APP_TWILIO_TOKEN || "",
    fromNumber: process.env.REACT_APP_TWILIO_FROM || "",
  };

  generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async sendEmailVerification(
    email: string,
    username: string,
  ): Promise<{ success: boolean; message: string; codeId?: string }> {
    try {
      const code = this.generateCode();
      const codeId = `email-${Date.now()}-${Math.random()}`;

      const verificationCode: VerificationCode = {
        code,
        type: "email",
        recipient: email,
        expiresAt: new Date(Date.now() + this.codeExpiration),
        attempts: 0,
        isUsed: false,
      };

      this.codes.set(codeId, verificationCode);

      // In production, this would use a real SMTP service like nodemailer
      const emailSent = await this.sendEmail(email, username, code);

      if (emailSent) {
        return {
          success: true,
          message: "Verification code sent to your email",
          codeId,
        };
      } else {
        return {
          success: false,
          message: "Failed to send verification email",
        };
      }
    } catch (error) {
      console.error("Email verification error:", error);
      return {
        success: false,
        message: "Email service temporarily unavailable",
      };
    }
  }

  async sendSMSVerification(
    phone: string,
    username: string,
  ): Promise<{ success: boolean; message: string; codeId?: string }> {
    try {
      const code = this.generateCode();
      const codeId = `sms-${Date.now()}-${Math.random()}`;

      const verificationCode: VerificationCode = {
        code,
        type: "sms",
        recipient: phone,
        expiresAt: new Date(Date.now() + this.codeExpiration),
        attempts: 0,
        isUsed: false,
      };

      this.codes.set(codeId, verificationCode);

      // In production, this would use Twilio
      const smsSent = await this.sendSMS(phone, username, code);

      if (smsSent) {
        return {
          success: true,
          message: "Verification code sent to your phone",
          codeId,
        };
      } else {
        return {
          success: false,
          message: "Failed to send verification SMS",
        };
      }
    } catch (error) {
      console.error("SMS verification error:", error);
      return {
        success: false,
        message: "SMS service temporarily unavailable",
      };
    }
  }

  async verifyCode(
    codeId: string,
    inputCode: string,
  ): Promise<{ success: boolean; message: string }> {
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

      return {
        success: false,
        message: `Invalid code. ${this.maxAttempts - verificationCode.attempts} attempts remaining.`,
      };
    }
  }

  private async sendEmail(
    email: string,
    username: string,
    code: string,
  ): Promise<boolean> {
    // Mock implementation - in production, use nodemailer
    console.log(`[EMAIL SERVICE] Sending to: ${email}`);
    console.log(`[EMAIL CONTENT]
To: ${email}
Subject: SwiperEmpire Verification Code

Dear ${username},

Your verification code for SwiperEmpire is: ${code}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
SwiperEmpire Team`);

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In production, you would use nodemailer:
    /*
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransporter({
      host: this.smtpConfig.host,
      port: this.smtpConfig.port,
      secure: this.smtpConfig.secure,
      auth: this.smtpConfig.auth
    });

    const mailOptions = {
      from: this.smtpConfig.auth.user,
      to: email,
      subject: 'SwiperEmpire Verification Code',
      html: this.getEmailTemplate(username, code)
    };

    const result = await transporter.sendMail(mailOptions);
    return !!result.messageId;
    */

    return true; // Mock success
  }

  private async sendSMS(
    phone: string,
    username: string,
    code: string,
  ): Promise<boolean> {
    // Mock implementation - in production, use Twilio
    console.log(`[SMS SERVICE] Sending to: ${phone}`);
    console.log(
      `[SMS CONTENT] SwiperEmpire: Your verification code is ${code}. Expires in 10 minutes.`,
    );

    // Simulate SMS sending delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // In production, you would use Twilio:
    /*
    const twilio = require('twilio');
    const client = twilio(this.twilioConfig.accountSid, this.twilioConfig.authToken);

    try {
      const message = await client.messages.create({
        body: `SwiperEmpire: Your verification code is ${code}. Expires in 10 minutes.`,
        from: this.twilioConfig.fromNumber,
        to: phone
      });
      return !!message.sid;
    } catch (error) {
      console.error('Twilio SMS error:', error);
      return false;
    }
    */

    return true; // Mock success
  }

  private getEmailTemplate(username: string, code: string): string {
    const safeUsername = username.replace(/[<>&"']/g, "");
    const safeCode = code.replace(/[<>&"']/g, "");

    return (
      "<!DOCTYPE html>" +
      "<html>" +
      "<head>" +
      "<style>" +
      "body { font-family: Arial, sans-serif; background-color: #0f0f23; color: #ffffff; }" +
      ".container { max-width: 600px; margin: 0 auto; padding: 20px; }" +
      ".header { text-align: center; margin-bottom: 30px; }" +
      ".logo { color: #8b5cf6; font-size: 24px; font-weight: bold; }" +
      ".code-box { background: linear-gradient(135deg, #8b5cf6, #ec4899); padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0; }" +
      ".code { font-size: 32px; font-weight: bold; letter-spacing: 5px; }" +
      ".footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px; }" +
      "</style>" +
      "</head>" +
      "<body>" +
      '<div class="container">' +
      '<div class="header">' +
      '<div class="logo">🏰 SwiperEmpire</div>' +
      "<h2>Email Verification</h2>" +
      "</div>" +
      "<p>Dear " +
      safeUsername +
      ",</p>" +
      "<p>Welcome to SwiperEmpire! Please use the verification code below to complete your registration:</p>" +
      '<div class="code-box">' +
      '<div class="code">' +
      safeCode +
      "</div>" +
      "</div>" +
      "<p><strong>Important:</strong></p>" +
      "<ul>" +
      "<li>This code expires in 10 minutes</li>" +
      "<li>You have 3 attempts to enter the correct code</li>" +
      "<li>If you did not request this, please ignore this email</li>" +
      "</ul>" +
      "<p>Thank you for joining our secure messaging platform!</p>" +
      '<div class="footer">' +
      "<p>SwiperEmpire - Secure • Private • Encrypted</p>" +
      "<p>This is an automated message. Please do not reply.</p>" +
      "</div>" +
      "</div>" +
      "</body>" +
      "</html>"
    );
  }

  // Clean up expired codes periodically
  cleanupExpiredCodes(): void {
    const now = new Date();
    for (const [codeId, code] of this.codes.entries()) {
      if (now > code.expiresAt) {
        this.codes.delete(codeId);
      }
    }
  }

  // Get verification stats (for admin)
  getVerificationStats(): any {
    let emailCount = 0;
    let smsCount = 0;
    let usedCount = 0;
    let expiredCount = 0;

    const now = new Date();

    for (const code of this.codes.values()) {
      if (code.type === "email") emailCount++;
      if (code.type === "sms") smsCount++;
      if (code.isUsed) usedCount++;
      if (now > code.expiresAt) expiredCount++;
    }

    return {
      totalCodes: this.codes.size,
      emailCodes: emailCount,
      smsCodes: smsCount,
      usedCodes: usedCount,
      expiredCodes: expiredCount,
      successRate:
        usedCount > 0
          ? ((usedCount / this.codes.size) * 100).toFixed(1) + "%"
          : "0%",
    };
  }
}

export const verificationService = new VerificationService();

// Cleanup expired codes every 5 minutes
setInterval(
  () => {
    verificationService.cleanupExpiredCodes();
  },
  5 * 60 * 1000,
);
