import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import {
  GitFork, AlignLeft, Lightbulb, Shield, Clock, Search, Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { WordCycler, TypingDots } from '@/components/ui/WordCycler';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { ProductPreview, GraphLegend } from '@/components/marketing/ProductPreview';
import { SmoothScroll } from '@/components/marketing/SmoothScroll';
import { Reveal, Entrance, Parallax, STAGGER } from '@/components/marketing/Reveal';
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
    preview: 'sources' as const,
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

/**
 * The hover state for anything that casts a hard shadow: rise 2px up and left
 * while the cast shadow lengthens from 4px to 7px.
 *
 * In a system with no blur, no gradient and no corner radius, a lengthening cast
 * shadow is the only honest way to express elevation. And because every element
 * that lifts does so on the shared curve at the shared 400ms tier, a button, a
 * stage pill and a card all feel like they have the same mass.
 */
const LIFT =
  'transition-[color,background-color,border-color,box-shadow,transform] duration-base ease-tm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-impact-lg';

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD }} />

      {/* Inertial scrolling, marketing routes only. Renders nothing. */}
      <SmoothScroll />

      <MarketingHeader />

      <main>
        {/* Hero */}
        {/**
          * Two boxes, deliberately: a full-bleed shell that owns the decoration
          * and positioning, and a clamped column inside it that owns the content.
          *
          * They used to be one element carrying `max-w-6xl mx-auto` AND
          * `relative` together, which meant every `absolute inset-0` decorative
          * layer resolved against the 1152px CONTENT box rather than the
          * viewport. On any screen wider than that, the background wash stopped
          * dead in a hard vertical seam at the column edge with pure white beyond
          * it, and the ambient circle was sliced off by the column's
          * overflow-hidden mid-page. Both looked like rendering faults rather
          * than decisions.
          *
          * Decoration must span the viewport; only text needs a measure. Now the
          * marks bleed off the true page edge, which reads as intentional.
          */}
        <section className="relative overflow-hidden" aria-labelledby="hero-heading">
          {/**
            * Ambient layer: two large, near-invisible marks drifting on long
            * out-of-phase loops, so the hero is never completely still even
            * before the reader touches anything.
            *
            * The point is not that these get noticed — at 5-7% opacity they do
            * not, individually. It is that a page with nothing moving on it reads
            * as a document, while a page where something is always very slightly
            * breathing reads as a surface that is running. Both marks are
            * decorative, so both are aria-hidden and inert, and both stop dead
            * under prefers-reduced-motion via the .animate-tm-float gate in
            * globals.css.
            *
            * No negative z-index anywhere: this layer is simply painted first and
            * the content column below is `relative`, so it stacks on top by
            * document order. `-z-10` worked only for as long as nothing in the
            * ancestry created a stacking context.
            */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute inset-0 opacity-40 mix-blend-multiply bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent" />
            {/**
              * Both marks are `xl:` only.
              *
              * Ambient decoration needs somewhere to live that is not on top of
              * the words. That space is the gutter outside the max-w-6xl column,
              * and it does not exist until the viewport exceeds roughly 1200px —
              * below that the column is the full width of the screen. On a phone
              * a 560px circle is wider than the viewport, so its arc swept
              * straight through the body copy, which is the opposite of ambient.
              *
              * Sized and offset so the arc crosses only the empty right-hand side
              * of the hero, never the headline, and exits through the viewport
              * edge rather than stopping in open space.
              */}
            <div
              className="hidden xl:block absolute -top-40 -right-48 w-[560px] h-[560px] rounded-full border-2 border-accent/[0.07] animate-tm-float"
              style={{ '--tm-dur': '17s', '--tm-float': '30px' } as CSSProperties}
            />
            <div
              className="hidden xl:block absolute top-[46%] -left-28 w-[360px] h-[360px] animate-tm-float bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:26px_26px] opacity-[0.05]"
              style={{ '--tm-dur': '23s', '--tm-float': '22px' } as CSSProperties}
            />
          </div>

          <div className="relative pt-28 md:pt-40 pb-16 md:pb-24 px-6 max-w-6xl mx-auto text-left">

          {/* Hero arrival, top down. Each element sits one STAGGER step behind
              the one above it, so the block assembles as a single downward
              gesture rather than as six things fading in at once. The graph's own
              internal entrance (EDGE_START / NODE_START in ProductPreview) is
              timed to pick up where this sequence ends. */}
          <Entrance as="p" delay={STAGGER} y={18} className="text-[10px] md:text-sm font-sans font-bold uppercase tracking-[0.3em] text-accent mb-5 leading-none">
            Visual Research Intelligence
          </Entrance>
          <Entrance delay={STAGGER * 2}>
            <h1 id="hero-heading" className="font-serif text-[clamp(2.5rem,8vw,5.5rem)] text-text-primary mb-6 leading-[1.1] tracking-tight">
              The visual way to <TypingDots className="text-accent" /> <br className="hidden md:block" />
              {/* Same family, size and weight as the roman line above; only the
                  colour differs. It previously differed on four axes at once
                  (italic, light, 0.95em, muted grey), which is what read as
                  several competing fonts in one headline. */}
              <WordCycler
                words={['map your literature', 'find the gaps', 'write with confidence']}
                className="text-accent"
              />
            </h1>
          </Entrance>
          <Entrance as="p" delay={STAGGER * 3} className="max-w-2xl font-sans text-text-muted text-lg md:text-xl leading-relaxed mb-8">
            Built exclusively for MSc students, PhD candidates and researchers. Transform the painful process of literature reviews into an interactive, visual journey.
          </Entrance>
          <Entrance delay={STAGGER * 4} className="flex flex-col sm:flex-row items-start gap-6">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" variant="primary" className={`w-full sm:w-auto px-10 h-14 text-base tracking-widest bg-black text-white hover:bg-accent border-none shadow-impact ${LIFT}`}>
                Start for free
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className={`w-full sm:w-auto px-10 h-14 text-base tracking-widest bg-white text-black border-2 border-black hover:bg-black hover:text-white shadow-impact ${LIFT}`}>
                Sign in
              </Button>
            </Link>
          </Entrance>

          {/* Unframed, sitting directly on the page so it reads as embedded
              rather than a screenshot. aspect-[1080/550] matches the SVG viewBox
              exactly — a fixed height letterboxed it, leaving ~50px of dead
              gutter each side and making the graph look narrower than the text
              above it even though both are clamped to the same width.

              Parallax wraps the frame, not the SVG: the graph then leaves the
              viewport slightly slower than the text above it, which is what puts
              it on its own plane. 28px over a full transit — the reader should
              feel the depth, not watch it. */}
          <Entrance delay={STAGGER * 5} className="mt-10 md:mt-12">
            <Parallax from={28} to={-28} className="relative w-full aspect-[1080/550]">
              <ProductPreview kind="graph" animated interactive />
            </Parallax>
            <GraphLegend />
          </Entrance>
          </div>
        </section>

        {/* Thesis Stages */}
        <section id="how-it-works" className="py-16 bg-white" aria-labelledby="stages-heading">
          <div className="max-w-6xl mx-auto px-6 border-y-2 border-black py-12">
            <Reveal y={20}>
              <p id="stages-heading" className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-black text-center mb-8">Works across every thesis stage</p>
            </Reveal>
            {/* Grid rather than flex-wrap: flex sized each pill to its label, so
                "DATA" was half the width of "METHODOLOGY". A grid makes all seven
                identical at every breakpoint. Still not clickable — the hover
                inversion is visual life only, hence cursor-default. */}
            <ol className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {/* The seven pills reveal left to right on their own stagger, so
                  the row reads as a process unfolding in order — which is what
                  the content is actually saying. The pill markup moved to an
                  inner <span> because Reveal owns the <li>'s transform. */}
              {STAGES.map((stage, i) => (
                <Reveal as="li" key={stage} delay={i * STAGGER} y={24}>
                  <span
                    className={`group h-full flex items-center justify-center gap-2 px-3 py-3 border-2 border-black bg-white font-sans text-center cursor-default hover:bg-black ${LIFT}`}
                  >
                    <span className="text-accent text-[10px] font-bold group-hover:text-white transition-colors duration-fast ease-tm">
                      {(i + 1).toString().padStart(2, '0')}
                    </span>
                    <span className="text-[11px] md:text-xs font-bold text-black leading-tight group-hover:text-white transition-colors duration-fast ease-tm">
                      {stage.toUpperCase()}
                    </span>
                  </span>
                </Reveal>
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
                    {/* Label, heading and body on consecutive stagger steps: the
                        eye is led down the column in reading order instead of
                        being handed the whole block at once. */}
                    <Reveal y={20} className="flex items-center justify-center md:justify-start gap-3 mb-6">
                      <Icon size={20} strokeWidth={2} className="text-accent" aria-hidden />
                      <span className="text-[10px] md:text-sm font-sans font-bold uppercase tracking-[0.2em] text-accent">{feature.label}</span>
                    </Reveal>
                    <Reveal delay={STAGGER} y={28}>
                      <h3 className="font-serif text-2xl md:text-display-sm text-text-primary leading-tight mb-6">{feature.heading}</h3>
                    </Reveal>
                    <Reveal as="p" delay={STAGGER * 2} y={24} className="font-sans text-text-muted text-base md:text-lg leading-relaxed">
                      {feature.body}
                    </Reveal>
                  </div>
                  {/* `w-full md:flex-1`, never a bare `flex-1`: on mobile the row is
                      flex-col, where `flex-1` sets flex-basis:0 on the VERTICAL axis
                      and overrides the height — collapsing this box to a ~15px strip. */}
                  {/* Definite height, not min-h + items-center: the frame is
                      `h-full`, and min-height only sets a floor while
                      items-center sizes a flex child to its content — so the
                      dark box shrank to fit instead of filling. */}
                  {/* The visual column travels on its own plane. Its parallax
                      offset simply differs from the text column beside it, which
                      is enough to separate the row into foreground and background
                      as it passes through the viewport. */}
                  <Reveal delay={STAGGER} y={44} className="w-full md:flex-1 h-56 md:h-80">
                    <Parallax from={34} to={-34} className="relative w-full h-full">
                      <ProductPreview kind={feature.preview} interactive />
                    </Parallax>
                  </Reveal>
                </div>
              );
            })}
          </div>
        </section>

        {/* Differentiators */}
        <section className="py-24 bg-white" aria-labelledby="differentiators-heading">
          <div className="max-w-6xl mx-auto px-6">
            <Reveal>
              <h2 id="differentiators-heading" className="font-serif text-display-sm text-text-primary text-center mb-16">
                Built differently, for researchers
              </h2>
            </Reveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t border-black">
              {/* Stagger resets every three cards so each grid ROW sweeps in
                  left to right. Staggering all six by index would make the last
                  card wait half a second after the first, which reads as a
                  loading queue rather than one gesture. */}
              {DIFFERENTIATORS.map(({ icon: Icon, title, description }, i) => (
                <Reveal
                  as="article"
                  key={title}
                  delay={(i % 3) * STAGGER}
                  y={32}
                  className="group relative overflow-hidden p-8 border-r border-b border-black bg-white hover:bg-accent/[0.03] transition-colors duration-base ease-tm"
                >
                  {/* An accent rule wipes across the top edge on hover. A width
                      transition rather than a fade, because a wipe has direction
                      and therefore tells you which card you are on — and at the
                      600ms tier it stays legible as movement instead of just
                      switching on. */}
                  <span className="absolute top-0 left-0 h-[3px] w-0 bg-accent transition-[width] duration-slow ease-tm group-hover:w-full" aria-hidden />
                  <Icon size={24} strokeWidth={2} className="text-black mb-6 group-hover:text-accent transition-colors duration-base ease-tm" aria-hidden />
                  <h3 className="font-sans font-bold text-black text-lg mb-3 uppercase tracking-tight">{title}</h3>
                  <p className="font-sans text-text-muted text-sm leading-relaxed">{description}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 text-center px-6 bg-black text-white relative overflow-hidden" aria-labelledby="cta-heading">
          {/* The dot grid drifts against the scroll direction, so the black panel
              has a floor that moves independently of the words standing on it.
              `-inset-y-24` gives the layer enough overhang that its own travel
              never exposes an edge inside the section. */}
          <Parallax from={-40} to={40} className="absolute inset-0">
            <div className="absolute -inset-y-24 inset-x-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:30px_30px]" aria-hidden />
          </Parallax>
          <div className="relative z-10">
            <Reveal>
              <h2 id="cta-heading" className="font-serif text-display mb-8 max-w-4xl mx-auto">
                Start mapping your research today
              </h2>
            </Reveal>
            <Reveal as="p" delay={STAGGER} className="font-sans text-white/60 text-xl mb-12 max-w-xl mx-auto font-medium">
              Free to start. No credit card required. Built for the way researchers actually work.
            </Reveal>
            <Reveal delay={STAGGER * 2}>
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="bg-white text-black border-none hover:bg-accent hover:text-white hover:-translate-y-0.5">Create your free account</Button>
              </Link>
            </Reveal>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </>
  );
}
