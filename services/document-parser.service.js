const fs = require("fs");
const path = require("path");
const { logger } = require("../lib/logger");

class DocumentParserService {
  async extractText(filePath, mimeType) {
    const ext = path.extname(filePath).toLowerCase();

    try {
      if (ext === ".pdf") {
        return await this._parsePDF(filePath);
      }
      if (ext === ".docx") {
        return await this._parseDOCX(filePath);
      }
      if (ext === ".txt" || ext === ".csv" || ext === ".json" || ext === ".md") {
        return await this._parseText(filePath);
      }
      throw new Error(`Unsupported file type: ${ext}`);
    } catch (err) {
      logger.error({ err, filePath, mimeType }, "Document parsing failed");
      throw err;
    }
  }

  async _parsePDF(filePath) {
    const pdfParse = require("pdf-parse");
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  async _parseDOCX(filePath) {
    const mammoth = require("mammoth");
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  async _parseText(filePath) {
    return fs.readFileSync(filePath, "utf-8");
  }

  chunkText(text, maxTokens = 500, overlap = 100) {
    const words = text.split(/\s+/);
    const chunks = [];
    let start = 0;

    while (start < words.length) {
      const end = Math.min(start + maxTokens, words.length);
      const chunk = words.slice(start, end).join(" ");

      if (chunk.trim()) {
        chunks.push(chunk.trim());
      }

      if (end >= words.length) break;
      start = end - overlap;
    }

    return chunks;
  }
}

module.exports = new DocumentParserService();
