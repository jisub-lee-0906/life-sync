import { SectionLanding } from "@/components/section-landing";

export default function MandalartPage() {
  return (
    <SectionLanding
      eyebrow="Mandalart Vision"
      title="3x3 목표 보드와 드릴다운 확대 흐름을 위한 독립 탭을 분리했습니다."
      description="Step 1에서는 줌 인터랙션 없이 목표 보드가 들어갈 레이아웃만 예약합니다. 이후 목표 관계형 데이터와 함께 구현하면 됩니다."
      highlights={[
        "중앙 목표와 주변 8개 목표를 담을 그리드 컨테이너 준비",
        "드릴다운 전환 시에도 유지 가능한 넉넉한 콘텐츠 폭 확보",
        "장기 목표 영역이 다른 생산성 탭과 섞이지 않도록 라우트 분리",
      ]}
    />
  );
}
