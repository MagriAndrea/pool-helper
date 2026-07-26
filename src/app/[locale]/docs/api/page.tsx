import { useTranslations } from 'next-intl';
import { API_ENDPOINTS, endpointPath } from '@/lib/api/openapi';
import { InfoSection } from '@/components/tools/shared/InfoSection';

const OPENAPI_URL = '/api/v1/openapi.json';

/** Pretty-printed JSON in the same monospaced style as the tools' formulas. */
function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-border bg-muted px-4 py-3 font-mono text-xs leading-relaxed text-foreground">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function ApiDocsPage() {
  const t = useTranslations('ApiDocs');

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{t('title')}</h1>
        <p className="text-lg text-muted-foreground">{t('subtitle')}</p>
      </header>

      <div className="space-y-8">
        <InfoSection title={t('specTitle')}>
          <p>{t('intro')}</p>
          <p>{t('specIntro')}</p>
          <p>
            <a
              href={OPENAPI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              {t('specLink')}
            </a>
          </p>
        </InfoSection>

        <InfoSection title={t('endpointsTitle')}>
          <div className="space-y-10">
            {API_ENDPOINTS.map((endpoint) => (
              <article key={endpoint.slug} className="space-y-3">
                <h3 className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold uppercase text-primary">
                    post
                  </span>
                  <code className="font-mono text-sm text-foreground">{endpointPath(endpoint)}</code>
                </h3>
                <p className="font-medium text-foreground">{endpoint.summary}</p>
                <p>{endpoint.description}</p>

                <div className="space-y-2">
                  <h4 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    {t('requestTitle')}
                  </h4>
                  <JsonBlock value={endpoint.requestExample} />
                </div>

                <div className="space-y-2">
                  <h4 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    {t('responseTitle')}
                  </h4>
                  <p>{endpoint.responseDescription}</p>
                  <JsonBlock value={endpoint.responseExample} />
                </div>
              </article>
            ))}
          </div>
        </InfoSection>

        <InfoSection title={t('errorsTitle')}>
          <p>{t('errorsIntro')}</p>
          <JsonBlock
            value={{
              error: 'Invalid request body',
              details: { formErrors: [], fieldErrors: { 'volume.value': ['Too small: expected number to be >0'] } },
            }}
          />
        </InfoSection>
      </div>
    </div>
  );
}
