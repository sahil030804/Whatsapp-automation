const bcrypt = require("bcrypt");
const { logger } = require("../lib/logger");

module.exports = (sequelize, DataTypes, Sequelize) => {
  class User extends Sequelize.Model {
    static associate(models) {}

    async verifyPassword(password) {
      return bcrypt.compare(password, this.password_hash);
    }

    toJSON() {
      const values = Object.assign({}, this.get());

      delete values.password_hash;

      return {
        id: values.id,
        email: values.email,
        fullName:
          [values.fname, values.lname].filter(Boolean).join(" ").trim() || null,
        firstName: values.fname || null,
        lastName: values.lname || null,
        phoneNumber: values.phone_number || null,
        role: values.role,
        status: values.status,
        plan: values.plan,
        onboardingCompleted: values.onboarding_completed,
        createdAt: values.createdAt,
        updatedAt: values.updatedAt,
      };
    }

    static async findByEmail(email) {
      return this.findOne({
        where: { email: email.toLowerCase() },
        attributes: [
          "id",
          "email",
          "password_hash",
          "fname",
          "lname",
          "phone_number",
          "role",
          "status",
          "plan",
          "onboarding_completed",
          "createdAt",
          "updatedAt",
        ],
      });
    }

    static async findById(userId) {
      return this.findOne({
        where: { id: userId },
        attributes: [
          "id",
          "email",
          "fname",
          "lname",
          "phone_number",
          "role",
          "status",
          "plan",
          "onboarding_completed",
          "createdAt",
          "updatedAt",
        ],
      });
    }

    static async checkEmailExists(email) {
      const user = await this.findOne({
        where: { email: email.toLowerCase() },
        attributes: ["id"],
      });
      return user !== null;
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        set(value) {
          this.setDataValue("email", value ? value.toLowerCase() : value);
        },
      },
      phone_number: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      fname: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      lname: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      role: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "USER",
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "ACTIVE",
      },
      plan: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "FREE",
      },
      onboarding_completed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      ai_replies_used: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      ai_replies_limit: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 20,
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      freezeTableName: true,
      timestamps: true,
      underscored: false,
      paranoid: false,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      hooks: {
        beforeCreate: async (user) => {
          if (user.password_hash && !user.password_hash.startsWith("$2")) {
            const saltRounds = 12;
            user.password_hash = await bcrypt.hash(
              user.password_hash,
              saltRounds,
            );
          }
        },
        beforeUpdate: async (user) => {
          if (
            user.changed("password_hash") &&
            !user.password_hash.startsWith("$2")
          ) {
            const saltRounds = 12;
            user.password_hash = await bcrypt.hash(
              user.password_hash,
              saltRounds,
            );
          }
        },
        afterCreate: (user) => {
          logger.info("New user created successfully", {
            userId: user.id,
            email: user.email,
          });
        },
      },
    },
  );

  User.createUser = async function (userData) {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      role = "USER",
    } = userData;

    try {
      const emailExists = await this.checkEmailExists(email);
      if (emailExists) {
        return {
          success: false,
          error: "EMAIL_EXISTS",
          message: "A user with this email address is already registered",
        };
      }

      const user = await this.create({
        email,
        password_hash: password,
        fname: firstName?.trim() || null,
        lname: lastName?.trim() || null,
        phone_number: phone?.trim() || null,
        role,
        status: "ACTIVE",
        plan: "FREE",
        onboarding_completed: false,
      });

      return {
        success: true,
        message: "User registered successfully",
        user: user.toJSON(),
      };
    } catch (error) {
      logger.error("User creation error:", {
        error: error.message,
        stack: error.stack,
        email,
      });

      if (error.name === "SequelizeUniqueConstraintError") {
        return {
          success: false,
          error: "EMAIL_EXISTS",
          message: "A user with this email address is already registered",
        };
      }

      if (error.name === "SequelizeValidationError") {
        return {
          success: false,
          error: "VALIDATION_ERROR",
          message: error.message,
          details: error.errors,
        };
      }

      return {
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred during user creation",
      };
    }
  };

  return User;
};
