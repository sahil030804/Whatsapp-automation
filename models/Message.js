module.exports = (sequelize, DataTypes, Sequelize) => {
  class Message extends Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.Conversation, { foreignKey: "conversation_id", as: "conversation" });
    }
  }

  Message.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    conversation_id: { type: DataTypes.INTEGER, allowNull: false },
    role: { type: DataTypes.STRING(20), allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    wa_message_id: { type: DataTypes.STRING(255), allowNull: true },
    metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  }, {
    sequelize,
    modelName: "Message",
    tableName: "messages",
    underscored: true,
    freezeTableName: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    paranoid: false,
  });

  return Message;
};
