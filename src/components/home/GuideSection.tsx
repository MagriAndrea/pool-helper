import { useTranslations } from 'next-intl';
import { ReactNode } from 'react';

interface Subsection {
  titleKey: string;
  paragraphKeys: string[];
}

interface FormulaRow {
  labelKey: string;
  formulaKey: string;
}

interface FormulasBlock {
  titleKey: string;
  descriptionKey?: string;
  parameterHeaderKey: string;
  formulaHeaderKey: string;
  rows: FormulaRow[];
}

interface GuideSectionProps {
  id: string;
  titleKey: string;
  introKey: string;
  subsections: Subsection[];
  formulas?: FormulasBlock;
  icon?: ReactNode;
}

export default function GuideSection({
  id,
  titleKey,
  introKey,
  subsections,
  formulas,
  icon,
}: GuideSectionProps) {
  const t = useTranslations('Guide');

  return (
    <section
      id={id}
      className="guide-anchor w-full max-w-3xl mx-auto px-4 py-16 md:py-24 space-y-10"
    >
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="bg-primary/10 text-primary p-2 rounded-lg">
              {icon}
            </div>
          )}
          <h2 className="text-3xl md:text-4xl font-bold text-foreground font-mono tracking-tight">
            {t(titleKey)}
          </h2>
        </div>
        <p className="text-lg text-muted-foreground leading-relaxed">
          {t(introKey)}
        </p>
      </header>

      <div className="space-y-8">
        {subsections.map((sub) => (
          <article key={sub.titleKey} className="space-y-3">
            <h3 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">
              {t(sub.titleKey)}
            </h3>
            <div className="space-y-3 text-foreground/90 leading-relaxed">
              {sub.paragraphKeys.map((key) => (
                <p key={key}>{t(key)}</p>
              ))}
            </div>
          </article>
        ))}
      </div>

      {formulas && (
        <aside className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-6 md:p-8">
          <div className="space-y-1">
            <h3 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">
              {t(formulas.titleKey)}
            </h3>
            {formulas.descriptionKey && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(formulas.descriptionKey)}
              </p>
            )}
          </div>
          <div className="overflow-hidden rounded-xl border border-border/60 bg-background/70">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t(formulas.parameterHeaderKey)}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {t(formulas.formulaHeaderKey)}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {formulas.rows.map((row) => (
                  <tr key={row.labelKey} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {t(row.labelKey)}
                    </td>
                    <td className="px-4 py-3 font-mono text-foreground/90">
                      {t(row.formulaKey)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </aside>
      )}
    </section>
  );
}
