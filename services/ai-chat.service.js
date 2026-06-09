const axios = require("axios");
const { xai, application } = require("../config");
const { logger } = require("../lib/logger");

class AIChatService {
  constructor() {
    this.baseURL = xai.baseURL;
    this.apiKey = xai.apiKey;
    this.model = xai.chatModel;
  }

  async chat(messages, options = {}) {
    const {
      temperature = 0.7,
      maxTokens = 1024,
      model = this.model,
    } = options;

    if (!this.apiKey) {
      throw new Error("XAI_API_KEY is not configured");
    }

    const { data } = await axios.post(
      `${this.baseURL}/chat/completions`,
      {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      model: data.model,
    };
  }

  async generateReply(context, userMessage, conversationHistory = []) {
    const systemPrompt = `You are a helpful business assistant. Your role is to respond to customer inquiries on behalf of the business owner.

Use the following business knowledge to answer questions accurately and professionally:
---
${context}
---

Instructions:
- Answer in a friendly, professional tone.
- If asked about something not in the business knowledge, politely say you don't have that information and offer to connect them with the business owner.
- Keep responses concise and clear.
- Never make up information.
- Respond in the same language as the customer's message.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10),
      { role: "user", content: userMessage },
    ];

    return this.chat(messages, { temperature: 0.3 });
  }
}

module.exports = new AIChatService();
