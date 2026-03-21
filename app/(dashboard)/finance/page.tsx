import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock3,
  ReceiptText,
} from "lucide-react";
import { SectionCard } from "@/components/dashboard/section-card";
import { ScreenIntro } from "@/components/dashboard/screen-intro";

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <ScreenIntro
        eyebrow="Finance Dashboard"
        title="이번 달 총 지출은 1,250,000원이에요"
        description="헤드라인 요약, 1초 퀵 에딧, 반복 결제 자동화가 이 화면을 중심으로 연결됩니다."
      />
      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          title="Quick Add 슬롯"
          description="Step 4에서 Zod + react-hook-form 기반 인라인 입력 폼을 연결합니다."
          icon={ReceiptText}
          accent="primary"
        >
          <div className="grid gap-3 rounded-[1.5rem] border border-dashed border-primary/25 bg-primary/5 p-4 md:grid-cols-4">
            {["유형", "금액", "카테고리", "메모"].map((field) => (
              <div
                key={field}
                className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-muted-foreground"
              >
                {field}
              </div>
            ))}
          </div>
        </SectionCard>
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <SectionCard
            title="수입/지출 흐름"
            description="월별 요약 카드 자리"
            icon={ArrowUpRight}
            accent="mint"
            compact
          />
          <SectionCard
            title="반복 내역 자동화"
            description="Cron과 recurring transaction이 연결될 영역"
            icon={Clock3}
            accent="amber"
            compact
          />
          <SectionCard
            title="이번 주 소비 톤"
            description="카테고리 분석과 도넛 차트 연결 예정"
            icon={ArrowDownLeft}
            accent="blue"
            compact
          />
        </div>
      </section>
      <SectionCard
        title="무한 스크롤 거래 리스트"
        description="Step 4에서 Server Actions 기반 CRUD와 20개 단위 페이지네이션을 여기에 붙입니다."
        icon={ReceiptText}
      >
        <div className="grid gap-3">
          {["오늘", "어제", "이번 주 초반"].map((label, index) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-[1.4rem] border border-white/70 bg-white/80 px-4 py-4"
            >
              <div>
                <p className="text-sm font-medium">{label} 거래 묶음 #{index + 1}</p>
                <p className="text-sm text-muted-foreground">
                  실제 트랜잭션 데이터가 연결되기 전 자리입니다.
                </p>
              </div>
              <div className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                20개 로드 예정
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
