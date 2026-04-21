import { useTranslations } from 'next-intl';
import { FlaskConical, Droplets, ListChecks } from 'lucide-react';
import GuideSection from './GuideSection';

const CHEMISTRY_BASE = 'sections.chemistry';
const CLEANING_BASE = 'sections.cleaning';
const ACTIONS_BASE = 'sections.actions';

const chemistrySubsections = [
  { key: 'alkalinity', paragraphs: ['p1'] },
  { key: 'ph', paragraphs: ['p1', 'p2'] },
  { key: 'chlorine', paragraphs: ['p1'] },
  { key: 'chlorineStabilized', paragraphs: ['p1'] },
  { key: 'chlorineUnstabilized', paragraphs: ['p1', 'p2', 'p3'] },
  { key: 'chloramines', paragraphs: ['p1'] },
  { key: 'stabilizer', paragraphs: ['p1', 'p2'] },
  { key: 'hardness', paragraphs: ['p1', 'p2'] },
  { key: 'algaecide', paragraphs: ['p1'] },
  { key: 'flocculant', paragraphs: ['p1'] },
];

const cleaningSubsections = [
  { key: 'circulation', paragraphs: ['p1', 'p2'] },
  { key: 'debris', paragraphs: ['p1'] },
  { key: 'robot', paragraphs: ['p1'] },
];

const actionsSubsections = [
  { key: 'shock', paragraphs: ['p1', 'p2', 'p3'] },
  { key: 'filterCleaning', paragraphs: ['p1'] },
  { key: 'bottomCleaning', paragraphs: ['p1'] },
];

function buildSubsections(
  base: string,
  items: { key: string; paragraphs: string[] }[],
) {
  return items.map((item) => ({
    titleKey: `${base}.${item.key}.title`,
    paragraphKeys: item.paragraphs.map((p) => `${base}.${item.key}.${p}`),
  }));
}

export default function GuideScrolling() {
  const t = useTranslations('Guide');

  return (
    <div className="w-full border-t border-border/50 bg-muted/20">
      <header
        id="guide"
        className="guide-anchor w-full max-w-3xl mx-auto px-4 pt-16 md:pt-24 pb-8 text-center space-y-4"
      >
        <p className="text-sm uppercase tracking-widest text-primary font-semibold">
          {t('eyebrow')}
        </p>
        <h2 className="text-4xl md:text-5xl font-bold font-mono tracking-tight text-foreground">
          {t('title')}
        </h2>
        <p className="text-lg text-muted-foreground">
          {t('subtitle')}
        </p>
      </header>

      <GuideSection
        id="chemistry"
        titleKey={`${CHEMISTRY_BASE}.title`}
        introKey={`${CHEMISTRY_BASE}.intro`}
        subsections={buildSubsections(CHEMISTRY_BASE, chemistrySubsections)}
        icon={<FlaskConical className="h-6 w-6" />}
      />

      <GuideSection
        id="cleaning"
        titleKey={`${CLEANING_BASE}.title`}
        introKey={`${CLEANING_BASE}.intro`}
        subsections={buildSubsections(CLEANING_BASE, cleaningSubsections)}
        icon={<Droplets className="h-6 w-6" />}
      />

      <GuideSection
        id="actions"
        titleKey={`${ACTIONS_BASE}.title`}
        introKey={`${ACTIONS_BASE}.intro`}
        subsections={buildSubsections(ACTIONS_BASE, actionsSubsections)}
        formulas={{
          titleKey: `${ACTIONS_BASE}.formulas.title`,
          descriptionKey: `${ACTIONS_BASE}.formulas.description`,
          parameterHeaderKey: `${ACTIONS_BASE}.formulas.headers.parameter`,
          formulaHeaderKey: `${ACTIONS_BASE}.formulas.headers.formula`,
          rows: [
            {
              labelKey: `${ACTIONS_BASE}.formulas.total.label`,
              formulaKey: `${ACTIONS_BASE}.formulas.total.formula`,
            },
            {
              labelKey: `${ACTIONS_BASE}.formulas.free.label`,
              formulaKey: `${ACTIONS_BASE}.formulas.free.formula`,
            },
            {
              labelKey: `${ACTIONS_BASE}.formulas.combined.label`,
              formulaKey: `${ACTIONS_BASE}.formulas.combined.formula`,
            },
          ],
        }}
        icon={<ListChecks className="h-6 w-6" />}
      />
    </div>
  );
}
