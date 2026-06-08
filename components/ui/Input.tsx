import React from 'react';

type InputProps = {
  label?: string;
  error?: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-2">
        {label ? (
          <label htmlFor={inputId} className="text-[10px] font-black text-black font-sans uppercase tracking-widest">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={[
            'h-11 w-full border-2 bg-white px-4 py-2 text-sm font-sans font-bold text-black placeholder:text-black/30',
            'transition-all duration-150 focus:outline-none focus:border-accent ring-0',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-red-600' : 'border-black',
            className,
          ].join(' ')}
          {...props}
        />
        {error ? <p className="text-[10px] text-red-600 font-sans font-bold uppercase tracking-wider">{error}</p> : null}
        {hint && !error ? <p className="text-[10px] text-black/60 font-sans font-bold uppercase tracking-wider">{hint}</p> : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
