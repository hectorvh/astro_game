import { forwardRef, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Shared control sizing — large targets + legible type for older adults. */
const controlBase =
  'w-full rounded-xl border-2 border-input bg-card px-4 py-3.5 text-lg text-card-foreground ' +
  'placeholder:text-muted-foreground/70 shadow-sm transition-colors ' +
  'focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 ' +
  'aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20 ' +
  'disabled:cursor-not-allowed disabled:opacity-60'

export function FieldLabel({
  htmlFor,
  icon,
  children,
  hint,
}: {
  htmlFor?: string
  icon?: ReactNode
  children: ReactNode
  hint?: string
}) {
  return (
    <label htmlFor={htmlFor} className="mb-2 flex items-center gap-2 text-base font-bold text-foreground">
      {icon ? (
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-full bg-primary/12 text-primary [&_svg]:size-4"
        >
          {icon}
        </span>
      ) : null}
      <span>{children}</span>
    </label>
  )
}

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm font-semibold text-destructive">
      {message}
    </p>
  )
}

export const TextInput = forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  function TextInput({ className, ...props }, ref) {
    return <input ref={ref} className={cn(controlBase, className)} {...props} />
  },
)

export const NativeSelect = forwardRef<HTMLSelectElement, React.ComponentProps<'select'>>(
  function NativeSelect({ className, children, ...props }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(controlBase, 'appearance-none pr-12', className)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-muted-foreground"
        />
      </div>
    )
  },
)
