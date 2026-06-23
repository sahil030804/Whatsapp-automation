const { User } = require("../../models");
const { invalidateUserCache } = require("../../lib/redis");

class UserProfileService {
  /**
   * Update the signed-in user's personal profile (name, phone, email).
   * Only whitelisted fields are written. Email changes are checked for
   * uniqueness against other accounts. The Redis user cache is invalidated
   * so `isLoggedIn` serves fresh data on the next request.
   */
  async updateProfile(userId, data) {
    const user = await User.findByPk(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    const updates = {};

    if (data.firstName !== undefined) {
      updates.fname = data.firstName?.trim() || null;
    }
    if (data.lastName !== undefined) {
      updates.lname = data.lastName?.trim() || null;
    }
    if (data.phone !== undefined) {
      updates.phone_number = data.phone?.trim() || null;
    }

    if (data.email !== undefined) {
      const newEmail = data.email.trim().toLowerCase();
      if (newEmail !== user.email) {
        const existing = await User.findOne({
          where: { email: newEmail },
          attributes: ["id"],
        });
        if (existing && existing.id !== userId) {
          return {
            success: false,
            error: "EMAIL_EXISTS",
            message: "That email is already in use",
          };
        }
        // The model's `set()` lowercases, but we pass the normalised value.
        updates.email = newEmail;
      }
    }

    await user.update(updates);
    await invalidateUserCache(userId);

    return { success: true, user: user.toJSON() };
  }
}

module.exports = new UserProfileService();
