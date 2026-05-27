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
  description: "오늘 필요한 화면",
  label: "LifeSync",
};

const routeDefinitions: DashboardRouteDefinition[] = [
  {
    href: "/finance",
    mobilePrimary: true,
    meta: {
      description: "수입과 지출을 빠르게 정리해요.",
      label: "가계부",
    },
  },
  {
    href: "/calendar",
    mobilePrimary: true,
    meta: {
      description: "오늘 일정과 소비를 한눈에 봐요.",
      label: "캘린더",
    },
  },
  {
    href: "/todo-routine",
    mobilePrimary: true,
    meta: {
      description: "할 일과 루틴을 가볍게 이어가요.",
      label: "할 일·루틴",
    },
  },
  {
    href: "/mandalart",
    mobilePrimary: true,
    meta: {
      description: "중요한 목표를 차분하게 펼쳐봐요.",
      label: "만다라트",
    },
  },
  {
    href: "/analytics",
    mobilePrimary: false,
    meta: {
      description: "이번 흐름을 숫자로 확인해요.",
      label: "분석",
    },
  },
  {
    href: "/settings",
    mobilePrimary: true,
    meta: {
      description: "기본 설정과 데이터 관리를 정리해요.",
      label: "설정",
    },
  },
  {
    href: "/settings/backup",
    mobilePrimary: false,
    meta: {
      description: "백업 파일을 저장하거나 복구해요.",
      label: "백업",
    },
  },
  {
    href: "/settings/categories",
    mobilePrimary: false,
    meta: {
      description: "수입과 지출 분류를 관리해요.",
      label: "분류 관리",
    },
  },
  {
    href: "/settings/admin",
    mobilePrimary: false,
    meta: {
      description: "가입 승인 관리",
      label: "관리",
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
  const matchedRoute = [...routeDefinitions]
    .sort((left, right) => right.href.length - left.href.length)
    .find(({ href }) => isExactOrNestedRoute(pathname, href));

  return matchedRoute?.meta ?? fallbackRouteMeta;
}

export function getDashboardRoutes() {
  return routeDefinitions;
}
