import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm transition-[background-color,border-color,box-shadow,color,opacity] duration-150 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "font-bold bg-primary text-primary-foreground shadow hover:bg-primary/85 active:bg-primary/95",
        destructive:
          "font-bold bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/88 active:bg-destructive/95",
        outline:
          "font-semibold border border-input bg-background shadow-sm hover:border-accent/30 hover:bg-accent/[0.04] hover:text-foreground active:bg-accent/[0.08]",
        secondary:
          "font-semibold bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/70 active:bg-secondary/85",
        ghost:
          "font-semibold hover:bg-accent/[0.06] hover:text-foreground active:bg-accent/[0.1]",
        link: "font-semibold text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
