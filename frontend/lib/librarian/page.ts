/**
 * Where the reader is standing, for a librarian that follows them around.
 *
 * The librarian used to live in one drawer on the home page, so "what are we
 * talking about" was always the same answer: your library. A dock on every page
 * changes that question, and this module is the answer to it.
 *
 * ── The rule from lib/librarian/context.ts applies here, and harder ───────
 *
 * That module's whole purpose is that **the librarian may only say what the
 * engines already decided** — the stored explanation, never a regenerated one —
 * because every subsystem underneath refuses to fabricate and a chat layer
 * improvising over the top would undo all of it in the layer people read.
 *
 * Telling a model "the user is looking at a correlation game" is precisely the
 * kind of thing that breaks that rule by accident. A model handed a location and
 * no contents will furnish the contents. It will discuss the chain it has not
 * seen, name songs that were never played, and do it fluently.
 *
 * So every entry here says two things, and the second is the load-bearing one:
 * where they are, and **what of it is not loaded**. `blind` is not an apology,
 * it is the sentence that stops the invention — the same job `notLoadedNotice`
 * does for the feed and practice sections.
 *
 * ── Why the URL is the whole input ───────────────────────────────────────
 *
 * The alternative was a React context that every page pushes its state into,
 * and it is worse in the way that matters: it would put the duty of describing a
 * page on the page, so a page that forgot would silently hand the librarian a
 * stale description of somewhere else. A path cannot be stale. What the server
 * can load from a path, it loads properly; what it cannot, this file declares
 * unloaded in writing.
 */

/**
 * Which chat surface is asking.
 *
 * The same pathname means two different things depending on what the user is
 * typing into, and `/books/` is the case that proves it. From the floating dock
 * the reader's page text is genuinely out of reach. From the reader's OWN chat
 * tab, switched to library scope, it is one switch position away — so the dock's
 * blind notice ("point them at the chat inside the reader") would be sending
 * them to the chat they are already in.
 *
 * That is why this is a parameter and not a second lookup table. The failure it
 * prevents is specific: circular advice reads as competence, the user follows it
 * and arrives back where they started.
 *
 * It stays within the rule at the top of this file — the caller states which of
 * its own surfaces it is, which is a fact about itself, not a description of
 * what it can see. The descriptions are still this module's to write.
 */
export type Surface = 'dock' | 'reader'

export interface PageContext {
  /** A short name for the place, used in the prompt and in the dock's header. */
  label: string
  /** What the reader is doing here, in the second person, for the prompt. */
  doing: string
  /**
   * What is NOT in the context despite the reader looking at it. Empty string
   * when the loaded sections genuinely cover the page.
   */
  blind: string
  /** Sections to force on, because being on the page IS the ask. */
  wants: { feed?: boolean; practice?: boolean }
}

const LIBRARY: PageContext = {
  label: 'your library',
  doing: 'They are in their library, looking at their books.',
  blind: '',
  wants: {},
}

/**
 * Resolve a pathname to what the librarian may say about it.
 *
 * Matched longest-prefix-first and with the dynamic segments stripped, so
 * `/books/41?page=7` and `/books/9` reach the same entry. The id is not passed
 * on: the librarian has the book list already, and a number it cannot resolve
 * is an invitation to pretend it did.
 *
 * `surface` defaults to the dock, so every existing caller keeps the behaviour
 * it was written against and only the reader has to say what it is.
 */
