/**
 * The offering resolver — one door onto every medium.
 *
 * Callers name a medium and get an Offering back, or nothing. Nothing is the
 * important half: the whole design rests on a reply being *real*, and the only way
 * that stays true is for the failure to be ordinary and visible rather than
 * papered over. A catalogued medium fails by finding no match; a composed medium
 * fails performability; a library medium fails because the reader has never read
 * anything like it. All three end up in the same place — a recorded miss.
 *
 * Adding a medium means a registry entry in lib/correlate/media.ts plus a case
 * here. Nothing else in the engine learns about it.
 */

import type { MediumId, Offering, ReplyPlan } from '@/lib/correlate/types'
import { getMedium, isComposed } from '@/lib/correlate/media'
import { OfferingError } from './shared'
import { lookupMusic, resolveMusic, searchMusic } from './music'
import { lookupArtwork, resolveArtwork, searchArtwork } from './artwork'
import { lookupPassage, resolvePassage, searchPassages } from './passage'
import { lookupScene, resolveScene, searchScenes } from './scene'
import { composeOffering, type ComposedInput } from './composed'

export { OfferingError } from './shared'
export { composeOffering, checkPerformability, vocabularyFor, PROBLEM_COPY } from './composed'

/** Everything a resolver might need that is not the query itself. */
export interface OfferingContext {
  /** Required for the `passage` medium; that library is private to one person. */
  userId?: string
}

/** Search a medium for offerings a player can choose from. */
export async function searchOfferings(
  medium: MediumId,
  q: string,
  ctx: OfferingContext = {},
  limit?: number,
): Promise<Offering[]> {
  switch (medium) {
    case 'music':   return searchMusic(q, limit)
    case 'artwork': return searchArtwork(q, limit)
    case 'scene':   return searchScenes(q, limit)
    case 'passage':
      if (!ctx.userId) throw new OfferingError('Sign in to offer a passage from your library.', 401, 'Your library')
      return searchPassages(ctx.userId, q, limit)
    default:
      // Composed media have nothing to search. Returning empty rather than
      // throwing keeps a picker that asks every enabled medium simple.
      return []
  }
}

/**
 * Re-fetch one offering by id.
 *
 * The turn route calls this instead of trusting an offering body from the client:
 * for a catalogued medium the server is what decides which record a move is, and
 * for a passage it is also the authorisation check.
 */
export async function lookupOffering(
  medium: MediumId,
  id: string,
  ctx: OfferingContext = {},
): Promise<Offering | null> {
  switch (medium) {
    case 'music':   return lookupMusic(id)
    case 'artwork': return lookupArtwork(id)
    case 'scene':   return lookupScene(id)
    case 'passage':
      if (!ctx.userId) return null
      return lookupPassage(ctx.userId, id)
    default:
      return null
  }
}

/**
 * Turn an interpreter's reply plan into a real offering.
 *
 * A composed plan is built and performability-checked; a catalogued plan is
 * searched. Either can come back null, and a null here is a miss, not an error —
 * the turn is still recorded so the reach stays legible.
 */
export async function resolveReply(
  plan: ReplyPlan,
  exclude: string[] = [],
  ctx: OfferingContext = {},
): Promise<Offering | null> {
  const medium = getMedium(plan.medium)
  if (!medium) return null

  if (isComposed(plan.medium)) {
    if (!plan.composed) return null
    const input: ComposedInput = {
      medium: plan.medium,
      title: plan.composed.title,
      steps: plan.composed.steps ?? [],
      framing: plan.framing,
      intent: plan.composed.intent === 'invited' ? 'invited' : 'shown',
    }
    const built = composeOffering(input)
    // A composed reply that fails performability is exactly as much of a miss as
    // a search that found nothing. The interpreter wrote something undoable.
    return built.ok ? built.offering : null
  }

  if (!plan.query?.trim()) return null

  let found: Offering | null = null
  switch (plan.medium) {
    case 'music':   found = await resolveMusic(plan.query, exclude); break
    case 'artwork': found = await resolveArtwork(plan.query, exclude); break
    case 'scene':   found = await resolveScene(plan.query, exclude); break
    case 'passage':
      found = ctx.userId ? await resolvePassage(ctx.userId, plan.query, exclude) : null
      break
    default:
      return null
  }

  // The interpreter's framing overrides the provider's default, because the
  // framing is the part it actually chose.
  if (found && plan.framing?.trim()) {
    found = { ...found, framing: plan.framing.trim() }
  }
  return found
}
