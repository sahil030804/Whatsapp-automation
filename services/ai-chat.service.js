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

  buildSystemPrompt(context, profile = null) {
    const p = profile || {};
    const assistantName = p.assistant_name || "Assistant";
    const businessName = p.business_name || "the business";
    const toneMap = {
      friendly_professional: "friendly and professional",
      formal: "formal and polite",
      casual: "casual and warm",
      concise: "concise and direct",
      enthusiastic: "upbeat and enthusiastic",
    };
    const toneText = toneMap[p.tone] || "friendly and professional";

    const lines = [
      `You are ${assistantName}, the AI assistant for ${businessName}. You respond to customer inquiries on WhatsApp on behalf of the business owner.`,
    ];

    if (p.description) lines.push(`About the business: ${p.description}`);
    if (p.industry) lines.push(`Industry: ${p.industry}`);
    if (p.website) lines.push(`Website: ${p.website}`);
    if (p.business_hours) lines.push(`Business hours: ${p.business_hours}`);

    lines.push(
      "",
      "Use the following business knowledge to answer questions accurately:",
      "---",
      context || "(no specific knowledge provided)",
      "---",
      "",
      "Instructions:",
      `- Answer in a ${toneText} tone.`,
      "- Keep responses concise and clear for a chat conversation.",
      "- Never make up information that isn't supported by the business knowledge.",
      "- Respond in the same language as the customer's message.",
    );

    if (p.fallback_message) {
      lines.push(
        `- If you don't have the information, respond with: "${p.fallback_message}"`,
      );
    } else {
      lines.push(
        "- If asked about something not in the business knowledge, politely say you don't have that information and offer to connect them with the business owner.",
      );
    }

    if (p.escalation_note) {
      lines.push(`- Escalate to a human when: ${p.escalation_note}`);
    }

    return lines.join("\n");
  }

  async generateReply(context, userMessage, conversationHistory = [], profile = null) {
    const systemPrompt = this.buildSystemPrompt(context, profile);

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10),
      { role: "user", content: userMessage },
    ];

    return this.chat(messages, { temperature: 0.3 });
  }
}

module.exports = new AIChatService();
