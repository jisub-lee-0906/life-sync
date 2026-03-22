export function isSettingsNavigationItemActive(
  pathname: string,
  hash: string,
  href: string,
) {
  const [hrefPathname, hrefHash] = href.split("#", 2);

  if (!hrefHash) {
    return pathname === hrefPathname && hash === "";
  }

  return pathname === hrefPathname && hash === `#${hrefHash}`;
}
