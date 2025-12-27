import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

const checkboxVariants = cva(
  "peer shrink-0 rounded-sm border shadow  disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:text-white",
  {
    variants: {
      variant: {
        default: "h-4 w-4 border-primary data-[state=checked]:bg-primary",
        primary: "h-5 w-5 border-blue-500 data-[state=checked]:bg-blue-500",
        table:
          "cursor-pointer h-6 w-6 border-gray-300 hover:border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500",
        danger: "h-5 w-5 border-red-500 data-[state=checked]:bg-red-500",
        all:
          "cursor-pointer h-6 w-6 border-gray-300 hover:border-green-500 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500",
        
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Checkbox = React.forwardRef(({ className, variant, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(checkboxVariants({ variant }), className)}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center ">
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
