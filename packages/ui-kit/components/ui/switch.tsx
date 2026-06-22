"use client";

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
    // Internal state for uncontrolled usage, though normally controlled
    const [isInternalChecked, setIsInternalChecked] = React.useState(checked || false);
    
    // Sync with prop if it changes
    React.useEffect(() => {
      if (checked !== undefined) {
        setIsInternalChecked(checked);
      }
    }, [checked]);

    const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      const newValue = !isInternalChecked;
      if (checked === undefined) {
        setIsInternalChecked(newValue);
      }
      onCheckedChange?.(newValue);
      props.onClick?.(e);
    };

    return (
      <button
        type="button"
        role="switch"
        aria-checked={isInternalChecked}
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0E14] disabled:cursor-not-allowed disabled:opacity-50",
          isInternalChecked ? "bg-indigo-500" : "bg-white/10",
          className
        )}
        ref={ref}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
            isInternalChecked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
