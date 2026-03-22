export type DashboardRouteMeta = {
  description: string;
  label: string;
};

export type DashboardRouteDefinition = {
  href: string;
  mobilePrimary?: boolean;
  meta: DashboardRouteMeta;
};

const fallbackRouteMeta: DashboardRouteMeta = {
  description: "Dashboard",
  label: "LifeSync",
};

const routeDefinitions: DashboardRouteDefinition[] = [
  {
    href: "/settings/admin",
    mobilePrimary: false,
    meta: {
      description: "Pending approvals",
      label: "Admin",
    },
  },
  {
    href: "/finance",
    mobilePrimary: true,
    meta: {
      description: "Finance tracking",
      label: "Finance",
    },
  },
  {
    href: "/calendar",
    mobilePrimary: true,
    meta: {
      description: "Life calendar",
      label: "Calendar",
    },
  },
  {
    href: "/todo-routine",
    mobilePrimary: true,
    meta: {
      description: "Tasks and routines",
      label: "Todo & Routine",
    },
  },
  {
    href: "/mandalart",
    mobilePrimary: true,
    meta: {
      description: "Goal board",
      label: "Mandalart",
    },
  },
  {
    href: "/analytics",
    mobilePrimary: false,
    meta: {
      description: "Analytics and trends",
      label: "Analytics",
    },
  },
  {
    href: "/settings",
    mobilePrimary: true,
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

export function getDashboardRoutes() {
  return routeDefinitions;
}
