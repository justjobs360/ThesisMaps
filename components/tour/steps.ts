/**
 * The product tour, in order. Each step points at a real element marked with
 * `data-tour="<target>"`, on the route given (the tour navigates there first).
 *
 * The order follows the actual research workflow — choose a project, find
 * papers, keep them, see how they connect, plan, find gaps, prepare to defend,
 * bring others in — and each body says how the step connects to the one before,
 * because that connection is what a new user can't see from the sidebar alone.
 */
export type TourStep = {
  id: string;
  /** Route the step lives on; omitted = stay on the current page. */
  route?: string;
  /** `data-tour` value of the element to spotlight. */
  target: string;
  title: string;
  body: string;
  /** The target sits in the sidebar, which is a drawer below the lg breakpoint. */
  inSidebar?: boolean;
  /** Clicking the highlighted element also moves the tour on. */
  advanceOnClick?: boolean;
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'project',
    target: 'project-switcher',
    title: 'Your thesis lives here',
    body: 'Everything you save belongs to a project. Switch between theses or start a new one from this menu.',
  },
  {
    id: 'nav-search',
    route: '/dashboard',
    target: 'nav-search',
    inSidebar: true,
    advanceOnClick: true,
    title: 'Start by finding papers',
    body: 'Search covers eight academic databases at once, including Semantic Scholar, OpenAlex and arXiv. Click Search to go there.',
  },
  {
    id: 'search-box',
    route: '/search',
    target: 'paper-search',
    title: 'Type your topic',
    body: 'Results from every source arrive in one deduplicated list. Save the papers that matter and they go straight into your library.',
  },
  {
    id: 'nav-library',
    route: '/search',
    target: 'nav-library',
    inSidebar: true,
    advanceOnClick: true,
    title: 'Everything you saved',
    body: 'My Library holds every paper you keep. Track what you have read, and ask how any paper fits your thesis.',
  },
  {
    id: 'graph',
    route: '/graph',
    target: 'graph-canvas',
    title: 'See how your reading connects',
    body: 'Your library as a map. Lines show which paper builds on which. Hover a paper to trace it, click to pin its details. The map fills in as you save papers.',
  },
  {
    id: 'nav-outline',
    route: '/graph',
    target: 'nav-outline',
    inSidebar: true,
    title: 'Plan your chapters',
    body: 'Build your outline and attach papers to each section. Coverage shows which sections still need sources.',
  },
  {
    id: 'nav-gaps',
    target: 'nav-gaps',
    inSidebar: true,
    title: 'Find your contribution',
    body: 'Research Gaps groups your library by topic and flags areas few papers address: candidate gaps for your own work.',
  },
  {
    id: 'nav-defence',
    target: 'nav-defence',
    inSidebar: true,
    title: 'Prepare for your viva',
    body: 'Defence Ready drafts likely examiner questions and counter-arguments from the papers in your library.',
  },
  {
    id: 'nav-collaborate',
    target: 'nav-collaborate',
    inSidebar: true,
    title: 'Bring your supervisor in',
    body: 'Invite collaborators to view your project and leave comments.',
  },
  {
    id: 'replay',
    target: 'tour-replay',
    title: "That's the tour",
    body: 'Replay it any time from this button. A good first move: search for one paper you already know.',
  },
];
