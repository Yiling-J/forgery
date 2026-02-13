import { Hexagon } from 'lucide-react'
import { ReactNode } from 'react'
import { cn } from '../lib/utils'

interface PageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  className?: string
  sticky?: boolean
  topOffset?: string
}

export function PageHeader({
  title,
  subtitle,
  actions,
  children,
  className,
  sticky = true,
  topOffset = '4rem', // Default to 16 (4rem) below global header
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'w-full flex flex-col gap-4 pb-4 pt-2 transition-all duration-300',
        sticky &&
          'sticky z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className,
      )}
      style={sticky ? { top: topOffset } : undefined}
    >
      <div className="flex justify-between items-end animate-fade-in-down">
        <div>
          {subtitle && (
            <div className="flex items-center gap-2 text-cyan-600 mb-2 tracking-[0.3em] text-xs font-mono uppercase">
              <Hexagon size={12} className="animate-spin-slow" />
              {subtitle}
            </div>
          )}
          <h1 className="text-3xl md:text-5xl font-display font-black uppercase text-slate-900 tracking-tighter">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">
              {title}
            </span>
          </h1>
        </div>
        {actions && <div className="flex items-center gap-4">{actions}</div>}
      </div>
      {children && <div className="animate-fade-in-down delay-100">{children}</div>}
    </div>
  )
}
