module.exports = (sequelize, DataTypes, Sequelize) => {
  class KnowledgeBase extends Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
      this.belongsTo(models.WhatsAppAccount, {
        foreignKey: "wa_account_id",
        as: "whatsAppAccount",
      });
      this.hasMany(models.KnowledgeChunk, {
        foreignKey: "knowledge_base_id",
        as: "chunks",
      });
    }
  }

  KnowledgeBase.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.UUID, allowNull: false },
      wa_account_id: { type: DataTypes.BIGINT, allowNull: true },
      filename: { type: DataTypes.STRING(500), allowNull: false },
      original_name: { type: DataTypes.STRING(500), allowNull: false },
      mime_type: { type: DataTypes.STRING(100), allowNull: true },
      file_size: { type: DataTypes.INTEGER, allowNull: true },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "pending",
      },
      chunk_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      error_message: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      modelName: "KnowledgeBase",
      tableName: "knowledge_bases",
      underscored: true,
      freezeTableName: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: false,
    },
  );

  return KnowledgeBase;
};
