/**
 * What this app actually offers, so the librarian stops inventing it.
 *
 * ── The conversation this exists because of ───────────────────────────────
 *
 * A reader asked the librarian how to start RPG mode. It answered that these
 * modes "typically involve setting goals or quests", advised looking for an
 * "Introduction or Getting Started section", and suggested community forums.
 * None of those exist. Asked for a link it said it was "unable to link
 * directly to specific pages in your learning platform" — which is both untrue
 * and the single most useful thing it could have done.
 *
 * Every other part of the librarian is built to refuse invention:
 * `librarianContext` carries stored explanations and states its absences,
 * `page.ts` declares in writing what it cannot see. All of that governs the
 * reader's DATA. Nothing governed the app's own features, and a model asked
 * about a feature it has never heard of will describe a plausible one
 * fluently — which is exactly what happened, and it is worse than a refusal
 * because it sends somebody looking for a tutorial that was never written.
 *
 * So: the features are facts too, and they are listed here.
 *
 * ── Why this is prose with paths and not a sitemap ────────────────────────
 *
 * The second half of that conversation was the reader asking for a link. The
 * librarian can emit one — these are its own app's routes, they are stable,
 * and a path is the one answer that converts "I am confused about where this
 * is" into one click. So every entry carries its path and the prompt says
 * plainly that linking is allowed and wanted.
 *
 * ── What it must still not do ─────────────────────────────────────────────
 *
 * Describing a feature is not seeing a reader's state in it. This file says
 * what RPG mode IS; it says nothing about where any particular party is
 * standing, and `page.ts` and `notLoadedNotice` continue to govern that. The
 * closing rule below restates it, because a list of features is precisely the
 * context that tempts a model into "you'll see your journey on the left".
 *
 * ── Keeping it true ───────────────────────────────────────────────────────
 *
 * A stale entry here is a confident wrong answer, which is the failure this
 * module was written to stop — so a test asserts every path still resolves to
 * a route that exists in the build. Prose cannot be checked that way; it is
 * short on purpose, and anything that would date quickly (counts, model
 * names, what is written versus mapped) is deliberately absent.
 */

export interface Surface {
  /** What a reader would call it. */
  name: string
  /** The route. Must exist — see the test. */
  path: string
  /** One or two sentences: what it is FOR, and what doing it looks like. */
  is: string
}

export const SURFACES: Surface[] = [
  {
    name: 'Your library',
    path: '/',
    is: 'The home page. Everything uploaded, grouped into Read, Play and Learn bands, '
      + 'with whatever was in progress surfaced first.',
  },
  {
    name: 'Reading a book',
    path: '/books',
    is: 'The reader itself: the text, with a chat alongside it that can see the page, '
      + 'plus problem sets, flashcards and narration built from what is on it.',
  },
  {
    name: 'Upload',
    path: '/upload',
    is: 'Add a book, article or PDF. Also where the public-domain classics are picked from.',
  },
  {
    name: 'Suggested feed',
    path: '/suggest',
    is: 'A digest built from feeds the reader has enabled, balanced across buckets rather '
      + 'than ranked by popularity. Every item can say why it was chosen.',
  },
  {
    name: 'AI Play Along',
    path: '/play',
    is: 'Correlation games. A player offers something — a song, a painting, a passage — and '
      + 'a partner answers it with something from another medium, and the connection is the '
      + 'move. Tag is the one to start with; its variants are inside its card.',
  },
  {
    name: 'Practice',
    path: '/learn',
    is: 'Mathematics problems with the answer checked by an engine rather than compared to a '
      + 'string. The default tab of the learn pages.',
  },
  {
    name: 'Concept map',
    path: '/learn?tab=concepts&scope=atlas',
    is: 'The whole atlas of mathematics drawn as a graph of what rests on what. Most of it is '
      + 'mapped rather than written, and the page says so.',
  },
  {
    name: 'RPG mode',
    path: '/learn?tab=world',
    is: 'Mathematics as a place to walk. Twenty-one city states on a world map, each carrying '
      + 'one area of mathematics. To start: pick somewhere to make landfall, then click a city '
      + 'and offer one of the things you know there — that is the move, and the graph decides '
      + 'where it takes you. Roads close when a prerequisite is missing and say which one. '
      + 'Where you are standing you can also play at the table: say what your character does, '
      + 'and a game master answers and calls for dice. There are no quests and no tutorial; '
      + 'the How to play box at the top of the tab is the whole of the instructions.',
  },
  {
    name: 'Tutor',
    path: '/learn?tab=tutor',
    is: 'Socratic questions about a derivation. It asks and rules on nothing, which makes it '
      + 'the gentlest way in for somebody who does not yet know what they can do.',
  },
  {
    name: 'Review',
    path: '/learn?tab=review',
    is: 'The queue of answers the engine could not settle, waiting to be adjudicated.',
  },
  {
    name: 'Flashcards',
    path: '/quiz',
    is: 'Spaced repetition over cards made from the books.',
  },
  {
    name: 'Settings',
    path: '/settings',
    is: 'Models per feature, personas, display, and the rest of the configuration.',
  },
]

/**
 * The features section of the system prompt.
 *
 * Ends with the rule rather than opening with it, so the last thing read
 * before the reader's message is the boundary — the same placement reason the
 * routing footer in the Armat Sur GM prompt gives for sitting last.
 */
export function describeSurfaces(): string {
  const lines = SURFACES.map(s => `- ${s.name} (${s.path}): ${s.is}`)
  return [
    'WHAT THIS APP CONTAINS. These are its real features and real routes. If asked how to do '
    + 'something, answer from this list and nothing else — do not describe features from other '
    + 'apps, and do not invent quests, tutorials, onboarding flows, achievements or community '
    + 'forums. None of those exist here. If something genuinely is not in this list, say so '
    + 'plainly rather than guessing at a plausible version of it.',
    '',
    ...lines,
    '',
    'LINK TO THESE. You can and should give the path when it would help — write it as a markdown '
    + 'link, for example [RPG mode](/learn?tab=world). They are this app\'s own routes, so '
    + 'pointing somebody at one is the most useful answer available when they are lost. Never '
    + 'say you are unable to link to a page of this app.',
    '',
    'Knowing what a feature IS is not the same as seeing what the reader has done in it. This '
    + 'list tells you how things work; it tells you nothing about their progress, their position '
    + 'or their history, and the sections above are the only source for that.',
  ].join('\n')
}
