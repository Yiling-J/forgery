import { MoreHorizontal } from 'lucide-react'
import React from 'react'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu'

export interface VibeCardAction {
  name: string
  onClick: () => void
  variant?: 'default' | 'destructive'
  icon?: React.ReactNode
}

interface VibeCardProps {
  image?: string
  name: string
  subtitle: string
  color: string
  onClick?: () => void
  index: number
  actions?: VibeCardAction[]
}

export const VibeCard: React.FC<VibeCardProps> = ({
  image,
  name,
  subtitle,
  color,
  onClick,
  index,
  actions = [],
}) => {
  return (
    <div
      onClick={onClick}
      className="group relative h-64 cursor-pointer"
      style={{
        animation: `fadeIn 0.5s ease-out ${Math.min(index * 0.03, 0.5)}s backwards`,
      }}
    >
      <div className={`absolute inset-0`}>
        {/* 1. Base Border (Static Slate - Always visible as the thin border) */}
        <div className="absolute inset-0 bg-slate-200 clip-path-slant" />

        {/* 2. Highlight Border (Blue - Fades in on hover, pre-scaled to avoid growth animation) */}
        <div className="absolute inset-[-3px] bg-cyan-500 clip-path-slant-highlight opacity-0 group-hover:opacity-100 transition-opacity duration-0" />

        {/* 3. Content Layer - Stays fixed size relative to parent, creating the cutout effect */}
        <div className="absolute inset-[1px] bg-slate-100 clip-path-slant overflow-hidden">
          {actions.length > 0 && (
            <div
              className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-white bg-black/10 hover:bg-black/20 hover:text-white"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {actions.map((action, i) => (
                    <DropdownMenuItem
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation()
                        action.onClick()
                      }}
                      className={cn(
                        action.variant === 'destructive' &&
                          'text-red-600 focus:text-red-600 focus:bg-red-50',
                      )}
                    >
                      {action.icon && <span className="mr-2 h-4 w-4">{action.icon}</span>}
                      {action.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          <div className="absolute inset-0 bg-slate-100">
            <img
              src={image}
              alt={name}
              loading="lazy"
              className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110 grayscale group-hover:grayscale-0 opacity-80 group-hover:opacity-100 mix-blend-multiply"
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
