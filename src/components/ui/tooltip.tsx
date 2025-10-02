import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const TooltipContext = React.createContext<TooltipContextValue | undefined>(undefined)

const useTooltipContext = () => {
  const context = React.useContext(TooltipContext)
  if (!context) {
    throw new Error("Tooltip components must be used within Tooltip")
  }
  return context
}

interface TooltipProps {
  children: React.ReactNode
}

export function Tooltip({ children }: TooltipProps) {
  const [open, setOpen] = React.useState(false)
  
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">
        {children}
      </div>
    </TooltipContext.Provider>
  )
}

interface TooltipTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

export function TooltipTrigger({ children, asChild }: TooltipTriggerProps) {
  const { setOpen } = useTooltipContext()
  
  const childElement = React.Children.only(children) as React.ReactElement
  
  if (asChild && React.isValidElement(childElement)) {
    return React.cloneElement(childElement, {
      onMouseEnter: () => setOpen(true),
      onMouseLeave: () => setOpen(false),
      onFocus: () => setOpen(true),
      onBlur: () => setOpen(false),
    } as any)
  }
  
  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
    </div>
  )
}

interface TooltipContentProps {
  children: React.ReactNode
  className?: string
}

export function TooltipContent({ children, className }: TooltipContentProps) {
  const { open } = useTooltipContext()
  
  if (!open) return null
  
  return (
    <div
      className={cn(
        "absolute z-50 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-100 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md shadow-lg",
        "bottom-full left-1/2 transform -translate-x-1/2 mb-2 backdrop-blur-sm",
        "animate-in fade-in-0 zoom-in-95",
        "whitespace-nowrap",
        className
      )}
      role="tooltip"
    >
      {children}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
        <div className="border-4 border-transparent border-t-white dark:border-t-slate-800" />
      </div>
    </div>
  )
}

