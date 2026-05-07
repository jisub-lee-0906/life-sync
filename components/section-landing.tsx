import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SectionLandingProps = {
  description: string;
  eyebrow: string;
  highlights: string[];
  title: string;
};

export function SectionLanding({
  description,
  eyebrow,
  highlights,
  title,
}: SectionLandingProps) {
  return (
    <div className="space-y-6">
      <Card className="glass-panel border-white/70 py-0">
        <CardHeader className="gap-3 border-b border-border/60 py-6">
          <Badge variant="outline" className="w-fit">
            {eyebrow}
          </Badge>
          <div className="space-y-3">
            <CardTitle className="font-heading text-3xl leading-tight sm:text-4xl">
              {title}
            </CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7 text-foreground/70">
              {description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 py-6 lg:grid-cols-3">
          {highlights.map((highlight, index) => (
            <div
              key={highlight}
              className="rounded-3xl border border-border/70 bg-background/70 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Block 0{index + 1}
              </p>
              <p className="mt-3 text-sm leading-7 text-foreground/80">{highlight}</p>
            </div>
          ))}
        </CardContent>
        <CardFooter className="justify-between border-border/60 bg-muted/40 text-sm text-muted-foreground">
          <span>Step 1 skeleton only</span>
          <span>Feature logic will be added in later steps.</span>
        </CardFooter>
      </Card>
    </div>
  );
}
