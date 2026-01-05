import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({
    className,
    ...props
}) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                "border-gray-200 focus-visible:ring-blue-400 focus-visible:border-blue-500", // matching project theme
                className
            )}
            {...props} />
    );
}

export { Textarea }
