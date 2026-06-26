module.exports = (sequelize, DataTypes, Sequelize) => {
  class WhatsAppAccount extends Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
      this.hasMany(models.KnowledgeBase, { foreignKey: "wa_account_id", as: "knowledgeBases" });
      this.hasMany(models.Conversation, { foreignKey: "wa_account_id", as: "conversations" });
    }
  }

  WhatsAppAccount.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.UUID, allowNull: false },
    waba_id: { type: DataTypes.STRING(255), allowNull: true },
    business_id: { type: DataTypes.STRING(255), allowNull: true },
    phone_number_id: { type: DataTypes.STRING(255), allowNull: true },
    display_phone_number: { type: DataTypes.STRING(30), allowNull: true },
    access_token_encrypted: { type: DataTypes.TEXT, allowNull: true },
    token_expires_at: { type: DataTypes.DATE, allowNull: true },
    webhook_id: { type: DataTypes.STRING(255), allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    auto_reply_enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, {
    sequelize,
    modelName: "WhatsAppAccount",
    tableName: "whatsapp_accounts",
    underscored: true,
    freezeTableName: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: false,
  });

  return WhatsAppAccount;
};
