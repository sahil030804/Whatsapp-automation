module.exports = (sequelize, DataTypes, Sequelize) => {
  class Conversation extends Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.WhatsAppAccount, { foreignKey: "wa_account_id", as: "whatsAppAccount" });
      this.hasMany(models.Message, { foreignKey: "conversation_id", as: "messages" });
    }
  }

  Conversation.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    wa_account_id: { type: DataTypes.INTEGER, allowNull: false },
    customer_phone: { type: DataTypes.STRING(20), allowNull: false },
    customer_name: { type: DataTypes.STRING(255), allowNull: true },
    last_message_at: { type: DataTypes.DATE, allowNull: true },
    // When the customer last messaged us — drives the 24h service window.
    last_inbound_at: { type: DataTypes.DATE, allowNull: true },
    unread_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  }, {
    sequelize,
    modelName: "Conversation",
    tableName: "conversations",
    underscored: true,
    freezeTableName: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: false,
  });

  return Conversation;
};
