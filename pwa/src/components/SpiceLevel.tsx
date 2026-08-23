import { Flame } from 'lucide-react'

interface SpiceLevelProps {
  level: string | number
  isDarkMode?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const SpiceLevel = ({ level, isDarkMode = false, size = 'md' }: SpiceLevelProps) => {
  const numLevel = typeof level === 'string' ? parseInt(level) : level
  const sizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  return (
    <div className="flex items-center gap-1">
      {[...Array(3)].map((_, i) => (
        <Flame
          key={i}
          className={`${sizeClasses[size]} ${
            i < numLevel 
              ? "text-red-500 fill-red-500" 
              : isDarkMode ? "text-gray-600" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  )
}
