import * as React from "react"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  variant,
  ...props
}) {
  // class cho variant mới "project"
  const projectClass = "w-full h-10 pl-9 pr-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all border-gray-200 bg-white/90 dark:bg-gray-800/90";

  // lớp mặc định hiện tại
  const defaultClass = "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

  // focus/aria-invalid lớp mặc định (không áp dụng cho project vì đã bao gồm focus)
  const defaultFocus = "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive";

  const classes = variant === 'project'
    ? cn(projectClass, className)
    : cn(defaultClass, defaultFocus, className);

  return (
    <input
      type={type}
      data-slot="input"
      className={classes}
      {...props} />
  );
}

export { Input }
