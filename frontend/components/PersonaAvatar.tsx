'use client'

import { useState, useEffect } from 'react'
import { getPersonaInfo } from '@/lib/persona'

export type AvatarState = 'idle' | 'thinking' | 'talking' | 'happy' | 'encouraging'

interface PersonaAvatarProps {
  state?: AvatarState
  size?: 'sm' | 'md' | 'lg'
  inline?: boolean
}

// Per-persona visual design
const PERSONA_STYLES: Record<string, {
  bg: string; ring: string; skin: string; eyeColor: string
  eyeShape: 'round' | 'narrow' | 'sharp' | 'wide' | 'soft'
  mouthShape: 'smile' | 'smirk' | 'open' | 'flat' | 'grin'
  accessory?: 'glasses' | 'headband' | 'cap' | 'monocle'
}> = {
  sensei:    { bg: 'bg-red-50 dark:bg-red-950/30',    ring: 'ring-red-300 dark:ring-red-700',    skin: '#f5deb3', eyeColor: '#5b3a1a', eyeShape: 'narrow', mouthShape: 'flat',  accessory: 'headband' },
  buddy:     { bg: 'bg-green-50 dark:bg-green-950/30', ring: 'ring-green-300 dark:ring-green-700', skin: '#fdd9a0', eyeColor: '#2d6a30', eyeShape: 'wide',   mouthShape: 'grin' },
  rival:     { bg: 'bg-purple-50 dark:bg-purple-950/30', ring: 'ring-purple-300 dark:ring-purple-700', skin: '#e8c9a0', eyeColor: '#6b21a8', eyeShape: 'sharp',  mouthShape: 'smirk' },
  professor: { bg: 'bg-blue-50 dark:bg-blue-950/30',   ring: 'ring-blue-300 dark:ring-blue-700',   skin: '#f0d5b8', eyeColor: '#1e3a5f', eyeShape: 'round',  mouthShape: 'flat',   accessory: 'glasses' },
  coach:     { bg: 'bg-orange-50 dark:bg-orange-950/30', ring: 'ring-orange-300 dark:ring-orange-700', skin: '#d4a574', eyeColor: '#7c4a1a', eyeShape: 'wide',   mouthShape: 'open',  accessory: 'cap' },
  librarian: { bg: 'bg-pink-50 dark:bg-pink-950/30',   ring: 'ring-pink-300 dark:ring-pink-700',     skin: '#f5deb3', eyeColor: '#9f1239', eyeShape: 'soft',   mouthShape: 'smile', accessory: 'glasses' },
  tsundere:  { bg: 'bg-rose-50 dark:bg-rose-950/30',   ring: 'ring-rose-300 dark:ring-rose-700',     skin: '#fce4ec', eyeColor: '#b71c1c', eyeShape: 'sharp',  mouthShape: 'flat',  accessory: 'glasses' },
  custom:    { bg: 'bg-indigo-50 dark:bg-indigo-950/30', ring: 'ring-indigo-300 dark:ring-indigo-700', skin: '#f5deb3', eyeColor: '#4338ca', eyeShape: 'round',  mouthShape: 'smile' },
}

