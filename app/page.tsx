import type { Metadata } from 'next';
import Link from 'next/link';
import {
  GitFork, AlignLeft, Lightbulb, Shield, Clock, Search, Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { WordCycler } from '@/components/ui/WordCycler';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { ProductPreview } from '@/components/marketing/ProductPreview';
import { MarketingFooter } from '@/components/layout/MarketingFooter';

export const metadata: Metadata = {
  title: 'ThesisMaps: Visual Research Intelligence for Graduate Researchers',
  description:
    'Map your literature, discover research gaps, and build your thesis with confidence. The visual research platform built for PhD and masters students.',
  alternates: { canonical: 'https://www.thesismaps.com' },
};

// schema.org SoftwareApplication markup for the landing page. `<` and `>` are
// escaped to their \u.... forms so a future dynamic value can never break out of
// the <script> block. (The previous version called .replace(/</g, '<'), which
// replaced the character with itself and therefore escaped nothing.)
const JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ThesisMaps',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  url: 'https://www.thesismaps.com',
  description: 'Visual Research Intelligence Platform for graduate-level thesis research.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
})
  .replace(/</g, '\\u003c')
  .replace(/>/g, '\\u003e');

const FEATURES = [
  {
    label: 'Knowledge Graph',
    preview: 'graph' as const,
    heading: 'See how your literature connects',
    body: 'Visualise citation networks, semantic similarity, and co-authorship links across hundreds of papers, all on a single interactive canvas.',
    icon: GitFork,
  },
  {
    label: 'Outline Builder',
    preview: 'outline' as const,
    heading: 'Structure your thesis with coverage scores',
    body: 'Drag papers into chapters, track coverage per section, and export a structured outline with citations to Word or PDF in one click.',
    icon: AlignLeft,
  },
  {
    label: 'Gap Detection',
    preview: 'gaps' as const,
    heading: 'Find what nobody has written yet',
    body: 'Our ML-powered gap analysis clusters your library, scores topics by research density, and surfaces the questions your field has left unanswered.',
    icon: Lightbulb,
  },
  {
    label: 'Defence Readiness',
    preview: 'defence' as const,
    heading: 'Prepare for the toughest questions',
    body: 'ThesisMaps surfaces counter-arguments, contradicting findings, and methodological critiques, then generates a defence checklist tailored to your thesis.',
    icon: Shield,
  },
];

const DIFFERENTIATORS = [
  { icon: Search, title: 'Multi-Source Search', description: 'Semantic Scholar, OpenAlex, arXiv, CrossRef, PubMed and more, unified in one search.' },
  { icon: GitFork, title: 'Research Debt Tracker', description: 'Never lose track of papers you saved but haven\'t read. Clear your backlog before writing.' },
  { icon: Clock, title: 'Literature Timeline', description: 'Visualise how your field evolved year by year to frame your contribution in historical context.' },
  { icon: Shield, title: 'Defence Readiness Mode', description: 'Turn threats into prepared answers before you walk into the viva room.' },
  { icon: Users, title: 'Collaboration', description: 'Invite supervisors and peers to annotate papers and comment on your outline in real time.' },
  { icon: Lightbulb, title: 'Methodological Fingerprint', description: 'Understand the methodological bias of your literature and identify gaps in approach.' },
];

