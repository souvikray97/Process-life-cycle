import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  // Tactile 3D feel WITHOUT movement: the button never scales, lifts, or shifts. A faint
  // resting shadow makes it look slightly raised; on hover a tinted drop shadow deepens so
  // it reads as pressable. The shadow is cast straight down (x-offset 0) to match the
  // top-down light source of the Cards' shadow-sm — one consistent light source across the
  // UI. Only box-shadow / colours transition, so nothing reflows. Per-variant tints live in
  // the variant classes below.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[box-shadow,background-color,border-color,color] duration-200 ease-out shadow-sm disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:hover:shadow-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Each variant's hover shadow tint is a lighter shade of that variant's own colour
        // (e.g. a green button → green-tinted shadow), so the 3D lift reads as belonging to
        // the button rather than a single global blue. Cast straight down, no transform.
        default:
          'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_9px_22px_-3px_rgba(79,70,229,0.6)]',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 hover:shadow-[0_9px_22px_-3px_rgba(248,113,113,0.75)] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        // Blue — used for the clock controls (Advance / Revert).
        info:
          'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-[0_9px_22px_-3px_rgba(96,165,250,0.8)]',
        // Green — generic positive / start actions.
        success:
          'bg-green-600 text-white hover:bg-green-700 hover:shadow-[0_9px_22px_-3px_rgba(74,222,128,0.8)]',
        // Sky — the standardized Ready-state colour. Deliberately kept at sky-500 to match
        // the Ready lane and Ready process chips (a created process enters Ready); the colour
        // carries that semantic, so it is not darkened for contrast.
        ready:
          'bg-sky-500 text-white hover:bg-sky-600 hover:shadow-[0_9px_22px_-3px_rgba(56,189,248,0.85)]',
        // Yellow — the I/O-wait colour. Dark text on yellow: white-on-yellow-500 failed
        // WCAG contrast, so the label uses yellow-950 while keeping the recognizable fill.
        warning:
          'bg-yellow-500 text-yellow-950 hover:bg-yellow-600 hover:shadow-[0_9px_22px_-3px_rgba(250,204,21,0.85)]',
        outline:
          'border-2 border-gray-400 bg-background hover:bg-accent hover:border-gray-500 hover:text-accent-foreground hover:shadow-[0_9px_22px_-3px_rgba(148,163,184,0.6)] dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-[0_9px_22px_-3px_rgba(148,163,184,0.6)]',
        ghost:
          'shadow-none hover:bg-accent hover:text-accent-foreground hover:shadow-[0_8px_18px_-4px_rgba(148,163,184,0.5)] dark:hover:bg-accent/50',
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
