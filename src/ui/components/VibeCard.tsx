import React from 'react'

interface VibeCardProps {
  image?: string
  name: string
  subtitle: string
  color: string
  onClick?: () => void
  index: number
}

export const VibeCard: React.FC<VibeCardProps> = ({
  image,
  name,
  subtitle,
  color,
  onClick,
  index,
}) => {
  return (
    <div
      onClick={onClick}
      className="group relative h-64 cursor-pointer"
      style={{
        animation: `fadeIn 0.5s ease-out ${Math.min(index * 0.03, 0.5)}s backwards`,
      }}
    >
      {/* Wrapper for the Drop Shadow (Outer Glow) */}
      <div className={`absolute inset-0`}>
        {/* 1. Base Border (Static Slate - Always visible as the thin border) */}
        <div className="absolute inset-0 bg-slate-200 clip-path-slant" />

        {/* 2. Highlight Border (Blue - Fades in on hover, pre-scaled to avoid growth animation) */}
        {/* Scale 1.035 is approx 70% of the previous 1.05 scale. */}
        <div className="absolute inset-0 bg-cyan-500 clip-path-slant opacity-0 group-hover:opacity-100 transition-opacity duration-0 scale-[1.035]" />

        {/* 3. Content Layer - Stays fixed size relative to parent, creating the cutout effect */}
        <div className="absolute inset-[1px] bg-slate-100 clip-path-slant overflow-hidden z-10">
          <div className="absolute inset-0 bg-slate-100">
            <img
              src={image}
              alt={name}
              loading="lazy"
              className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-110 grayscale group-hover:grayscale-0 opacity-80 group-hover:opacity-100 mix-blend-multiply"
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-90 group-hover:opacity-80 transition-opacity duration-300" />
          </div>

          <div className="absolute inset-0 p-3 flex flex-col justify-end">
            <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
              <div
                className="h-0.5 w-6 mb-2 transition-all duration-300 group-hover:w-12"
                style={{ backgroundColor: color }}
              />
              <h2 className="text-sm font-display font-bold uppercase text-white mb-0.5 tracking-wider truncate drop-shadow-sm">
                {name}
              </h2>
              <span className="text-[10px] font-mono text-slate-200 uppercase tracking-widest block font-semibold truncate">
                {subtitle}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
