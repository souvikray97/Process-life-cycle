import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  // Tactile 3D feel WITHOUT movement: the button never scales, lifts, or shifts. A faint
  // resting shadow makes it look slightly raised; on hover a tinted, directional (down-right)
  // drop shadow deepens so it reads as pressable. Only box-shadow / colours transition, so
  // nothing reflows. Per-variant tints live in the variant classes below.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[box-shadow,background-color,border-color,color] duration-200 ease-out shadow-sm disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:hover:shadow-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[6px_9px_22px_-3px_rgba(79,70,229,0.7)]',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 hover:shadow-[6px_9px_22px_-3px_rgba(220,38,38,0.7)] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border-2 border-gray-400 bg-background hover:bg-accent hover:border-gray-500 hover:text-accent-foreground hover:shadow-[6px_9px_22px_-3px_rgba(37,99,235,0.6)] dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-[6px_9px_22px_-3px_rgba(100,116,139,0.65)]',
        ghost:
          'shadow-none hover:bg-accent hover:text-accent-foreground hover:shadow-[5px_8px_18px_-4px_rgba(37,99,235,0.5)] dark:hover:bg-accent/50',
        link: 'shadow-none hover:shadow-none text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
