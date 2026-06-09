module.exports = (sequelize, DataTypes, Sequelize) => {
  class KnowledgeChunk extends Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.KnowledgeBase, { foreignKey: "knowledge_base_id", as: "knowledgeBase" });
    }
  }

  KnowledgeChunk.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    knowledge_base_id: { type: DataTypes.INTEGER, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  }, {
    sequelize,
    modelName: "KnowledgeChunk",
    tableName: "knowledge_chunks",
    underscored: true,
    freezeTableName: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    paranoid: false,
  });

  return KnowledgeChunk;
};
