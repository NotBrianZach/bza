/**
 * The seven relations — what a reply can *do* to an offering.
 *
 * This is deliberately a separate registry from the media one. A game is a
 * choice of which media are in play crossed with which relations are legal, and
 * keeping the two apart is what lets a change of medium be a move in its own right
 * something the rules can express rather than something that happens by
 * accident.
 *
 * "Correlation" here means a proposed connection. Some will be discovered and
 * some created through play; the game does not need to distinguish them, only to
 * insist they be explainable.
 */

import type { Relation, RelationId } from './types'

export const RELATIONS: Record<RelationId, Relation> = {
  association: {
    id: 'association',
    name: 'Association',
    does: 'Follows any explainable connection',
    example: 'A rainy film scene → a painting that recalls the same loneliness',
    requiresMediumChange: false,
    guidance:
      'Any connection is admissible so long as you can say what it is. The test is not ' +
      'cleverness, it is whether a second person could be shown the link and recognise it.',
  },

  translation: {
    id: 'translation',
    name: 'Translation',
    does: 'Expresses something similar through another medium',
    example: 'An accelerating song → a dance that gradually expands its movements',
    requiresMediumChange: true,
    guidance:
      'You are carrying a quality across a change of medium, so you must name the quality ' +
      'and name what the new medium does with it. A translation that could have been made in ' +
      'the same medium is not a translation, it is an association.',
  },

  transformation: {
    id: 'transformation',
    name: 'Transformation',
    does: 'Preserves one quality and changes another',
    example: 'A threatening sculpture → a playful movement with the same angular shape',
    requiresMediumChange: false,
    guidance:
      'State both halves: the quality held constant and the quality inverted. A reply that ' +
      'changes everything is a non-sequitur; one that changes nothing is a copy.',
  },

  counterpoint: {
    id: 'counterpoint',
    name: 'Counterpoint',
    does: 'Offers a different perspective on the same subject',
    example: 'A triumphant speech → an image of the people excluded from its victory',
    requiresMediumChange: false,
    guidance:
      'The subject must genuinely be the same. Disagreeing with something by changing the ' +
      'subject is not counterpoint. Say what the first offering leaves out, and let the ' +
      'second supply it.',
  },

  embodiment: {
    id: 'embodiment',
    name: 'Embodiment',
    does: 'Turns an interpretation into an action',
    example: 'A painting about balance → a comfortable balancing pose',
    requiresMediumChange: true,
    guidance:
      'The action must be performable by an ordinary body in an ordinary room, and you must ' +
      'say what it feels like to do rather than what it looks like from outside. Offer it, ' +
      'never demand it.',
  },

  continuation: {
    id: 'continuation',
    name: 'Continuation',
    does: 'Shows what could happen next',
    example: 'A character leaving a room → a photograph suggesting where they went',
    requiresMediumChange: false,
    guidance:
      'Continue from what is actually established, not from what would be convenient. If the ' +
      'first offering fixes a time, a place or a mood, your next moment inherits all three.',
  },

  reinterpretation: {
    id: 'reinterpretation',
    name: 'Reinterpretation',
    does: 'Makes an earlier item newly intelligible',
    example: 'A comic scene → a solemn dance that exposes its underlying cruelty',
    requiresMediumChange: false,
    guidance:
      'You are changing how the previous offering reads, not adding to it. Say what it ' +
      'seemed to be, and what it turns out to have been. This is the one relation that acts ' +
      'backwards.',
  },
}

export const RELATION_LIST: Relation[] = [
  RELATIONS.association,
  RELATIONS.translation,
  RELATIONS.transformation,
  RELATIONS.counterpoint,
  RELATIONS.embodiment,
  RELATIONS.continuation,
  RELATIONS.reinterpretation,
]

export const ALL_RELATION_IDS: RelationId[] = RELATION_LIST.map(r => r.id)

export function getRelation(id: string): Relation | null {
  return (RELATIONS as Record<string, Relation>)[id] ?? null
}

/** Resolve a game's `relations` field to concrete ids. */
export function resolveRelations(spec: RelationId[] | 'all'): RelationId[] {
  return spec === 'all' ? [...ALL_RELATION_IDS] : spec
}

/**
 * Is this relation available given the media actually involved in the turn?
 *
 * Translation and embodiment only mean anything across a change of medium, so a
 * game cannot offer them when the reply stays in the same medium as the move.
 * Checked in the engine rather than trusted to a prompt, because it is the one
 * part of the relation taxonomy that is mechanical.
 */
export function relationPermitted(
  id: RelationId,
  moveMedium: string,
  replyMedium: string,
): boolean {
  const relation = getRelation(id)
  if (!relation) return false
  if (!relation.requiresMediumChange) return true
  return moveMedium !== replyMedium
}

/**
 * Relations a game should stop offering because the chain has just used them.
 *
 * Derived from the turn rows rather than from world state. The music section
 * asked the interpreter to maintain a `threadsUsed` array itself, which meant the
 * rule depended on a model remembering to append to it; recording the relation on
 * each turn makes what is spent a fact about the log instead.
 */
export function spentRelations(
  turns: { relation: RelationId | null; legal: boolean }[],
  window = 1,
): RelationId[] {
  const used = turns
    .filter(t => t.legal && t.relation)
    .map(t => t.relation as RelationId)
  return used.slice(-window)
}
