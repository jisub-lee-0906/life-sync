import { SectionLanding } from "@/components/section-landing";

export default function TodoRoutinePage() {
  return (
    <SectionLanding
      eyebrow="Todo & Routine"
      title="할 일 보드와 루틴 체크 트래커를 위한 상단 고정 영역을 확보했습니다."
      description="다음 단계에서 진행률 슬라이더, 자동 완료 처리, 요일별 루틴 체크 UI를 이 탭에 연결하면 됩니다."
      highlights={[
        "루틴 체크 헤더와 할 일 리스트를 나눌 2단 레이아웃 가정",
        "슬라이더 기반 진행률 UX를 넣어도 무너지지 않는 카드 구조",
        "향후 Zustand 동기화를 위한 클라이언트 셸 분리 준비",
      ]}
    />
  );
}
