exports.up = (pgm) => {
  pgm.createTable("whatsapp_accounts", {
    id: { type: "serial", primaryKey: true },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
    },
    waba_id: { type: "varchar(255)" },
    business_id: { type: "varchar(255)" },
    phone_number_id: { type: "varchar(255)" },
    access_token_encrypted: { type: "text" },
    token_expires_at: { type: "timestamptz" },
    webhook_id: { type: "varchar(255)" },
    is_active: { type: "boolean", notNull: true, default: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("whatsapp_accounts", "user_id");
  pgm.createIndex("whatsapp_accounts", "waba_id");

  pgm.createTable("knowledge_bases", {
    id: { type: "serial", primaryKey: true },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
    },
    wa_account_id: {
      type: "bigint",
      references: "whatsapp_accounts(id)",
      onDelete: "SET NULL",
    },
    filename: { type: "varchar(500)", notNull: true },
    original_name: { type: "varchar(500)", notNull: true },
    mime_type: { type: "varchar(100)" },
    file_size: { type: "integer" },
    status: { type: "varchar(50)", notNull: true, default: "pending" },
    chunk_count: { type: "integer", notNull: true, default: 0 },
    error_message: { type: "text" },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("knowledge_bases", "user_id");
  pgm.createIndex("knowledge_bases", "status");

  pgm.createTable("knowledge_chunks", {
    id: { type: "serial", primaryKey: true },
    knowledge_base_id: {
      type: "integer",
      notNull: true,
      references: "knowledge_bases(id)",
      onDelete: "CASCADE",
    },
    content: { type: "text", notNull: true },
    embedding: { type: "jsonb" },
    metadata: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'{}'::jsonb"),
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("knowledge_chunks", "knowledge_base_id");

  pgm.createTable("conversations", {
    id: { type: "serial", primaryKey: true },
    wa_account_id: {
      type: "integer",
      notNull: true,
      references: "whatsapp_accounts(id)",
      onDelete: "CASCADE",
    },
    customer_phone: { type: "varchar(20)", notNull: true },
    customer_name: { type: "varchar(255)" },
    last_message_at: { type: "timestamptz" },
    unread_count: { type: "integer", notNull: true, default: 0 },
    metadata: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'{}'::jsonb"),
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("conversations", "wa_account_id");
  pgm.createIndex("conversations", "customer_phone");
  pgm.createIndex("conversations", "last_message_at");

  pgm.createTable("messages", {
    id: { type: "serial", primaryKey: true },
    conversation_id: {
      type: "integer",
      notNull: true,
      references: "conversations(id)",
      onDelete: "CASCADE",
    },
    role: { type: "varchar(20)", notNull: true },
    content: { type: "text", notNull: true },
    wa_message_id: { type: "varchar(255)" },
    metadata: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'{}'::jsonb"),
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("messages", "conversation_id");
  pgm.createIndex("messages", "wa_message_id");
};

exports.down = (pgm) => {
  pgm.dropTable("messages");
  pgm.dropTable("conversations");
  pgm.dropTable("knowledge_chunks");
  pgm.dropTable("knowledge_bases");
  pgm.dropTable("whatsapp_accounts");
};
