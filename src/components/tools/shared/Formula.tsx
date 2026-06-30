interface FormulaProps {
  children: React.ReactNode;
}

/** A monospaced formula block — same notation as the in-tool breakdown. */
export function Formula({ children }: FormulaProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-muted px-4 py-3 font-mono text-sm text-foreground">
      {children}
    </div>
  );
}
