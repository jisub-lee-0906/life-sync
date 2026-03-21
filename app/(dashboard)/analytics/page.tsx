import { ChartPie, RefreshCcw, TrendingUp } from "lucide-react";
import { SectionCard } from "@/components/dashboard/section-card";
import { ScreenIntro } from "@/components/dashboard/screen-intro";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <ScreenIntro
        eyebrow="Auto-Pivot Analytics"
        title="지출 비율과 할 일 달성률을 즉시 해석 가능한 형태로 묶습니다"
        description="가계부와 플래너 데이터를 실시간 애니메이션으로 연결할 통합 통계 화면입니다."
      />
      <section className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="지출 도넛 차트 자리"
          description="카테고리별 소비 비율이 들어갈 시각화 슬롯입니다."
          icon={ChartPie}
          accent="blue"
        >
          <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-full border-[20px] border-primary/20 border-t-primary bg-white">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">차트 중심</p>
              <p className="font-heading text-2xl font-semibold">68%</p>
            </div>
          </div>
        </SectionCard>
        <SectionCard
          title="달성률 트렌드"
          description="루틴, 태스크, 재무 흐름을 비교하는 추세 카드입니다."
          icon={TrendingUp}
          accent="mint"
          compact
        />
        <SectionCard
          title="실시간 갱신 슬롯"
          description="입력 직후 통계가 애니메이션으로 갱신될 영역입니다."
          icon={RefreshCcw}
          accent="amber"
          compact
        />
      </section>
    </div>
  );
}
