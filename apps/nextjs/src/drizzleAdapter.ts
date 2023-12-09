import { and, eq } from "drizzle-orm";
import {
  integer,
  pgTable as defaultPgTableFn,
  type PgDatabase,
  type PgTableFn,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import {
  user,
  account,
  session,
  verificationToken,
} from "@local/database/drizzle";

import type { Adapter, AdapterAccount } from "next-auth/adapters";
import { createId } from "@paralleldrive/cuid2";

export const pgDrizzleAdapter = (
  client: InstanceType<typeof PgDatabase>,
): Adapter => {
  return {
    createUser: async (data) => {
      return await client
        .insert(user)
        .values({ ...data, id: createId() })
        .returning()
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        .then((res) => res[0]!)
        .then((res) => ({
          ...res,
          image: res.image ?? undefined,
        }));
    },
    async getUser(data) {
      return await client
        .select()
        .from(user)
        .where(eq(user.id, data))
        .then((res) => res[0] ?? null);
    },
    async getUserByEmail(data) {
      return await client
        .select()
        .from(user)
        .where(eq(user.email, data))
        .then((res) => res[0] ?? null);
    },
    async createSession(data) {
      return await client
        .insert(session)
        .values(data)
        .returning()
        .then((res) => res[0]);
    },
    async getSessionAndUser(data) {
      return await client
        .select({
          session: session,
          user: user,
        })
        .from(session)
        .where(eq(session.sessionToken, data))
        .innerJoin(user, eq(user.id, session.userId))
        .then((res) => res[0] ?? null);
    },
    async updateUser(data) {
      if (!data.id) {
        throw new Error("No user id.");
      }

      return await client
        .update(user)
        .set(data)
        .where(eq(user.id, data.id))
        .returning()
        .then((res) => res[0]);
    },
    async updateSession(data) {
      return await client
        .update(session)
        .set(data)
        .where(eq(session.sessionToken, data.sessionToken))
        .returning()
        .then((res) => res[0]);
    },
    async linkAccount(rawAccount) {
      const updatedAccount = await client
        .insert(account)
        .values(rawAccount)
        .returning()
        .then((res) => res[0]);

      // Drizzle will return `null` for fields that are not defined.
      // However, the return type is expecting `undefined`.
      const _account = {
        ...updatedAccount,
        access_token: updatedAccount.access_token ?? undefined,
        token_type: updatedAccount.token_type ?? undefined,
        id_token: updatedAccount.id_token ?? undefined,
        refresh_token: updatedAccount.refresh_token ?? undefined,
        scope: updatedAccount.scope ?? undefined,
        expires_at: updatedAccount.expires_at ?? undefined,
        session_state: updatedAccount.session_state ?? undefined,
      };

      return _account;
    },
    async getUserByAccount(_account) {
      const dbAccount =
        (await client
          .select()
          .from(account)
          .where(
            and(
              eq(account.providerAccountId, _account.providerAccountId),
              eq(account.provider, _account.provider),
            ),
          )
          .leftJoin(user, eq(account.userId, user.id))
          .then((res) => res[0])) ?? null;

      if (!dbAccount) {
        return null;
      }

      return dbAccount.user;
    },
    async deleteSession(sessionToken) {
      const _session = await client
        .delete(session)
        .where(eq(session.sessionToken, sessionToken))
        .returning()
        .then((res) => res[0] ?? null);

      return _session;
    },
    async createVerificationToken(token) {
      return await client
        .insert(verificationToken)
        .values(token)
        .returning()
        .then((res) => res[0]);
    },
    async useVerificationToken(token) {
      try {
        return await client
          .delete(verificationToken)
          .where(
            and(
              eq(verificationToken.identifier, token.identifier),
              eq(verificationToken.token, token.token),
            ),
          )
          .returning()
          .then((res) => res[0] ?? null);
      } catch (err) {
        throw new Error("No verification token found.");
      }
    },
    async deleteUser(id) {
      await client
        .delete(user)
        .where(eq(user.id, id))
        .returning()
        .then((res) => res[0] ?? null);
    },
    async unlinkAccount(_account) {
      const { type, provider, providerAccountId, userId } = await client
        .delete(account)
        .where(
          and(
            eq(account.providerAccountId, _account.providerAccountId),
            eq(account.provider, _account.provider),
          ),
        )
        .returning()
        .then((res) => res[0] ?? null);

      return { provider, type, providerAccountId, userId };
    },
  };
};
