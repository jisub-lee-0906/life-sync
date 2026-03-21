import { SectionLanding } from "@/components/section-landing";

export default function SettingsPage() {
  return (
    <SectionLanding
      eyebrow="Settings & Admin"
      title="환경설정, 승인 관리, 데이터 이관 기능이 모일 관리 공간을 확보했습니다."
      description="이제 Settings 탭 아래에 관리자 승인 페이지(`/settings/admin`)가 추가됩니다. CSV 입출력과 세부 환경설정은 이후 단계에서 이어서 붙입니다."
      highlights={[
        "아이콘 커스터마이징과 사용자 승인 패널이 들어갈 레이아웃 분리",
        "데이터 Import/Export와 보안 설정을 같은 관리 컨텍스트로 고정",
        "Auth.js 승인제와 연결될 관리자 엔트리 `/settings/admin` 확보",
      ]}
    />
  );
}
