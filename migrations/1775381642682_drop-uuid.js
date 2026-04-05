exports.up = (pgm) => {
  pgm.dropColumn("users", "uuid", { ifExists: true });
  pgm.dropIndex("users", "uuid", { ifExists: true });
};

exports.down = (pgm) => {
  pgm.addColumn("users", {
    uuid: {
      type: "uuid",
      notNull: false,
      default: pgm.func("gen_random_uuid()"),
    },
  });

  pgm.createIndex("users", "uuid", { ifNotExists: true });
};
