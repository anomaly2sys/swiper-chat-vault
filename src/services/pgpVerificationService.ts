// PGP Verification Service for SwiperEmpire
// Provides cryptographic identity verification and secure communication

import * as openpgp from "openpgp";

export interface PGPKeyPair {
  publicKey: string;
  privateKey: string;
  keyId: string;
  fingerprint: string;
}

export interface PGPVerificationResult {
  isValid: boolean;
  keyId: string;
  fingerprint: string;
  userInfo: {
    name: string;
    email: string;
  };
  error?: string;
}

class PGPVerificationService {
  /**
   * Generate a new PGP key pair for user registration
   */
  async generateKeyPair(
    name: string,
    email: string,
    passphrase: string,
  ): Promise<PGPKeyPair> {
    try {
      const { privateKey, publicKey } = await openpgp.generateKey({
        type: "ecc",
        curve: "curve25519",
        userIDs: [{ name, email }],
        passphrase,
        format: "armored",
      });

      const publicKeyObj = await openpgp.readKey({ armoredKey: publicKey });
      const keyId = publicKeyObj.getKeyIDs()[0].toHex();
      const fingerprint = publicKeyObj.getFingerprint();

      return {
        publicKey,
        privateKey,
        keyId,
        fingerprint,
      };
    } catch (error) {
      throw new Error(`Failed to generate PGP key pair: ${error.message}`);
    }
  }

  /**
   * Verify a PGP public key and extract user information
   */
  async verifyPublicKey(
    publicKeyArmored: string,
  ): Promise<PGPVerificationResult> {
    try {
      const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });

      const primaryUser = await publicKey.getPrimaryUser();
      const keyId = publicKey.getKeyIDs()[0].toHex();
      const fingerprint = publicKey.getFingerprint();

      // Extract user info from key
      const userInfo = {
        name: primaryUser.user.userID?.name || "",
        email: primaryUser.user.userID?.email || "",
      };

      // Verify key validity
      const isValid =
        (await publicKey.verifyPrimaryKey()) === openpgp.enums.keyStatus.valid;

      return {
        isValid,
        keyId,
        fingerprint,
        userInfo,
      };
    } catch (error) {
      return {
        isValid: false,
        keyId: "",
        fingerprint: "",
        userInfo: { name: "", email: "" },
        error: error.message,
      };
    }
  }

  /**
   * Create a signed verification message
   */
  async createVerificationMessage(
    privateKeyArmored: string,
    passphrase: string,
    message: string,
  ): Promise<string> {
    try {
      const privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({
          armoredKey: privateKeyArmored,
        }),
        passphrase,
      });

      const signedMessage = await openpgp.sign({
        message: await openpgp.createMessage({ text: message }),
        signingKeys: privateKey,
        format: "armored",
      });

      return signedMessage;
    } catch (error) {
      throw new Error(
        `Failed to create verification message: ${error.message}`,
      );
    }
  }

  /**
   * Verify a signed message
   */
  async verifySignedMessage(
    signedMessage: string,
    publicKeyArmored: string,
  ): Promise<{ isValid: boolean; message: string; error?: string }> {
    try {
      const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });

      const message = await openpgp.readMessage({
        armoredMessage: signedMessage,
      });

      const verificationResult = await openpgp.verify({
        message,
        verificationKeys: publicKey,
      });

      const { verified } = verificationResult.signatures[0];

      try {
        await verified;
        const plaintext = verificationResult.data;

        return {
          isValid: true,
          message: plaintext,
        };
      } catch (e) {
        return {
          isValid: false,
          message: "",
          error: "Signature verification failed",
        };
      }
    } catch (error) {
      return {
        isValid: false,
        message: "",
        error: error.message,
      };
    }
  }

  /**
   * Encrypt a message for a recipient
   */
  async encryptMessage(
    message: string,
    recipientPublicKeyArmored: string,
  ): Promise<string> {
    try {
      const publicKey = await openpgp.readKey({
        armoredKey: recipientPublicKeyArmored,
      });

      const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: message }),
        encryptionKeys: publicKey,
        format: "armored",
      });

      return encrypted;
    } catch (error) {
      throw new Error(`Failed to encrypt message: ${error.message}`);
    }
  }

  /**
   * Decrypt a message
   */
  async decryptMessage(
    encryptedMessage: string,
    privateKeyArmored: string,
    passphrase: string,
  ): Promise<string> {
    try {
      const privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({
          armoredKey: privateKeyArmored,
        }),
        passphrase,
      });

      const message = await openpgp.readMessage({
        armoredMessage: encryptedMessage,
      });

      const { data: decrypted } = await openpgp.decrypt({
        message,
        decryptionKeys: privateKey,
        format: "utf8",
      });

      return decrypted;
    } catch (error) {
      throw new Error(`Failed to decrypt message: ${error.message}`);
    }
  }

  /**
   * Generate a verification challenge for login
   */
  generateVerificationChallenge(username: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `SwiperEmpire-Verification-${username}-${timestamp}-${random}`;
  }

  /**
   * Validate PGP key strength and security
   */
  async validateKeyStrength(publicKeyArmored: string): Promise<{
    isStrong: boolean;
    warnings: string[];
    score: number;
  }> {
    try {
      const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
      const warnings: string[] = [];
      let score = 100;

      // Check key algorithm
      const algorithm = publicKey.getAlgorithmInfo();
      if (algorithm.algorithm !== "ecdsa" && algorithm.algorithm !== "rsa") {
        warnings.push("Consider using ECDSA or RSA algorithm");
        score -= 20;
      }

      // Check key size for RSA
      if (algorithm.algorithm === "rsa" && algorithm.bits < 2048) {
        warnings.push("RSA key should be at least 2048 bits");
        score -= 30;
      }

      // Check expiration
      const expirationTime = await publicKey.getExpirationTime();
      if (!expirationTime) {
        warnings.push("Consider setting an expiration date for your key");
        score -= 10;
      }

      // Check if key is revoked
      if (await publicKey.isRevoked()) {
        warnings.push("Key is revoked");
        score = 0;
      }

      return {
        isStrong: score >= 70,
        warnings,
        score,
      };
    } catch (error) {
      return {
        isStrong: false,
        warnings: [`Invalid key: ${error.message}`],
        score: 0,
      };
    }
  }
}

export const pgpVerificationService = new PGPVerificationService();
export default pgpVerificationService;
