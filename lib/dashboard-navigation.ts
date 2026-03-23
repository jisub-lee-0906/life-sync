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
  description: "오늘의 흐름",
  label: "LifeSync",
};

const routeDefinitions: DashboardRouteDefinition[] = [
  {
    href: "/settings/admin",
    mobilePrimary: false,
    meta: {
      description: "가입 승인 관리",
      label: "관리",
    },
  },
  {
    href: "/settings/backup",
    mobilePrimary: false,
    meta: {
      description: "데이터 백업과 복구",
      label: "백업",
    },
  },
  {
    href: "/finance",
    mobilePrimary: true,
    meta: {
      description: "이번 달 수입과 지출",
      label: "가계부",
    },
  },
  {
    href: "/calendar",
    mobilePrimary: true,
    meta: {
      description: "하루 일정과 내역",
      label: "캘린더",
    },
  },
  {
    href: "/todo-routine",
    mobilePrimary: true,
    meta: {
      description: "할 일과 루틴 체크",
      label: "할 일·루틴",
    },
  },
  {
    href: "/mandalart",
    mobilePrimary: true,
    meta: {
      description: "목표를 한눈에",
      label: "만다라트",
    },
  },
  {
    href: "/analytics",
    mobilePrimary: false,
    meta: {
      description: "지출과 달성률 보기",
      label: "분석",
    },
  },
  {
    href: "/settings",
    mobilePrimary: true,
    meta: {
      description: "기본 설정",
      label: "설정",
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
