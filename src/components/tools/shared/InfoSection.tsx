interface InfoSectionProps {
  title: string;
  children: React.ReactNode;
}

/** A titled section of a tool info page. */
export function InfoSection({ title, children }: InfoSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-foreground/90 md:text-base">
        {children}
      </div>
    </section>
  );
}
