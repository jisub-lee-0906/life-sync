import { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "USER";
      status: "PENDING" | "APPROVED" | "REJECTED";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role?: "ADMIN" | "USER";
    status?: "PENDING" | "APPROVED" | "REJECTED";
  }
}
