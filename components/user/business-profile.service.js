const { BusinessProfile } = require("../../models");

const EDITABLE_FIELDS = [
  "business_name",
  "industry",
  "description",
  "website",
  "assistant_name",
  "tone",
  "fallback_message",
  "business_hours",
  "escalation_note",
];

const DEFAULTS = {
  business_name: null,
  industry: null,
  description: null,
  website: null,
  assistant_name: "Assistant",
  tone: "friendly_professional",
  fallback_message: null,
  business_hours: null,
  escalation_note: null,
};

class BusinessProfileService {
  /** Returns the persisted profile, or an unsaved defaults object. */
  async getProfile(userId) {
    const profile = await BusinessProfile.findOne({ where: { user_id: userId } });
    if (!profile) {
      return { success: true, profile: { ...DEFAULTS, user_id: userId } };
    }
    return { success: true, profile };
  }

  /** Upsert: only whitelisted fields are written. */
  async updateProfile(userId, data) {
    const updates = {};
    for (const field of EDITABLE_FIELDS) {
      if (data[field] !== undefined) updates[field] = data[field];
    }

    let profile = await BusinessProfile.findOne({ where: { user_id: userId } });
    if (profile) {
      await profile.update(updates);
    } else {
      profile = await BusinessProfile.create({ user_id: userId, ...updates });
    }

    return { success: true, profile };
  }
}

module.exports = new BusinessProfileService();
