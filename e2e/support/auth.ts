import { encode } from "next-auth/jwt";
import { loadTestEnv } from "./env";

loadTestEnv();

export type SessionState =
  | "UNAUTHENTICATED"
  | "PENDING"
  | "APPROVED_USER"
  | "APPROVED_ADMIN";

export type SessionIdentity = {
  email: string;
  name: string;
  role: "ADMIN" | "USER";
  status: "APPROVED" | "PENDING" | "REJECTED";
  userId: string;
};

function getSessionCookieName(baseURL: string) {
  return new URL(baseURL).protocol === "https:"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}

export async function buildSessionCookie(baseURL: string, identity: SessionIdentity) {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is required for Playwright auth cookie generation.");
  }

  const name = getSessionCookieName(baseURL);
  const value = await encode({
    salt: name,
    secret,
    token: {
      email: identity.email,
      name: identity.name,
      role: identity.role,
      status: identity.status,
      sub: identity.userId,
    },
  });

  return {
    httpOnly: true,
    name,
    sameSite: "Lax" as const,
    secure: name.startsWith("__Secure-"),
    url: baseURL,
    value,
  };
}

export function resolveSessionIdentity(
  state: SessionState,
  identity: Pick<SessionIdentity, "email" | "name" | "userId">,
): SessionIdentity | null {
  if (state === "UNAUTHENTICATED") {
    return null;
  }

  if (state === "PENDING") {
    return {
      ...identity,
      role: "USER",
      status: "PENDING",
    };
  }

  if (state === "APPROVED_ADMIN") {
    return {
      ...identity,
      role: "ADMIN",
      status: "APPROVED",
    };
  }

  return {
    ...identity,
    role: "USER",
    status: "APPROVED",
  };
}
