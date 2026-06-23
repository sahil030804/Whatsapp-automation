module.exports = (sequelize, DataTypes, Sequelize) => {
  class WebhookEvent extends Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.WhatsAppAccount, {
        foreignKey: "matched_account_id",
        as: "whatsAppAccount",
      });
    }
  }

  WebhookEvent.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      // body.object e.g. "whatsapp_business_account"
      object: { type: DataTypes.STRING(100), allowNull: true },
      // change.field e.g. "messages"
      field: { type: DataTypes.STRING(100), allowNull: true },
      // metadata.phone_number_id that Meta delivered the event for
      phone_number_id: { type: DataTypes.STRING(255), allowNull: true },
      from_number: { type: DataTypes.STRING(30), allowNull: true },
      wa_message_id: { type: DataTypes.STRING(255), allowNull: true },
      message_type: { type: DataTypes.STRING(50), allowNull: true },
      // WhatsAppAccount.id when the phone_number_id maps to an active account
      matched_account_id: { type: DataTypes.INTEGER, allowNull: true },
      // owning user, resolved from the matched account (null for unmatched events)
      user_id: { type: DataTypes.UUID, allowNull: true },
      direction: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "inbound",
      },
      // received | signature_invalid | no_entries | enqueued | dropped_no_account
      // | ignored_unsupported_type | empty_body | ignored_non_message_field
      // | no_phone_number_id | status_update | error
      processing_status: { type: DataTypes.STRING(50), allowNull: false },
      signature_valid: { type: DataTypes.BOOLEAN, allowNull: true },
      payload: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      error_message: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      modelName: "WebhookEvent",
      tableName: "webhook_events",
      underscored: true,
      freezeTableName: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      paranoid: false,
      indexes: [
        { fields: ["created_at"] },
        { fields: ["phone_number_id"] },
        { fields: ["matched_account_id"] },
        { fields: ["user_id"] },
      ],
    },
  );

  return WebhookEvent;
};
