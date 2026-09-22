type UserRole = "ADMIN" | "USER";
type UserStatus = "PENDING" | "APPROVED" | "REJECTED";

type CurrentUser = { id: string; role: UserRole; status: UserStatus };
type GuardDependencies = {
  hasDatabaseUrl: boolean;
  getSession: () => Promise<{ user?: { id?: string } | null } | null>;
  findUser: (id: string) => Promise<CurrentUser | undefined>;
};

export class AccessDeniedError extends Error {
  constructor() {
    super("권한이 없어요.");
    this.name = "AccessDeniedError";
  }
}

export function createApprovedUserGuard(dependencies: GuardDependencies) {
  async function requireApprovedUser() {
    const session = await dependencies.getSession();
    const userId = session?.user?.id;

    if (!userId) throw new AccessDeniedError();
    if (!dependencies.hasDatabaseUrl) {
      throw new Error("데이터베이스 연결을 확인해 주세요.");
    }

    const user = await dependencies.findUser(userId);
    if (!user || user.status !== "APPROVED") throw new AccessDeniedError();
    return user;
  }

  async function requireApprovedAdmin() {
    const user = await requireApprovedUser();
    if (user.role !== "ADMIN") throw new AccessDeniedError();
    return user;
  }

  return { requireApprovedAdmin, requireApprovedUser };
}
