'use client'

export interface SerendipityCard {
  url: string
  title?: string
  caption?: string
  sourceLabel?: string
}

interface Props {
  card: SerendipityCard
  onDismiss: () => void
}

export default function SerendipityOverlay({ card, onDismiss }: Props) {
  return (
    <div
      className="flex flex-col items-center justify-start overflow-y-auto cursor-pointer bg-black dark:bg-black"
      style={{ flex: '1 1 0', minHeight: 0 }}
      onClick={onDismiss}
    >
      <div className="flex flex-col items-center gap-4 max-w-2xl w-full px-6 py-8">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black tracking-[0.2em] uppercase text-amber-400 border border-amber-400/50 rounded px-2 py-0.5">
            ☕ Break Time
          </span>
        </div>
        <img
          src={card.url}
          alt={card.title}
          className="max-h-[65vh] w-auto rounded-xl shadow-2xl object-contain flex-shrink-0"
          onError={onDismiss}
        />
        <div className="text-center space-y-1 pb-2">
          {card.title && (
            <p className="text-white font-semibold text-lg leading-snug">{card.title}</p>
          )}
          {card.caption && (
            <p className="text-gray-300 text-sm max-w-lg leading-relaxed">{card.caption}</p>
          )}
          <p className="text-gray-500 text-xs pt-1">
            {card.sourceLabel} · tap anywhere to continue reading
          </p>
        </div>
      </div>
    </div>
  )
}
