import { Badge } from "@/components/ui/badge";

type ScreenIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function ScreenIntro({
  eyebrow,
  title,
  description,
}: ScreenIntroProps) {
  return (
    <section className="bg-lifesync-hero shadow-lifesync rounded-[2rem] border border-white/80 p-6 sm:p-8">
      <Badge className="rounded-full bg-white/85 px-3 py-1 text-[11px] tracking-[0.18em] text-primary uppercase hover:bg-white/85">
        {eyebrow}
      </Badge>
      <div className="mt-4 max-w-3xl">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
    </section>
  );
}
