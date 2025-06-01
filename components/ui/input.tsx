import * as React from "react";

import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<"input"> {
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

function Input({
  className,
  type,
  startAdornment,
  endAdornment,
  ...props
}: InputProps) {
  const hasAdornments = startAdornment || endAdornment;

  if (!hasAdornments) {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-8 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-base",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className
        )}
        onChange={(e) => {
          props.onChange?.(e);
        }}
        {...props}
      />
    );
  }

  return (
    <div
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-8 w-full min-w-0 rounded-md border bg-transparent text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-base",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        "has-[:invalid]:ring-destructive/20 dark:has-[:invalid]:ring-destructive/40 has-[:invalid]:border-destructive",
        className
      )}
      data-slot="input"
    >
      {startAdornment && (
        <div className="flex items-center justify-center px-3 text-muted-foreground">
          {startAdornment}
        </div>
      )}
      <input
        type={type}
        className="flex-1 bg-transparent outline-none py-1 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      />
      {endAdornment && (
        <div className="flex items-center justify-center px-3 text-muted-foreground">
          {endAdornment}
        </div>
      )}
    </div>
  );
}

export { Input };
