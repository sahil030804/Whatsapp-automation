const crypto = require("crypto");
const { whatsapp } = require("../config");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

class EncryptionService {
  _getKey() {
    if (!this._key) {
      const key = whatsapp.encryptionKey;
      if (!key) {
        throw new Error("WHATSAPP_CREDENTIAL_ENCRYPTION_KEY is required");
      }
      this._key = crypto.scryptSync(key, "salt", 32);
    }
    return this._key;
  }

  encrypt(plaintext) {
    const key = this._getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    return JSON.stringify({
      iv: iv.toString("hex"),
      tag: authTag,
      data: encrypted,
    });
  }

  decrypt(encryptedPayload) {
    const key = this._getKey();
    const { iv, tag, data } = JSON.parse(encryptedPayload);

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(iv, "hex"),
    );

    decipher.setAuthTag(Buffer.from(tag, "hex"));

    let decrypted = decipher.update(data, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }
}

module.exports = new EncryptionService();
