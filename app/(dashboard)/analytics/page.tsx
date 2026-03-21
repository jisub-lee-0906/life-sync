import { SectionLanding } from "@/components/section-landing";

export default function AnalyticsPage() {
  return (
    <SectionLanding
      eyebrow="Auto-Pivot Analytics"
      title="실시간 통계와 도넛 차트가 들어갈 분석 공간을 별도 탭으로 준비했습니다."
      description="Step 5에서 재무 카테고리 비중, 할 일 달성률, 루틴 진행률을 공통 상태와 연결해 이 탭에서 시각화합니다."
      highlights={[
        "카드형 통계 위젯과 차트 영역을 배치할 2열 그리드 준비",
        "가계부와 생산성 지표를 한 탭에서 비교할 수 있도록 분리",
        "애니메이션이 추가되어도 레이아웃이 안정적인 구조 유지",
      ]}
    />
  );
}
