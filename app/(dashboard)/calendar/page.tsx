import { SectionLanding } from "@/components/section-landing";

export default function CalendarPage() {
  return (
    <SectionLanding
      eyebrow="Life Calendar"
      title="재무와 할 일을 교차 확인할 통합 캘린더 영역을 분리했습니다."
      description="Step 1에서는 단순 폴더 라우트만 사용합니다. 병렬 라우트나 인터셉팅 없이도 우측 Drawer와 월간 캘린더를 올릴 수 있는 구조입니다."
      highlights={[
        "날짜 셀, 우측 상세 Drawer, 아이콘 레이어를 위한 화면 폭 확보",
        "Finance 및 Todo 데이터가 합류할 단일 캘린더 엔트리 포인트 생성",
        "복잡한 App Router 기능 없이 유지 가능한 단순 구조 유지",
      ]}
    />
  );
}
