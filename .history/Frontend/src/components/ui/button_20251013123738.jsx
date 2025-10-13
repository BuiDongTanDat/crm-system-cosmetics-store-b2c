import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        
        // Thêm variant mới cho menu
        menuItem: "w-full justify-start text-muted-foreground hover:bg-brand/10 hover:text-brand data-[active=true]:bg-brand data-[active=true]:text-white  hover:scale-105 active:scale-95",
        menuSubmenu: "w-full justify-start text-muted-foreground hover:bg-brand/10 hover:text-brand data-[active=true]:bg-brand data-[active=true]:text-white hover:scale-105 active:scale-95",
        subMenuItem: "w-full justify-between font-normal text-muted-foreground hover:bg-brand/10 hover:text-brand data-[active=true]:bg-brand/15 data-[active=true]:text-brand data-[active=true]:font-semibold hover:scale-105 active:scale-95",
        

        //Variant action button
        // Thêm variant mới cho action button
        actionNormal: "bg-white hover:border-brand hover:border hover:text-brand transition-colors border border-none text-gray-700",
        
        // CRUD Action Variants
        actionCreate: "bg-blue-600 text-white hover:bg-blue-700",
        actionRead: "bg-brand/10   hover:bg-brand text-brand hover:text-brand-foreground",
        actionUpdate: "bg-brand/10   hover:bg-brand text-brand hover:text-brand-foreground",
        actionDelete: "bg-red-100 text-destructive hover:bg-red-500 hover:text-white",
        
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",

        // Thêm size cho menu
        menuItem: "h-auto px-3 py-2.5 gap-3",
        subMenuItem: "h-auto px-3 py-2 gap-1",
        
        // Size cho product
        productAction: "h-8 px-3 py-1 text-xs",
        productCard: "w-full h-full p-4"
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
