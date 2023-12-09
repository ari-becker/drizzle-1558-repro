import {
  integer,
  pgEnum,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  type PgTable,
} from "drizzle-orm/pg-core";

// import type { AdapterAccount } from "@auth/core/adapters"

export const fooSchema = pgSchema("foo")

export const account = fooSchema.table(
  "Account",
  {
    id: text("id")
      .primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").$type<"email" | "oauth">().notNull(),
    // type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
) satisfies PgTable;

export const session = fooSchema.table("Session", {
  id: text("id")
    .primaryKey(),
  sessionToken: text("sessionToken")
    .notNull()
    .unique("sessions_sessionToken_unique"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
}) satisfies PgTable;

export const user = fooSchema.table("User", {
  id: text("id")
    .notNull()
    .primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
}) satisfies PgTable;

export const verificationToken = fooSchema.table(
  "VerificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
) satisfies PgTable;

