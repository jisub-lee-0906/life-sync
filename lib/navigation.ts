import {
  CalendarDays,
  ChartPie,
  Landmark,
  LayoutGrid,
  ListTodo,
  Settings,
} from "lucide-react";

export const navigationItems = [
  {
    href: "/finance",
    label: "가계부",
    description: "헤드라인 요약과 Quick Add",
    icon: Landmark,
  },
  {
    href: "/calendar",
    label: "라이프 캘린더",
    description: "일정과 재무를 한 화면에서",
    icon: CalendarDays,
  },
  {
    href: "/tasks",
    label: "할일 & 루틴",
    description: "진행률과 체크 트래커",
    icon: ListTodo,
  },
  {
    href: "/mandalart",
    label: "만다라트",
    description: "3x3 목표 그리드",
    icon: LayoutGrid,
  },
  {
    href: "/analytics",
    label: "통합 통계",
    description: "도넛 차트와 성과 분석",
    icon: ChartPie,
  },
  {
    href: "/settings",
    label: "설정 & 관리자",
    description: "승인, 이관, 환경설정",
    icon: Settings,
  },
] as const;
