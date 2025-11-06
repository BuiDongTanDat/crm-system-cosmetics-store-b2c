import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  // base
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/30",
  {
    variants: {
      variant: {
        default:
          " dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        outline:
          "w-full h-10 pl-3 pr-3 rounded-md border border-gray-200 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
        filled:
          "w-full h-10 pl-3 pr-3 rounded-md bg-muted/10 border-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30",
        project:
          "hover:border-blue-500 w-full h-10 pl-9 pr-3 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all border-gray-200 bg-white/90 dark:bg-gray-800/90",
        normal:
          "hover:border-blue-500 w-full h-10 pr-3 pl-3 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all border-gray-200 bg-white/90 dark:bg-gray-800/90",  
        },
      size: {
        default: "h-9",
        sm: "h-8 text-sm px-2",
        lg: "h-11 text-base px-4",
      },
    },
    defaultVariants: {
      variant: "project", // changed: project is now the default style
      size: "default",
    },
  }
)

function Input({
  className,
  type,
  variant,
  size,
  ...props
}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant, size }), className)}
      {...props} />
  );
}

export { Input }
