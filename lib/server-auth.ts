import "server-only";

import { auth } from "@/auth";
import { db, hasDatabaseUrl } from "@/lib/db";
export {
  AccessDeniedError,
  createApprovedUserGuard,
} from "@/lib/approved-user-guard";
import { createApprovedUserGuard } from "@/lib/approved-user-guard";

const guard = createApprovedUserGuard({
  hasDatabaseUrl,
  getSession: auth,
  findUser: (id) =>
    db.query.users.findFirst({
      columns: { id: true, role: true, status: true },
      where: (table, { eq }) => eq(table.id, id),
    }),
});

export const { requireApprovedAdmin, requireApprovedUser } = guard;