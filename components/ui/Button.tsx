import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  pill?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const variantClasses: Record<Variant, string> = {
  primary: 'bg-black text-white hover:bg-accent border border-black hover:border-accent',
  secondary: 'bg-white text-black border-2 border-black hover:bg-black hover:text-white',
  ghost: 'bg-transparent text-text-muted hover:text-black hover:bg-gray-100 border border-transparent',
  danger: 'bg-red-600 text-white hover:bg-red-700 border border-transparent',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm uppercase tracking-wider font-bold',
  md: 'px-6 py-3 text-sm uppercase tracking-wider font-bold',
  lg: 'px-8 py-4 text-base uppercase tracking-widest font-bold',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  pill = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled ?? loading}
      className={[
        // Every property that any variant animates is listed, on the one shared
        // curve and the 400ms tier. `transition-colors duration-150` before this
        // meant a button's colour swapped on a different curve and in a third of
        // the time of everything else it sat next to.
        'inline-flex items-center justify-center gap-2 font-sans font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-base ease-tm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        pill ? 'rounded-full' : 'rounded',
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden />
      ) : null}
      {children}
    </button>
  );
}
