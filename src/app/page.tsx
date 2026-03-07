import Image from "next/image";
import {
  Target,
  Smartphone,
  Trophy,
  ChevronRight,
  LayoutGrid,
  TrendingDown,
  BatteryLow,
  CircleOff,
  Crosshair,
  Ruler,
  CircleDot,
  Flame,
  Wind,
  Shovel,
  Zap,
  Gamepad2,
  Heart,
  Medal,
  Radar,
  Users,
  BarChart3,
  Award,
  Check,
  Minus,
  Apple,
  Play,
  ArrowRight,
  Sparkles,
  Download,
  Star,
  Shield,
  Clock,
  Layers,
} from "lucide-react";
import Navbar from "@/components/Navbar";

/* ---- Reusable ---- */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-accent text-[11px] font-semibold uppercase tracking-[0.2em] mb-5">
      <span className="w-8 h-px bg-accent/40" />
      {children}
      <span className="w-8 h-px bg-accent/40" />
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-semibold text-white leading-snug tracking-tight">
      {children}
    </h2>
  );
}

export default function Home() {
  return (
    <main className="relative z-10 min-h-screen overflow-x-hidden">
      <Navbar />

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-[70svh] sm:min-h-[100svh] flex items-end sm:items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/coolgolf.png"
            alt="Cool Golf Method"
            fill
            priority
            className="object-cover object-right sm:object-center"
          />
          {/* Overlay: lighter on mobile to show more image */}
          <div className="absolute inset-0 bg-dark/50 sm:bg-transparent" />
          <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-dark/95 via-dark/70 to-dark/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/60 sm:via-transparent to-dark/40" />
        </div>

        <div className="relative w-full max-w-6xl mx-auto px-5 sm:px-6 pt-28 pb-16 sm:py-32">
          <div className="flex justify-start">
            <div className="w-full lg:w-1/2 lg:pr-8">
              <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
                {[
                  { icon: <Layers className="w-3 h-3" />, label: "7 Modules" },
                  { icon: <Zap className="w-3 h-3" />, label: "Competition Live" },
                  { icon: <Gamepad2 className="w-3 h-3" />, label: "Gamifie" },
                ].map((t) => (
                  <span
                    key={t.label}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 rounded-md bg-white/[0.08] backdrop-blur-sm text-accent text-[10px] sm:text-[11px] font-semibold tracking-wide border border-white/[0.1]"
                  >
                    {t.icon} {t.label}
                  </span>
                ))}
              </div>

              <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-5xl md:text-6xl font-semibold text-white leading-[1.1] tracking-tight mb-5 sm:mb-6">
                Reinventez votre
                <br />
                <span className="gradient-text">entrainement de golf</span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed mb-8 sm:mb-10 max-w-lg">
                Bien plus qu&#39;une app. Une nouvelle forme de jeu independante
                du parcours. Progressez, defiez, competitez &#8212; depuis
                n&#39;importe quel practice.
              </p>

              <a
                href="#download"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-4 bg-accent text-dark font-semibold rounded-xl text-[13px] sm:text-sm btn-glow"
              >
                Commencer gratuitement
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bouncing golf ball */}
        <div className="absolute bottom-1 sm:bottom-4 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <Image
            src="/balle-de-golf.png"
            alt="Golf ball"
            width={36}
            height={36}
            className="drop-shadow-[0_4px_12px_rgba(52,211,153,0.3)]"
          />
        </div>
      </section>

      <div className="divider" />

      {/* ═══ LE CONSTAT ═══ */}
      <section className="py-16 sm:py-24 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <SectionLabel>Le constat</SectionLabel>
            <SectionTitle>Chacun s&#39;entraine a sa facon</SectionTitle>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <LayoutGrid className="w-5 h-5" />, title: "Pas de structure", desc: "Aucune methode progressive. Vous tapez 100 balles sans savoir si vous progressez.", accent: "text-accent bg-accent/[0.08]" },
              { icon: <TrendingDown className="w-5 h-5" />, title: "Aucun suivi", desc: "Pas de donnees, pas de stats, pas de memoire. Chaque session repart de zero.", accent: "text-accent bg-accent/[0.08]" },
              { icon: <BatteryLow className="w-5 h-5" />, title: "Motivation en berne", desc: "Seul au practice, pas de defi, pas de progression visible. L\u2019abandon guette.", accent: "text-accent bg-accent/[0.08]" },
              { icon: <CircleOff className="w-5 h-5" />, title: "Jeu limite au parcours", desc: "La competition existe uniquement sur le parcours. Le practice reste une corvee solitaire.", accent: "text-accent bg-accent/[0.08]" },
            ].map((c, i) => (
              <div key={i} className="card rounded-2xl p-6">
                <div className={`icon-box w-11 h-11 mb-5 ${c.accent}`}>{c.icon}</div>
                <h3 className="text-[15px] font-semibold text-white mb-2">{c.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ═══ LA SOLUTION ═══ */}
      <section id="solution" className="py-16 sm:py-24 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-5">
            <SectionLabel><Sparkles className="w-3.5 h-3.5" /> La solution</SectionLabel>
            <SectionTitle>Trois piliers. Un jeu complet.</SectionTitle>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto text-[15px] leading-relaxed">
              Cool Golf Method transforme chaque session de practice en une
              experience structuree, mesuree et competitive.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mt-14">
            {[
              { img: "/method.png", title: "Methode", desc: "7 modules couvrant tout le jeu court et long. 4 modes de jeu. 5 niveaux calibres par handicap. Progressez avec structure." },
              { img: "/Technologie.png", title: "Technologie", desc: "Saisie par swipe sur l\u2019ecran, commande vocale optionnelle, GPS auto, session chronometree. Zero friction, tout au doigt." },
              { img: "/competition.png", title: "Competition", desc: "Concours en direct entre practices. Inter-clubs multi-sites. Classements live. Le practice devient un stade virtuel." },
            ].map((p, i) => (
              <div key={i} className="card-premium rounded-2xl overflow-hidden group flex flex-col">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={p.img}
                    alt={p.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-light/80 via-transparent to-transparent" />
                </div>
                <div className="p-6 flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{p.title}</h3>
                  <p className="text-[14px] text-gray-500 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <blockquote className="mt-16 text-center text-base md:text-lg text-gray-400 italic max-w-xl mx-auto font-[family-name:var(--font-playfair)]">
            &#8220;Bien plus qu&#39;une app. Une nouvelle forme de jeu, independante du parcours.&#8221;
          </blockquote>
        </div>
      </section>

      <div className="divider" />

      {/* ═══ 7 MODULES ═══ */}
      <section id="modules" className="py-16 sm:py-24 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <SectionLabel>7 modules</SectionLabel>
            <SectionTitle>Tout le golf. Dans votre poche.</SectionTitle>
            <p className="text-gray-500 mt-4 max-w-lg mx-auto text-[15px] leading-relaxed">
              Du putting d&#39;1 metre au drive de 200m+. Chaque compartiment du
              jeu a son module dedie.
            </p>
          </div>

          {/* Row 1 : 4 cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {[
              { num: "01", icon: <Crosshair className="w-5 h-5" />, title: "Putting court", desc: "Precision pure, le trou pour cible", range: "1 \u2013 5m" },
              { num: "02", icon: <Target className="w-5 h-5" />, title: "Putting long", desc: "Zone de 1,20m, controle distance", range: "6 \u2013 16m" },
              { num: "03", icon: <CircleDot className="w-5 h-5" />, title: "Approches roulees", desc: "Chips autour du green", range: "12 \u2013 24m" },
              { num: "04", icon: <Flame className="w-5 h-5" />, title: "Approches levees", desc: "Pitch shots, toucher de balle", range: "10 \u2013 25m" },
            ].map((m, i) => (
              <div key={i} className="card rounded-2xl p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="icon-box w-10 h-10 bg-accent/[0.07] text-accent">{m.icon}</div>
                  <span className="text-[11px] text-gray-600 font-mono">{m.num}</span>
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-1">{m.title}</h3>
                <p className="text-[13px] text-gray-500 mb-4 flex-1">{m.desc}</p>
                <div className="flex items-center gap-1.5">
                  <Ruler className="w-3 h-3 text-accent/50" />
                  <span className="text-[11px] text-accent font-semibold tracking-wide">{m.range}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Row 2 : 3 cards centrees */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { num: "05", icon: <Wind className="w-5 h-5" />, title: "Wedging", desc: "Coups de 40 a 80m, zone green", range: "40 \u2013 80m" },
              { num: "06", icon: <Shovel className="w-5 h-5" />, title: "Sortie de bunker", desc: "Sable vers green, precision sous pression", range: "10 \u2013 25m" },
              { num: "07", icon: <Zap className="w-5 h-5" />, title: "Driving", desc: "Couloir 40m, puissance + precision", range: "140 \u2013 200m+" },
            ].map((m, i) => (
              <div key={i} className="card rounded-2xl p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="icon-box w-10 h-10 bg-accent/[0.07] text-accent">{m.icon}</div>
                  <span className="text-[11px] text-gray-600 font-mono">{m.num}</span>
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-1">{m.title}</h3>
                <p className="text-[13px] text-gray-500 mb-4 flex-1">{m.desc}</p>
                <div className="flex items-center gap-1.5">
                  <Ruler className="w-3 h-3 text-accent/50" />
                  <span className="text-[11px] text-accent font-semibold tracking-wide">{m.range}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ═══ GAMIFICATION ═══ */}
      <section id="fonctionnalites" className="py-16 sm:py-24 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <SectionLabel><Gamepad2 className="w-3.5 h-3.5" /> Gamification</SectionLabel>
            <SectionTitle>Addictif. Par design.</SectionTitle>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto text-[15px] leading-relaxed">
              Chaque session est un defi. Chaque balle compte. Le systeme de
              vies, de budget et de badges transforme le practice en jeu video.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: <Gamepad2 className="w-6 h-6" />,
                color: "text-accent bg-accent/[0.08]",
                title: "4 modes de jeu",
                desc: "Points, Palier, Consecutif, Libre. Chaque mode change radicalement la pression et la strategie.",
                tags: ["Points", "Palier", "Consecutif", "Libre"],
                tagStyle: "bg-accent/[0.06] text-accent border-accent/10",
              },
              {
                icon: <Heart className="w-6 h-6" />,
                color: "text-accent bg-accent/[0.08]",
                title: "Systeme de vies",
                desc: "3 a 9 vies selon votre niveau. Budget de balles par distance. Rate le quota ? Vous perdez une vie. Defi bonus pour la recuperer.",
                tags: ["3\u20139 vies", "Defi bonus", "Bouclier"],
                tagStyle: "bg-white/[0.03] text-gray-400 border-white/[0.06]",
              },
              {
                icon: <Medal className="w-6 h-6" />,
                color: "text-accent bg-accent/[0.08]",
                title: "Badges & XP",
                desc: "48 badges a collectionner. Systeme d\u2019XP avec niveaux Bronze \u2192 Diamant. Streaks quotidiennes. Defis du jour.",
                tags: ["48 badges", "5 rangs XP", "Streaks"],
                tagStyle: "bg-white/[0.03] text-gray-400 border-white/[0.06]",
              },
              {
                icon: <Radar className="w-6 h-6" />,
                color: "text-accent bg-accent/[0.08]",
                title: "Radar & statistiques",
                desc: "Radar 7 axes de vos competences. Graphiques hebdo. Comparaison inter-semaines. Export CSV/PDF.",
                tags: ["Radar chart", "Historique", "Export"],
                tagStyle: "bg-white/[0.03] text-gray-400 border-white/[0.06]",
              },
            ].map((f, i) => (
              <div key={i} className="card rounded-2xl p-7">
                <div className={`icon-box w-12 h-12 mb-5 ${f.color}`}>{f.icon}</div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed mb-5">{f.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {f.tags.map((t) => (
                    <span key={t} className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium border ${f.tagStyle}`}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ═══ ESPACE PRO ═══ */}
      <section className="py-16 sm:py-24 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <SectionLabel>Espace Pro</SectionLabel>
            <SectionTitle>L&#39;outil des enseignants.</SectionTitle>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto text-[15px] leading-relaxed">
              Lancez des exercices simultanes, projetez le classement en direct,
              suivez la progression de chaque eleve.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: <Users className="w-6 h-6" />, title: "Cours collectif live", desc: "Lancez un exercice pour toute la classe. Classement live projete sur grand ecran. Chaque eleve joue sur son telephone." },
              { icon: <BarChart3 className="w-6 h-6" />, title: "Suivi differencie", desc: "Chaque eleve a son niveau, ses stats, sa progression. Prescrivez des exercices personnalises entre les cours." },
              { icon: <Award className="w-6 h-6" />, title: "Concours de classe", desc: "Organisez des competitions intra-classe ou inter-groupes. Motivez par le defi collectif." },
            ].map((item, i) => (
              <div key={i} className="card-premium rounded-2xl p-6 sm:p-8 text-center">
                <div className="icon-box w-14 h-14 bg-accent/[0.07] text-accent mx-auto mb-6">{item.icon}</div>
                <h3 className="text-base font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-[14px] text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ═══ TARIFS ═══ */}
      <section id="tarifs" className="py-16 sm:py-24 md:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <SectionLabel>Tarifs</SectionLabel>
            <SectionTitle>Un plan pour chaque joueur.</SectionTitle>
            <p className="text-gray-500 mt-4 max-w-lg mx-auto text-[15px] leading-relaxed">
              Commencez gratuitement. Passez a Premium quand l&#39;addiction prend.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 items-start">
            {/* Gratuit */}
            <div className="card rounded-2xl p-7">
              <p className="text-[13px] text-gray-500 font-medium">Gratuit</p>
              <div className="mt-3 mb-1">
                <span className="text-4xl font-bold text-white tracking-tight">0&#8364;</span>
              </div>
              <p className="text-[13px] text-gray-600 mb-7">Pour toujours</p>
              <div className="space-y-3 mb-8">
                {[
                  { ok: true, t: "2 modules (Putting court + Driving)" },
                  { ok: true, t: "Mode Points uniquement" },
                  { ok: true, t: "Statistiques de base" },
                  { ok: true, t: "1 defi du jour" },
                  { ok: false, t: "Concours" },
                  { ok: false, t: "Badges & XP complets" },
                ].map((r, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    {r.ok
                      ? <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                      : <Minus className="w-4 h-4 text-gray-700 mt-0.5 shrink-0" />}
                    <span className={`text-[13px] ${r.ok ? "text-gray-400" : "text-gray-600"}`}>{r.t}</span>
                  </div>
                ))}
              </div>
              <a href="#download" className="block w-full py-2.5 text-center rounded-lg border border-white/[0.08] text-[13px] font-semibold text-gray-300 hover:bg-white/[0.03] transition-colors">
                Demarrer gratuitement
              </a>
            </div>

            {/* Premium */}
            <div className="pricing-popular rounded-2xl p-7 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-0.5 bg-accent text-dark text-[10px] font-bold rounded-md uppercase tracking-wider">
                  Populaire
                </span>
              </div>
              <p className="text-[13px] text-accent font-medium">Premium</p>
              <div className="mt-3 mb-1 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white tracking-tight">9,99&#8364;</span>
                <span className="text-[13px] text-gray-500">/mois</span>
              </div>
              <p className="text-[13px] text-gray-600 mb-7">ou 89,99&#8364;/an</p>
              <div className="space-y-3 mb-8">
                {[
                  "7 modules complets",
                  "4 modes de jeu",
                  "Statistiques avancees + radar",
                  "Badges, XP, streaks, boucliers",
                  "Concours & inter-clubs",
                  "Export donnees CSV/PDF",
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                    <span className="text-[13px] text-gray-400">{t}</span>
                  </div>
                ))}
              </div>
              <a href="#download" className="block w-full py-2.5 text-center rounded-lg bg-accent text-dark text-[13px] font-bold hover:bg-accent-dark transition-colors btn-glow">
                Essai gratuit 14 jours
              </a>
            </div>

            {/* Pro */}
            <div className="card rounded-2xl p-7">
              <p className="text-[13px] text-gray-500 font-medium">Pro</p>
              <div className="mt-3 mb-1 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white tracking-tight">29,99&#8364;</span>
                <span className="text-[13px] text-gray-500">/mois</span>
              </div>
              <p className="text-[13px] text-gray-600 mb-7">Pour les enseignants</p>
              <div className="space-y-3 mb-8">
                {[
                  "Tout Premium inclus",
                  "Dashboard enseignant",
                  "Cours collectif live (12+ eleves)",
                  "Prescription d\u2019exercices",
                  "Creation de concours",
                  "Suivi progression eleves",
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                    <span className="text-[13px] text-gray-400">{t}</span>
                  </div>
                ))}
              </div>
              <a href="#" className="block w-full py-2.5 text-center rounded-lg border border-white/[0.08] text-[13px] font-semibold text-gray-300 hover:bg-white/[0.03] transition-colors">
                Contacter l&#39;equipe
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ═══ CTA ═══ */}
      <section id="download" className="py-16 sm:py-24 md:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <div className="relative rounded-2xl overflow-hidden p-7 sm:p-10 md:p-16 text-center card-premium">
            <div className="absolute top-0 right-0 w-72 h-72 bg-accent/[0.04] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
            <div className="relative">
              <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl md:text-4xl font-semibold text-white leading-snug tracking-tight">
                Pret a reinventer
                <br />
                <span className="gradient-text">votre entrainement ?</span>
              </h2>
              <p className="text-base text-gray-400 mt-4 mb-10 font-medium">
                Jouez. Progressez. Defiez.
              </p>

              <a
                href="#"
                className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-3.5 bg-accent text-dark font-semibold rounded-xl text-[13px] sm:text-sm btn-glow mb-8 sm:mb-10"
              >
                <Download className="w-4 h-4" />
                Telecharger gratuitement
              </a>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="#" className="inline-flex items-center gap-3 px-6 py-3 bg-white text-dark rounded-xl hover:bg-gray-100 transition-colors">
                  <Apple className="w-6 h-6" />
                  <div className="text-left">
                    <p className="text-[10px] text-gray-500 leading-none">Telecharger sur</p>
                    <p className="text-sm font-bold leading-tight">App Store</p>
                  </div>
                </a>
                <a href="#" className="inline-flex items-center gap-3 px-6 py-3 bg-white text-dark rounded-xl hover:bg-gray-100 transition-colors">
                  <Play className="w-6 h-6 fill-current" />
                  <div className="text-left">
                    <p className="text-[10px] text-gray-500 leading-none">Disponible sur</p>
                    <p className="text-sm font-bold leading-tight">Google Play</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-8 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <Image src="/logoGolfCool.png" alt="Cool Golf Method" width={20} height={20} className="rounded-sm" />
            <span className="text-[13px] font-medium text-gray-600">Cool Golf Method</span>
          </div>
          <p className="text-[12px] text-gray-700">
            &#169; 2026 Cool Golf Method &#8212; par H.DIS
          </p>
        </div>
      </footer>
    </main>
  );
}
