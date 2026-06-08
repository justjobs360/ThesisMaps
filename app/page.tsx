import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  GitFork, AlignLeft, Lightbulb, Shield, Clock, Search, Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { MarketingFooter } from '@/components/layout/MarketingFooter';

export const metadata: Metadata = {
  title: 'ThesisMaps — Visual Research Intelligence for Graduate Researchers',
  description:
    'Map your literature, discover research gaps, and build your thesis with confidence. The visual research platform built for PhD and masters students.',
  alternates: { canonical: 'https://www.thesismaps.com' },
};

const FEATURES = [
  {
    label: 'Knowledge Graph',
    heading: 'See how your literature connects',
    body: 'Visualise citation networks, semantic similarity, and co-authorship links across hundreds of papers — all on a single interactive canvas.',
    icon: GitFork,
  },
  {
    label: 'Outline Builder',
    heading: 'Structure your thesis with coverage scores',
    body: 'Drag papers into chapters, track coverage per section, and export a structured outline with citations to Word or PDF in one click.',
    icon: AlignLeft,
  },
  {
    label: 'Gap Detection',
    heading: 'Find what nobody has written yet',
    body: 'Our ML-powered gap analysis clusters your library, scores topics by research density, and surfaces the questions your field has left unanswered.',
    icon: Lightbulb,
  },
  {
    label: 'Defence Readiness',
    heading: 'Prepare for the toughest questions',
    body: 'ThesisMaps surfaces counter-arguments, contradicting findings, and methodological critiques — then generates a defence checklist tailored to your thesis.',
    icon: Shield,
  },
];

const DIFFERENTIATORS = [
  { icon: Search, title: 'Multi-Source Search', description: 'Semantic Scholar, OpenAlex, arXiv, CrossRef, PubMed and more — unified in one search.' },
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
      <MarketingHeader />

      <main>
        {/* Hero */}
        <section className="pt-32 md:pt-40 pb-16 md:pb-24 px-6 max-w-6xl mx-auto text-center" aria-labelledby="hero-heading">
          <p className="text-[10px] md:text-sm font-sans font-bold uppercase tracking-[0.3em] text-accent mb-6 leading-none">Visual Research Intelligence</p>
          <h1 id="hero-heading" className="font-serif text-display text-text-primary mb-8 md:mb-12">
            Map your literature. <br className="hidden md:block" />
            Find the gaps. <br className="hidden md:block" />
            Write with confidence.
          </h1>
          <p className="max-w-xl mx-auto font-sans text-text-muted text-lg md:text-xl leading-relaxed mb-10 md:mb-12 px-4">
            ThesisMaps is the research platform built for PhD and masters students who want to move from overwhelming reading lists to a structured, confident thesis — faster.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" variant="primary" className="w-full sm:w-auto">Start for free</Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">Sign in</Button>
            </Link>
          </div>

          {/* Graph mockup placeholder */}
          <div className="mt-16 md:mt-20 rounded-none overflow-hidden border-2 border-black shadow-impact bg-black h-64 md:h-96 flex items-center justify-center relative" aria-hidden>
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
            <div className="text-white font-sans text-[10px] md:text-xs uppercase tracking-widest font-bold z-10 px-6">Knowledge Graph Engine Enabled</div>
          </div>
        </section>

        {/* Thesis Stages */}
        <section id="how-it-works" className="py-16 border-y-2 border-black bg-white" aria-labelledby="stages-heading">
          <div className="max-w-6xl mx-auto px-6">
            <p id="stages-heading" className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-black text-center mb-8">Works across every thesis stage</p>
            <ol className="flex flex-wrap justify-center gap-3">
              {STAGES.map((stage, i) => (
                <li
                  key={stage}
                  className="flex items-center gap-3 px-5 py-3 border-2 border-black bg-white font-sans text-sm font-bold text-black hover:bg-black hover:text-white transition-colors cursor-default"
                >
                  <span className="text-accent text-xs">{(i + 1).toString().padStart(2, '0')}</span>
                  {stage.toUpperCase()}
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
                <div
                  key={feature.label}
                  className={['flex flex-col md:flex-row items-center gap-12 md:gap-16', reversed ? 'md:flex-row-reverse' : ''].join(' ')}
                >
                  <div className="flex-1 w-full text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
                      <Icon size={20} strokeWidth={2} className="text-accent" aria-hidden />
                      <span className="text-[10px] md:text-sm font-sans font-bold uppercase tracking-[0.2em] text-accent">{feature.label}</span>
                    </div>
                    <h3 className="font-serif text-2xl md:text-display-sm text-text-primary leading-tight mb-6">{feature.heading}</h3>
                    <p className="font-sans text-text-muted text-base md:text-lg leading-relaxed">{feature.body}</p>
                  </div>
                  <div
                    className="flex-1 border-2 border-black bg-black h-56 md:h-80 w-full flex items-center justify-center text-white/40 font-sans text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-impact relative overflow-hidden"
                    aria-label={`${feature.label} interface preview`}
                    role="img"
                  >
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:15px_15px]"></div>
                    {feature.label} Engine
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