function AvatarFace({ style, state, px }: { style: typeof PERSONA_STYLES.sensei; state: AvatarState; px: number }) {
  const [blinking, setBlinking] = useState(false)

  // Random blink every 2-5 seconds
  useEffect(() => {
    const blink = () => {
      setBlinking(true)
      setTimeout(() => setBlinking(false), 150)
    }
    const interval = setInterval(blink, 2500 + Math.random() * 2500)
    return () => clearInterval(interval)
  }, [])

  const s = px
  const cx = s / 2
  const cy = s / 2
  const r = s * 0.42

  // Eye positions
  const eyeY = cy - r * 0.1
  const eyeSpacing = r * 0.35
  const eyeR = s * 0.045
  const pupilR = eyeR * 0.55

  // Mouth
  const mouthY = cy + r * 0.25
  const mouthW = r * 0.4

  // Eye shape modifiers
  const isHappy = state === 'happy'
  const isEncouraging = state === 'encouraging'
  const eyeScaleY = blinking || isHappy ? 0.1 : (style.eyeShape === 'narrow' ? 0.6 : style.eyeShape === 'sharp' ? 0.7 : style.eyeShape === 'wide' ? 1.2 : 1)
  const eyeScaleX = style.eyeShape === 'narrow' ? 1.3 : style.eyeShape === 'sharp' ? 0.9 : isEncouraging ? 1.2 : 1

  // Thinking: eyes look up. Encouraging: eyes slightly wider
  const eyePupilOffset = state === 'thinking' ? -eyeR * 0.4 : 0

  // Talking: mouth opens
  const isTalking = state === 'talking'

  return (
    <svg viewBox={`0 0 ${s} ${s}`} width={px} height={px} className={state === 'idle' ? 'animate-persona-idle' : state === 'talking' ? 'animate-persona-talk' : ''}>
      {/* Head */}
      <circle cx={cx} cy={cy} r={r} fill={style.skin} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={style.eyeColor} strokeWidth={s * 0.015} opacity={0.15} />

      {/* Accessory: headband */}
      {style.accessory === 'headband' && (
        <rect x={cx - r} y={cy - r * 0.55} width={r * 2} height={s * 0.06} rx={s * 0.02} fill="#c0392b" />
      )}

      {/* Accessory: cap */}
      {style.accessory === 'cap' && (
        <>
          <ellipse cx={cx} cy={cy - r * 0.6} rx={r * 0.85} ry={r * 0.25} fill="#e67e22" />
          <rect x={cx - r * 0.15} y={cy - r * 0.85} width={r * 0.3} height={r * 0.15} rx={s * 0.02} fill="#e67e22" />
        </>
      )}

      {/* Eyes */}
      {['left', 'right'].map((side, i) => {
        const ex = cx + (i === 0 ? -eyeSpacing : eyeSpacing)
        return (
          <g key={side}>
            {/* Eye white */}
            <ellipse cx={ex} cy={eyeY} rx={eyeR * eyeScaleX} ry={eyeR * eyeScaleY} fill="white" stroke={style.eyeColor} strokeWidth={s * 0.01} />
            {/* Pupil */}
            {!blinking && (
              <circle cx={ex} cy={eyeY + eyePupilOffset} r={pupilR} fill={style.eyeColor} />
            )}
          </g>
        )
      })}

      {/* Accessory: glasses */}
      {style.accessory === 'glasses' && (
        <>
          <circle cx={cx - eyeSpacing} cy={eyeY} r={eyeR * 1.6} fill="none" stroke={style.eyeColor} strokeWidth={s * 0.015} opacity={0.6} />
          <circle cx={cx + eyeSpacing} cy={eyeY} r={eyeR * 1.6} fill="none" stroke={style.eyeColor} strokeWidth={s * 0.015} opacity={0.6} />
          <line x1={cx - eyeSpacing + eyeR * 1.6} y1={eyeY} x2={cx + eyeSpacing - eyeR * 1.6} y2={eyeY} stroke={style.eyeColor} strokeWidth={s * 0.012} opacity={0.6} />
        </>
      )}

      {/* Accessory: monocle */}
      {style.accessory === 'monocle' && (
        <circle cx={cx + eyeSpacing} cy={eyeY} r={eyeR * 1.8} fill="none" stroke="#8b7355" strokeWidth={s * 0.02} />
      )}

      {/* Mouth */}
      {style.mouthShape === 'smile' && !isTalking && (
        <path d={`M ${cx - mouthW} ${mouthY} Q ${cx} ${mouthY + r * 0.15} ${cx + mouthW} ${mouthY}`} fill="none" stroke={style.eyeColor} strokeWidth={s * 0.02} strokeLinecap="round" />
      )}
      {style.mouthShape === 'grin' && !isTalking && (
        <path d={`M ${cx - mouthW * 1.2} ${mouthY} Q ${cx} ${mouthY + r * 0.25} ${cx + mouthW * 1.2} ${mouthY}`} fill="none" stroke={style.eyeColor} strokeWidth={s * 0.025} strokeLinecap="round" />
      )}
      {style.mouthShape === 'smirk' && !isTalking && (
        <path d={`M ${cx - mouthW * 0.5} ${mouthY + r * 0.05} Q ${cx + mouthW * 0.3} ${mouthY - r * 0.05} ${cx + mouthW} ${mouthY - r * 0.1}`} fill="none" stroke={style.eyeColor} strokeWidth={s * 0.02} strokeLinecap="round" />
      )}
      {style.mouthShape === 'flat' && !isTalking && (
        <line x1={cx - mouthW * 0.7} y1={mouthY} x2={cx + mouthW * 0.7} y2={mouthY} stroke={style.eyeColor} strokeWidth={s * 0.02} strokeLinecap="round" />
      )}
      {style.mouthShape === 'open' && !isTalking && (
        <ellipse cx={cx} cy={mouthY} rx={mouthW * 0.5} ry={r * 0.1} fill={style.eyeColor} opacity={0.7} />
      )}
      {/* Talking mouth — animated open/close */}
      {isTalking && (
        <ellipse cx={cx} cy={mouthY} rx={mouthW * 0.6} ry={r * 0.15} fill={style.eyeColor} opacity={0.7} className="animate-persona-mouth" />
      )}
      {/* Happy — big curved smile with squinted eyes */}
      {isHappy && (
        <path d={`M ${cx - mouthW * 1.1} ${mouthY - r * 0.05} Q ${cx} ${mouthY + r * 0.35} ${cx + mouthW * 1.1} ${mouthY - r * 0.05}`} fill="none" stroke={style.eyeColor} strokeWidth={s * 0.025} strokeLinecap="round" />
      )}
      {/* Encouraging — open smile */}
      {isEncouraging && (
        <>
          <path d={`M ${cx - mouthW} ${mouthY} Q ${cx} ${mouthY + r * 0.2} ${cx + mouthW} ${mouthY}`} fill="none" stroke={style.eyeColor} strokeWidth={s * 0.02} strokeLinecap="round" />
          <ellipse cx={cx} cy={mouthY + r * 0.08} rx={mouthW * 0.6} ry={r * 0.08} fill={style.eyeColor} opacity={0.15} />
        </>
      )}
    </svg>
  )
}

