type RequestUrlSource = {
  headers: Headers;
  nextUrl: {
    origin: string;
  };
};

const defaultLoginRedirectTarget = "/finance";
const protectedRedirectPrefixes = [
  "/finance",
  "/calendar",
  "/todo-routine",
  "/mandalart",
  "/analytics",
  "/settings",
] as const;

export function buildLoginCallbackUrl(pathname: string, search: string) {
  return `${pathname}${search}`;
}

export function resolveRequestOrigin(request: RequestUrlSource) {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.trim();

  if (!host) {
    return request.nextUrl.origin;
  }

  const nextUrlProtocol = new URL(request.nextUrl.origin).protocol.replace(/:$/, "");
  const protocol =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || nextUrlProtocol;

  return `${protocol}://${host}`;
}

export function buildRequestUrl(request: RequestUrlSource, pathname: string) {
  return new URL(pathname, resolveRequestOrigin(request));
}

export function resolveLoginRedirectTarget(
  callbackUrl: string | string[] | undefined,
) {
  const rawValue = Array.isArray(callbackUrl) ? callbackUrl[0] : callbackUrl;
  const normalizedValue = rawValue?.trim();

  if (!normalizedValue || !normalizedValue.startsWith("/")) {
    return defaultLoginRedirectTarget;
  }

  if (normalizedValue.startsWith("//")) {
    return defaultLoginRedirectTarget;
  }

  const pathname = normalizedValue.split(/[?#]/, 1)[0] ?? "";
  const isProtectedRoute = protectedRedirectPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtectedRoute) {
    return defaultLoginRedirectTarget;
  }

  return normalizedValue;
}