export function pageContext(pathname: string, surface: Surface = 'dock'): PageContext {
  const p = (pathname || '/').replace(/\/+$/, '') || '/'

  if (p === '/' || p === '/dashboard') return LIBRARY

  if (p.startsWith('/books/')) {
    /**
     * Library scope, reached from inside the reader's own chat.
     *
     * The page text is absent here for a different reason than it is absent
     * from the dock, and the difference is the whole point of saying it: the
     * dock cannot get the text, whereas this chat chose not to send it because
     * the user asked about their library instead of about the page. So the
     * remedy is a switch position, and naming it is the honest answer to "what
     * does this passage mean" — the dock's answer, "use the chat in the
     * reader", would be a circle.
     *
     * Which book they have open IS supplied, separately, by the route — see the
     * `reading` field there. It is not stated here because this module only
     * knows the path, and a path is exactly the thing that cannot name a title.
     */
    if (surface === 'reader') {
      return {
        label: 'your library',
        doing:
          'They have a book open in the reader and have switched the chat beside ' +
          'it from the page to their whole library, so they are asking about the ' +
          'library rather than about the passage in front of them.',
        blind:
          'You cannot see the page they are on or any of its text IN THIS SCOPE. ' +
          'This is the same chat panel whose Page and Book scopes can see it — so ' +
          'if they ask about the passage in front of them, tell them to switch ' +
          'the scope back to Page or Book and never guess at the text. Do not ' +
          'send them to some other chat; this is the one.',
        wants: {},
      }
    }

    return {
      label: 'a book',
      doing: 'They have a book open in the reader.',
      // The reader has its own chat, with the page text in front of it. This one
      // does not, and must not act as though it does.
      blind:
        'You cannot see which book it is, which page they are on, or any of its ' +
        'text. The reading panel beside the page is the thing that can; if they ' +
        'ask about the passage in front of them, say you cannot see it from here ' +
        'and point them at the chat inside the reader.',
      wants: {},
    }
  }

  if (p.startsWith('/suggest')) {
    return {
      label: 'the suggested feed',
      doing: 'They are looking at their suggested feed.',
      blind: '',
      // Being on the page is the ask. Waiting for the word "feed" to appear in
      // a message would miss "why this one?", which is the commonest question
      // anybody standing here has.
      wants: { feed: true },
    }
  }

  if (p.startsWith('/learn') || p.startsWith('/quiz')) {
    return {
      label: 'practice',
      doing: 'They are on the practice pages, working through material.',
      blind: '',
      wants: { practice: true },
    }
  }

  if (p.startsWith('/play')) {
    return {
      label: 'a correlation game',
      doing:
        'They are in AI Play Along — the correlation games, where a player offers ' +
        'something and a partner answers it with something from another medium.',
      blind:
        'You cannot see the game itself: not the chain, not the offerings in it, ' +
        'not whose turn it is, not what the partner said. You can explain how the ' +
        'section works and what the controls do. You must NOT discuss the ' +
        'particular chain, name anything in it, or characterise how the game is ' +
        'going — you would be inventing all of it.',
      wants: {},
    }
  }

  if (p.startsWith('/settings')) {
    return {
      label: 'settings',
      doing: 'They are in settings.',
      blind: 'You cannot see which settings they have changed.',
      wants: {},
    }
  }

  if (p.startsWith('/billing')) {
    return {
      label: 'billing',
      doing: 'They are on the billing page.',
      blind:
        'You cannot see their plan, their usage or any amount they have been ' +
        'charged. Do not state or estimate any of it — send them to the page ' +
        'itself, which has the real numbers.',
      wants: {},
    }
  }

  if (p.startsWith('/upload')) {
    return {
      label: 'uploading',
      doing: 'They are on the upload page, adding something to their library.',
      blind: '',
      wants: {},
    }
  }

  return {
    label: 'the app',
    doing: `They are somewhere in the app (${p}).`,
    blind: 'You cannot see what is on this page.',
    wants: {},
  }
}

/**
 * The page block for the system prompt.
 *
 * Returns an empty string for an unknown-but-harmless location rather than a
 * paragraph of hedging — the generic entry above already says the useful part,
 * and three sentences of "you cannot see" on every message is noise that a
 * model learns to skip past, which is the opposite of what the warnings are for.
 */
export function describePage(page: PageContext): string {
  const lines = [`WHERE THEY ARE: ${page.doing}`]
  if (page.blind) lines.push(`WHAT YOU CANNOT SEE FROM HERE: ${page.blind}`)
  lines.push(
    'Answer about this place when they ask about "this" or "here". If they ask ' +
    'about something you cannot see, say so plainly and tell them what would ' +
    'show it — never fill the gap.',
  )
  return lines.join('\n')
}
