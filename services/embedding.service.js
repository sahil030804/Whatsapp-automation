const { logger } = require("../lib/logger");

class EmbeddingService {
  constructor() {
    this.pipeline = null;
    this.modelName = "Xenova/all-MiniLM-L6-v2";
    this.initializing = false;
    this.initPromise = null;
  }

  async _loadModel() {
    if (this.pipeline) return this.pipeline;
    if (this.initPromise) return this.initPromise;

    this.initializing = true;
    this.initPromise = (async () => {
      try {
        const { pipeline } = await import("@xenova/transformers");
        this.pipeline = await pipeline("feature-extraction", this.modelName, {
          quantized: true,
        });
        logger.info("Embedding model loaded successfully");
        return this.pipeline;
      } catch (err) {
        logger.error({ err }, "Failed to load embedding model");
        throw err;
      } finally {
        this.initializing = false;
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  async generateEmbedding(text) {
    const extractor = await this._loadModel();

    const result = await extractor(text, {
      pooling: "mean",
      normalize: true,
    });

    return Array.from(result.data);
  }

  async generateEmbeddings(texts) {
    const extractor = await this._loadModel();

    const result = await extractor(texts, {
      pooling: "mean",
      normalize: true,
    });

    const embeddings = [];
    const dim = result.data.length / texts.length;

    for (let i = 0; i < texts.length; i++) {
      embeddings.push(
        Array.from(result.data.subarray(i * dim, (i + 1) * dim)),
      );
    }

    return embeddings;
  }
}

module.exports = new EmbeddingService();
