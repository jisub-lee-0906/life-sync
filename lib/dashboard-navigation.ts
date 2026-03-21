export type DashboardRouteMeta = {
  description: string;
  label: string;
};

type DashboardRouteDefinition = {
  href: string;
  meta: DashboardRouteMeta;
};

const fallbackRouteMeta: DashboardRouteMeta = {
  description: "Dashboard",
  label: "LifeSync",
};

const routeDefinitions: DashboardRouteDefinition[] = [
  {
    href: "/settings/admin",
    meta: {
      description: "Pending approvals",
      label: "Admin",
    },
  },
  {
    href: "/finance",
    meta: {
      description: "Finance tracking",
      label: "Finance",
    },
  },
  {
    href: "/calendar",
    meta: {
      description: "Life calendar",
      label: "Calendar",
    },
  },
  {
    href: "/todo-routine",
    meta: {
      description: "Tasks and routines",
      label: "Todo & Routine",
    },
  },
  {
    href: "/mandalart",
    meta: {
      description: "Goal board",
      label: "Mandalart",
    },
  },
  {
    href: "/analytics",
    meta: {
      description: "Analytics and trends",
      label: "Analytics",
    },
  },
  {
    href: "/settings",
    meta: {
      description: "Preferences and backup",
      label: "Settings",
    },
  },
];

function isExactOrNestedRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isDashboardRouteActive(pathname: string, href: string) {
  return isExactOrNestedRoute(pathname, href);
}

export function getDashboardRouteMeta(pathname: string): DashboardRouteMeta {
  const matchedRoute = routeDefinitions.find(({ href }) =>
    isExactOrNestedRoute(pathname, href),
  );

  return matchedRoute?.meta ?? fallbackRouteMeta;
}
