import {
  type PgDatabase,
} from "drizzle-orm/pg-core";

import {
  user,
} from "@local/database/drizzle";

import { createId } from "@paralleldrive/cuid2";

export const createUser = async (client: InstanceType<typeof PgDatabase>, data: { name: string, email: string, emailVerified: Date }) =>
       await client
        .insert(user)
        .values({ ...data, id: createId() })
        .returning();
