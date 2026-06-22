import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl bg-muted/50 hover:bg-muted dark:bg-muted/20 dark:hover:bg-muted/30 px-4 py-2 text-base md:text-sm border border-transparent focus-visible:border-primary focus-visible:bg-transparent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
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
