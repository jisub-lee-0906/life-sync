import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db, hasDatabaseUrl } from "@/lib/db";
import { accounts, users } from "@/drizzle/schema";

type UserRole = "ADMIN" | "USER";
type UserStatus = "PENDING" | "APPROVED" | "REJECTED";

function parseAdminEmails() {
  return (
    process.env.ADMIN_EMAILS?.split(",").map((email) => email.trim()).filter(Boolean) ?? []
  );
}

async function syncUserClaims(input: {
  email?: string | null;
  name?: string | null;
  image?: string | null;
  userId?: string | null;
}) {
  if (!hasDatabaseUrl || !input.email) {
    return null;
  }

  const email = input.email.trim().toLowerCase();
  const adminEmails = parseAdminEmails().map((entry) => entry.toLowerCase());
  const isAdminEmail = adminEmails.includes(email);

  let existingUser =
    input.userId
      ? await db.query.users.findFirst({
          where: (table, { eq }) => eq(table.id, input.userId as string),
        })
      : null;

  if (!existingUser) {
    existingUser = await db.query.users.findFirst({
      where: (table, { eq }) => eq(table.email, email),
    });
  }

  const nextRole: UserRole = isAdminEmail ? "ADMIN" : existingUser?.role ?? "USER";
  const nextStatus: UserStatus = isAdminEmail
    ? "APPROVED"
    : existingUser?.status ?? "PENDING";
  const nextName = input.name?.trim() || existingUser?.name || email.split("@")[0] || "LifeSync User";
  const nextImage = input.image ?? existingUser?.image ?? null;

  if (!existingUser) {
    const [createdUser] = await db
      .insert(users)
      .values({
        email,
        image: nextImage,
        name: nextName,
        role: nextRole,
        status: nextStatus,
      })
      .returning();

    return createdUser ?? null;
  }

  const shouldUpdate =
    existingUser.email !== email ||
    existingUser.name !== nextName ||
    existingUser.image !== nextImage ||
    existingUser.role !== nextRole ||
    existingUser.status !== nextStatus;

  if (!shouldUpdate) {
    return existingUser;
  }

  const [updatedUser] = await db
    .update(users)
    .set({
      email,
      image: nextImage,
      name: nextName,
      role: nextRole,
      status: nextStatus,
    })
    .where(eq(users.id, existingUser.id))
    .returning();

  return updatedUser ?? existingUser;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    accountsTable: accounts,
    usersTable: users,
  }),
  providers: [Google],
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (!token.email && user?.email) {
        token.email = user.email;
      }

      const needsSync =
        Boolean(user) || trigger === "signIn" || !token.role || !token.status;

      if (!needsSync) {
        return token;
      }

      const dbUser = await syncUserClaims({
        email: user?.email ?? token.email,
        image: user?.image,
        name: user?.name,
        userId: user?.id ?? token.sub,
      });

      if (dbUser) {
        token.sub = dbUser.id;
        token.role = dbUser.role;
        token.status = dbUser.status;
      } else {
        token.role ??= "USER";
        token.status ??= "PENDING";
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as UserRole | undefined) ?? "USER";
        session.user.status = (token.status as UserStatus | undefined) ?? "PENDING";
      }

      return session;
    },
  },
});
