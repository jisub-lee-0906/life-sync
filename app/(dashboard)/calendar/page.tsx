import { CalendarDays, HandCoins, ListChecks } from "lucide-react";
import { SectionCard } from "@/components/dashboard/section-card";
import { ScreenIntro } from "@/components/dashboard/screen-intro";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <ScreenIntro
        eyebrow="Life Calendar"
        title="오늘 쓴 돈과 오늘 한 일을 한 화면에서 겹쳐봅니다"
        description="날짜, 일정 아이콘, 재무 합계를 같은 셀에서 확인하는 통합 캘린더의 골격입니다."
      />
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="월간 캘린더 보드"
          description="Finance와 Task 이벤트가 같은 날짜 셀에 매핑될 예정입니다."
          icon={CalendarDays}
          accent="blue"
        >
          <div className="grid grid-cols-7 gap-2 text-xs text-muted-foreground">
            {["월", "화", "수", "목", "금", "토", "일"].map((day) => (
              <div key={day} className="px-2 pb-1 pt-2 text-center font-medium">
                {day}
              </div>
            ))}
            {Array.from({ length: 35 }).map((_, index) => (
              <div
                key={index}
                className="min-h-24 rounded-2xl border border-white/70 bg-white/80 p-3"
              >
                <div className="mb-3 text-sm font-medium text-foreground/80">
                  {index + 1}
                </div>
                <div className="space-y-2">
                  <div className="h-2 rounded-full bg-secondary" />
                  <div className="h-2 w-2/3 rounded-full bg-primary/20" />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
        <div className="grid gap-4">
          <SectionCard
            title="상세 Drawer 자리"
            description="날짜 클릭 시 우측 슬라이드 패널로 일정과 재무 상세가 노출됩니다."
            icon={ListChecks}
            accent="primary"
          />
          <SectionCard
            title="일별 합계 요약"
            description="수입, 지출, 완료 태스크 수를 날짜 기준으로 교차 표시합니다."
            icon={HandCoins}
            accent="mint"
          />
        </div>
      </section>
    </div>
  );
}
