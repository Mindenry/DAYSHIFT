import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getI18n } from "@/lib/i18n";
import { getInfoPage } from "@/lib/info-pages";

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const key = slug.join("/");
  const { locale } = await getI18n();
  const page = getInfoPage(key, locale);
  if (!page) return { title: "Not found", robots: { index: false } };
  return {
    title: page.title,
    description: page.intro,
    alternates: { canonical: `/${key}` },
    openGraph: {
      title: page.title,
      description: page.intro,
      type: "website",
      images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "DAYSHIFT" }],
    },
  };
}

export default async function InfoPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const key = slug.join("/");
  const { t, locale } = await getI18n();
  const page = getInfoPage(key, locale);
  if (!page) notFound();

  return (
    <article className="wrap py-12 md:py-20">
      <div className="max-w-3xl">
        <p className="overline text-muted">{page.eyebrow}</p>
        <h1 className="mt-3 font-display text-5xl leading-[0.98] md:text-7xl">{page.title}</h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-soft">{page.intro}</p>
      </div>
      <div className="mt-14 grid gap-12 lg:grid-cols-[0.6fr_1.4fr]">
        <div className="hidden lg:block">
          <div className="sticky top-28 border-t border-ink pt-4">
            <p className="overline text-muted">{t("On this page")}</p>
            <ul className="mt-4 space-y-2">
              {page.sections.map((section) => (
                <li key={section.heading} className="text-sm text-muted">{section.heading}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="max-w-2xl space-y-10">
          {page.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="border-b border-line pb-3 font-display text-3xl">{section.heading}</h2>
              <div className="mt-4 space-y-4">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-[15px] leading-relaxed text-ink-soft">{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
          {page.cta && (
            <Link href={page.cta.href} className="btn btn-primary">{page.cta.label}</Link>
          )}
          <p className="border-t border-line pt-6 text-xs text-muted">
            {t("Last reviewed November 2026. This content is part of a demonstration platform.")}
          </p>
        </div>
      </div>
    </article>
  );
}
