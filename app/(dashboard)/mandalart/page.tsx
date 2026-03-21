import { Focus, Grid3X3, ZoomIn } from "lucide-react";
import { SectionCard } from "@/components/dashboard/section-card";
import { ScreenIntro } from "@/components/dashboard/screen-intro";

export default function MandalartPage() {
  return (
    <div className="space-y-6">
      <ScreenIntro
        eyebrow="Mandalart Vision"
        title="핵심 목표를 중심으로 3x3 드릴다운 구조를 설계합니다"
        description="중앙 목표에서 하위 실행 계획으로 확대되는 인터랙티브 보드의 기본 형태입니다."
      />
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="3x3 인터랙티브 보드"
          description="가운데 코어 목표를 기준으로 주변 8개 확장 목표가 배치됩니다."
          icon={Grid3X3}
          accent="primary"
        >
          <div className="grid aspect-square max-w-2xl gap-3 md:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => {
              const isCenter = index === 4;

              return (
                <div
                  key={index}
                  className={`flex items-center justify-center rounded-[1.6rem] border px-4 py-6 text-center text-sm ${
                    isCenter
                      ? "border-primary/20 bg-primary/10 font-semibold text-primary"
                      : "border-white/70 bg-white/85 text-muted-foreground"
                  }`}
                >
                  {isCenter ? "핵심 목표" : `세부 목표 ${index + 1}`}
                </div>
              );
            })}
          </div>
        </SectionCard>
        <div className="grid gap-4">
          <SectionCard
            title="줌인 드릴다운"
            description="세부 목표를 선택하면 하위 8개 실행 방안 보드가 부드럽게 열립니다."
            icon={ZoomIn}
            accent="blue"
          />
          <SectionCard
            title="목표 집중도"
            description="핵심 목표와 실행 목표의 연결 상태를 시각적으로 요약하는 자리입니다."
            icon={Focus}
            accent="amber"
          />
        </div>
      </section>
    </div>
  );
}
