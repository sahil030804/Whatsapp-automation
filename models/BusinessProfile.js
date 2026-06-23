module.exports = (sequelize, DataTypes, Sequelize) => {
  class BusinessProfile extends Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
    }
  }

  BusinessProfile.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.UUID, allowNull: false, unique: true },
      // Business identity (B3)
      business_name: { type: DataTypes.STRING(255), allowNull: true },
      industry: { type: DataTypes.STRING(255), allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      website: { type: DataTypes.STRING(500), allowNull: true },
      // Agent persona / behaviour (B4)
      assistant_name: {
        type: DataTypes.STRING(120),
        allowNull: false,
        defaultValue: "Assistant",
      },
      tone: {
        type: DataTypes.STRING(60),
        allowNull: false,
        defaultValue: "friendly_professional",
      },
      fallback_message: { type: DataTypes.TEXT, allowNull: true },
      business_hours: { type: DataTypes.TEXT, allowNull: true },
      escalation_note: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      modelName: "BusinessProfile",
      tableName: "business_profiles",
      underscored: true,
      freezeTableName: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: false,
    },
  );

  return BusinessProfile;
};
