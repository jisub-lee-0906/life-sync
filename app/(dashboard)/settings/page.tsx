import { ShieldCheck, Upload, UserCog, WalletCards } from "lucide-react";
import { SectionCard } from "@/components/dashboard/section-card";
import { ScreenIntro } from "@/components/dashboard/screen-intro";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <ScreenIntro
        eyebrow="Settings & Admin"
        title="운영 설정, 데이터 이관, 사용자 승인을 한 곳에서 관리합니다"
        description="관리자 전용 승인 플로우와 CSV Import/Export, 아이콘 설정이 연결될 준비 화면입니다."
      />
      <section className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="가입 승인 관리"
          description="PENDING 사용자를 APPROVED로 전환하는 관리자 화면의 진입점입니다."
          icon={ShieldCheck}
          accent="primary"
        />
        <SectionCard
          title="CSV Import / Export"
          description="기존 엑셀 데이터를 CSV로 업로드하고 전체 데이터 백업을 내보냅니다."
          icon={Upload}
          accent="mint"
        />
        <SectionCard
          title="아이콘 커스텀"
          description="일정, 할 일 등 기본 이모지를 사용자 설정과 연결할 영역입니다."
          icon={WalletCards}
          accent="amber"
        />
        <SectionCard
          title="유저 및 권한 정보"
          description="ADMIN / USER 상태와 승인 흐름이 노출될 정보 카드 자리입니다."
          icon={UserCog}
          accent="blue"
        />
      </section>
    </div>
  );
}
