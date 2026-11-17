import * as React from "react"

import { cn } from "@/lib/utils"
import { aceitaNegativo, removerSinalNegativo, teclaBloqueada } from "@/lib/numberInput.ts"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onKeyDown, onChange, ...props }, ref) => {
    // Numeric fields never take a negative number: the sign cannot be typed or pasted.
    const soNaoNegativo = type === "number" && !aceitaNegativo(props.min)

    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base text-slate-900 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium hover:border-slate-400 focus-visible:border-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 aria-[invalid=true]:border-red-600",
          className
        )}
        ref={ref}
        onKeyDown={(e) => {
          if (soNaoNegativo && teclaBloqueada(e.key)) {
            e.preventDefault()
            return
          }
          onKeyDown?.(e)
        }}
        onChange={(e) => {
          if (soNaoNegativo) {
            const limpo = removerSinalNegativo(e.target.value)
            if (limpo !== e.target.value) e.target.value = limpo
          }
          onChange?.(e)
        }}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
