import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function LandingPage() {
  const t = useTranslations("landing");
  const nav = useTranslations("nav");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight">ProcrastiMate</span>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            {nav("login")}
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium px-4 py-2 rounded-full bg-gradient-to-r from-purple-start to-purple-end text-white hover:opacity-90 transition-opacity"
          >
            {nav("register")}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-12 pb-24">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-6xl sm:text-7xl font-black tracking-tight leading-none mb-4">
            {t("hero.title")}
          </h1>
          <p className="text-xl sm:text-2xl font-medium text-muted mb-6">
            {t("hero.subtitle")}
          </p>
          <p className="text-base text-muted max-w-lg mx-auto mb-10 leading-relaxed">
            {t("hero.description")}
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 rounded-full bg-gradient-to-r from-purple-start to-purple-end text-white font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg shadow-purple-start/25"
          >
            {t("hero.cta")}
          </Link>
        </div>
      </section>

      {/* Why Us */}
      <section className="w-full max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-center mb-12">
          {t("whyUs.title")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(["card1", "card2", "card3"] as const).map((key) => (
            <div
              key={key}
              className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-bold mb-3">
                {t(`whyUs.${key}.title`)}
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                {t(`whyUs.${key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-border py-8 text-center text-sm text-muted">
        {t("footer.copy")}
      </footer>
    </div>
  );
}