const STAGES = ['Proposal', 'Lit Review', 'Methodology', 'Data', 'Analysis', 'Writing', 'Defence'];

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD }} />

      <MarketingHeader />

      <main>
        {/* Hero */}
        <section className="pt-32 md:pt-48 pb-16 md:pb-24 px-6 max-w-6xl mx-auto text-left relative" aria-labelledby="hero-heading">
          <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-40 mix-blend-multiply pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent"></div>
          <p className="text-[10px] md:text-sm font-sans font-bold uppercase tracking-[0.3em] text-accent mb-8 leading-none">Visual Research Intelligence</p>
          <h1 id="hero-heading" className="font-serif text-[clamp(2.5rem,8vw,5.5rem)] text-text-primary mb-8 md:mb-12 leading-[1.1] tracking-tight">
            The visual way to … <br className="hidden md:block" />
            {/* Lowercase + slightly smaller: the cycling phrase reads as a
                continuation of the line above, not a new sentence. */}
            <WordCycler
              words={['map your literature', 'find the gaps', 'write with confidence']}
              className="italic font-light text-text-muted text-[0.95em]"
            />
          </h1>
          <p className="max-w-2xl font-sans text-text-muted text-lg md:text-2xl leading-relaxed mb-12 md:mb-16">
            Built exclusively for MSc students, PhD candidates and researchers. Transform the painful process of literature reviews into an interactive, visual journey.
          </p>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" variant="primary" pill className="w-full sm:w-auto px-10 h-14 text-base tracking-widest bg-black text-white hover:bg-accent border-none shadow-impact">
                Start for free
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" pill className="w-full sm:w-auto px-10 h-14 text-base tracking-widest bg-white text-black border-2 border-black hover:bg-black hover:text-white shadow-impact">
                Sign in
              </Button>
            </Link>
          </div>

          {/* Live product preview: dark canvas, ambient drift, and draggable
              paper nodes — the same interaction the real graph offers. */}
          <div className="mt-12 md:mt-16 h-64 md:h-[26rem]">
            <ProductPreview kind="graph" animated interactive />
          </div>
        </section>

        {/* Thesis Stages */}
        <section id="how-it-works" className="py-16 border-y-2 border-black bg-white" aria-labelledby="stages-heading">
          <div className="max-w-6xl mx-auto px-6">
            <p id="stages-heading" className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-black text-center mb-8">Works across every thesis stage</p>
            {/* Grid rather than flex-wrap: flex sized each pill to its label, so
                "DATA" was half the width of "METHODOLOGY". A grid makes all seven
                identical at every breakpoint. Non-interactive by design, so no
                hover state (it also can't be reached on touch). */}
            <ol className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {STAGES.map((stage, i) => (
                <li
                  key={stage}
                  className="flex flex-col items-center justify-center gap-1 px-3 py-3 border-2 border-black bg-white font-sans text-center"
                >
                  <span className="text-accent text-[10px] font-bold">{(i + 1).toString().padStart(2, '0')}</span>
                  <span className="text-[11px] md:text-xs font-bold text-black leading-tight">{stage.toUpperCase()}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 md:py-32 max-w-6xl mx-auto px-6" aria-labelledby="features-heading">
          <h2 id="features-heading" className="sr-only">Features</h2>
          <div className="space-y-32 md:space-y-40">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              const reversed = i % 2 === 1;
              return (
                // `md:items-stretch` so the text and visual columns share one
                // height — `items-center` centred them against each other, and
                // because the four bodies differ in length the misalignment was
                // different in every row.
                <div
                  key={feature.label}
                  className={['flex flex-col md:flex-row md:items-stretch gap-10 md:gap-16', reversed ? 'md:flex-row-reverse' : ''].join(' ')}
                >
                  <div className="w-full md:flex-1 flex flex-col justify-center text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
                      <Icon size={20} strokeWidth={2} className="text-accent" aria-hidden />
                      <span className="text-[10px] md:text-sm font-sans font-bold uppercase tracking-[0.2em] text-accent">{feature.label}</span>
                    </div>
                    <h3 className="font-serif text-2xl md:text-display-sm text-text-primary leading-tight mb-6">{feature.heading}</h3>
                    <p className="font-sans text-text-muted text-base md:text-lg leading-relaxed">{feature.body}</p>
                  </div>
                  {/* `w-full md:flex-1`, never a bare `flex-1`: on mobile the row is
                      flex-col, where `flex-1` sets flex-basis:0 on the VERTICAL axis
                      and overrides the height — collapsing this box to a ~15px strip. */}
                  {/* Definite height, not min-h + items-center: the frame is
                      `h-full`, and min-height only sets a floor while
                      items-center sizes a flex child to its content — so the
                      dark box shrank to fit instead of filling. */}
                  <div className="w-full md:flex-1 h-56 md:h-80">
                    <ProductPreview kind={feature.preview} interactive />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Differentiators */}
        <section className="py-24 bg-white border-y-2 border-black" aria-labelledby="differentiators-heading">
          <div className="max-w-6xl mx-auto px-6">
            <h2 id="differentiators-heading" className="font-serif text-display-sm text-text-primary text-center mb-16">
              Built differently, for researchers
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t border-black">
              {DIFFERENTIATORS.map(({ icon: Icon, title, description }) => (
                <article key={title} className="p-8 border-r border-b border-black bg-white hover:bg-accent/[0.03] transition-colors group">
                  <Icon size={24} strokeWidth={2} className="text-black mb-6 group-hover:text-accent transition-colors" aria-hidden />
                  <h3 className="font-sans font-bold text-black text-lg mb-3 uppercase tracking-tight">{title}</h3>
                  <p className="font-sans text-text-muted text-sm leading-relaxed">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 text-center px-6 bg-black text-white relative overflow-hidden" aria-labelledby="cta-heading">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:30px_30px]"></div>
          <div className="relative z-10">
            <h2 id="cta-heading" className="font-serif text-display mb-8 max-w-4xl mx-auto">
              Start mapping your research today
            </h2>
            <p className="font-sans text-white/60 text-xl mb-12 max-w-xl mx-auto font-medium">
              Free to start. No credit card required. Built for the way researchers actually work.
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="bg-white text-black border-none hover:bg-accent hover:text-white">Create your free account</Button>
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </>
  );
}
