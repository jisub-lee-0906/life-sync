export function buildLoginCallbackUrl(pathname: string, search: string) {
  return `${pathname}${search}`;
}

export function resolveLoginRedirectTarget(
  callbackUrl: string | string[] | undefined,
) {
  const rawValue = Array.isArray(callbackUrl) ? callbackUrl[0] : callbackUrl;
  const normalizedValue = rawValue?.trim();

  if (!normalizedValue || !normalizedValue.startsWith("/")) {
    return "/finance";
  }

  if (normalizedValue.startsWith("//")) {
    return "/finance";
  }

  return normalizedValue;
}
