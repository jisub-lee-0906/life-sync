import { CheckCheck, SlidersHorizontal, Sparkles } from "lucide-react";
import { SectionCard } from "@/components/dashboard/section-card";
import { ScreenIntro } from "@/components/dashboard/screen-intro";

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <ScreenIntro
        eyebrow="Todo & Routine"
        title="루틴 체크와 할 일 진행률을 매끄럽게 기록합니다"
        description="주간 루틴 보드와 터치 가능한 진행률 슬라이더가 한 화면에서 이어지는 구조입니다."
      />
      <section className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="루틴 트래커"
          description="월요일부터 일요일까지 가로형 체크리스트가 고정됩니다."
          icon={CheckCheck}
          accent="mint"
        >
          <div className="grid gap-3 md:grid-cols-7">
            {["월", "화", "수", "목", "금", "토", "일"].map((day) => (
              <div
                key={day}
                className="rounded-[1.35rem] border border-white/70 bg-white/80 px-4 py-5 text-center"
              >
                <p className="text-xs text-muted-foreground">{day}</p>
                <div className="mx-auto mt-3 h-10 w-10 rounded-2xl bg-secondary" />
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard
          title="진행률 슬라이더"
          description="엑셀의 0.8 입력을 0~100% 슬라이더 인터랙션으로 전환할 예정입니다."
          icon={SlidersHorizontal}
          accent="amber"
        >
          <div className="space-y-4">
            {["프로젝트 문서 정리", "주간 루틴 회고", "세금 분류 점검"].map((item) => (
              <div
                key={item}
                className="rounded-[1.35rem] border border-white/70 bg-white/80 p-4"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item}</span>
                  <span className="text-muted-foreground">80%</span>
                </div>
                <div className="mt-4 h-3 rounded-full bg-secondary">
                  <div className="h-3 w-4/5 rounded-full bg-primary" />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
      <SectionCard
        title="애니메이션 피드백 구역"
        description="완료 처리, 체크 애니메이션, 상태 변화를 이 카드 계열 패턴에 맞춰 연결합니다."
        icon={Sparkles}
        accent="blue"
        compact
      />
    </div>
  );
}
