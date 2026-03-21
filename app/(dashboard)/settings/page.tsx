import { SectionLanding } from "@/components/section-landing";

export default function SettingsPage() {
  return (
    <SectionLanding
      eyebrow="Settings & Admin"
      title="환경설정, 승인 관리, 데이터 이관 기능이 모일 관리 공간을 확보했습니다."
      description="Step 1에서는 관리자 페이지를 열 수 있는 진입점만 만듭니다. 실제 승인 플로우와 CSV 입출력은 이후 단계에서 추가합니다."
      highlights={[
        "아이콘 커스터마이징과 사용자 승인 패널이 들어갈 레이아웃 분리",
        "데이터 Import/Export와 보안 설정을 같은 관리 컨텍스트로 고정",
        "추후 Auth.js 및 승인제 미들웨어와 연결될 관리자 엔트리 확보",
      ]}
    />
  );
}