export default function PersonaAvatar({ state = 'idle', size = 'md', inline = false }: PersonaAvatarProps) {
  const persona = getPersonaInfo()
  if (!persona) return null

  const pxMap = { sm: 28, md: 36, lg: 52 }
  const px = pxMap[size]
  const sizeClasses = { sm: 'w-7 h-7', md: 'w-9 h-9', lg: 'w-13 h-13' }
  const style = PERSONA_STYLES[persona.id] ?? PERSONA_STYLES.custom

  // Check for custom uploaded avatar
  let customImage: string | null = null
  try {
    const raw = localStorage.getItem('bza-persona')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.avatarUrl) customImage = parsed.avatarUrl
    }
  } catch {}

  return (
    <div className={`relative flex-shrink-0 ${inline ? '' : 'flex flex-col items-center justify-center'}`}>
      {/* Pulse ring for thinking state */}
      {state === 'thinking' && (
        <div className="absolute inset-0 m-auto rounded-full bg-indigo-400/20 animate-ping" style={{ width: px + 8, height: px + 8 }} />
      )}
      {/* Avatar */}
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center relative z-10 ${
          state === 'happy' ? 'bg-green-50 dark:bg-green-950/30 ring-2 ring-green-300 dark:ring-green-600' :
          state === 'encouraging' ? 'bg-amber-50 dark:bg-amber-950/30 ring-2 ring-amber-300 dark:ring-amber-600' :
          `${style.bg} ${state !== 'idle' ? `ring-2 ${style.ring}` : ''}`
        }`}
      >
        {customImage ? (
          <img
            src={customImage}
            alt={persona.name}
            className={`w-full h-full object-cover ${state === 'idle' ? 'animate-persona-idle' : state === 'talking' ? 'animate-persona-talk' : ''}`}
          />
        ) : (
          <AvatarFace style={style} state={state} px={px} />
        )}
      </div>
      {/* Name label */}
      {!inline && state !== 'idle' && (
        <p className="text-[9px] text-center text-gray-400 dark:text-gray-500 mt-0.5 font-medium">
          {state === 'thinking' ? 'Thinking…' : persona.name}
        </p>
      )}
    </div>
  )
}
