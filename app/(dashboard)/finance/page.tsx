import { SectionLanding } from "@/components/section-landing";

export default function FinancePage() {
  return (
    <SectionLanding
      eyebrow="Finance Dashboard"
      title="이번 달 총 지출과 퀵 입력 흐름을 한 화면에서 다룰 준비를 마쳤습니다."
      description="Step 1에서는 App Shell과 라우트만 고정했습니다. Step 4에서 Quick Add 폼, 무한 스크롤, CSV 이관, 반복 결제 자동화를 이 영역에 연결합니다."
      highlights={[
        "헤드라인 요약 문장과 Quick Add 슬롯 위치 확보",
        "지출/수입 리스트와 필터 바가 들어갈 컨텐츠 그리드 준비",
        "PWA 진입 기준으로 모바일 우선 레이아웃 폭 검증 가능",
      ]}
    />
  );
}
