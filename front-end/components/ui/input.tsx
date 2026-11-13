import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base text-slate-900 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium hover:border-slate-400 focus-visible:border-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 aria-[invalid=true]:border-red-600",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
