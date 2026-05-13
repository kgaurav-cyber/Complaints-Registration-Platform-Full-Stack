const { pgTable, serial, text, timestamp, boolean } = require("drizzle-orm/pg-core");

const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  password: text("password"),
  role: text("role").default("user").notNull(),
  otp: text("otp"),
  otp_expiry: timestamp("otp_expiry"),
  is_verified: boolean("is_verified").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  user_id: serial("user_id").references(() => users.id),
  complaint_text: text("complaint_text").notNull(),
  ai_question: text("ai_question"),
  user_answer: text("user_answer"),
  created_at: timestamp("created_at").defaultNow(),
});

module.exports = { users, complaints };

