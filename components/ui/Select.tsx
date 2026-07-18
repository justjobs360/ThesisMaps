'use client';

import * as RadixSelect from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import React from 'react';

type SelectOption = { value: string; label: string };

type SelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
};

export function Select({ value, onValueChange, options, placeholder = 'Select…', label, disabled }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? <label className="text-[10px] font-black uppercase tracking-widest text-black font-sans">{label}</label> : null}
      <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <RadixSelect.Trigger className="flex h-10 w-full items-center justify-between gap-2 border-2 border-black bg-white px-3 text-[11px] font-sans font-bold uppercase tracking-wider text-black focus:outline-none focus:border-accent data-[placeholder]:text-black/40 disabled:opacity-50">
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon>
            <ChevronDown size={14} strokeWidth={2.5} className="text-black" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content className="z-50 min-w-[8rem] overflow-hidden border-2 border-black bg-white shadow-impact">
            <RadixSelect.Viewport className="p-0">
              {options.map((opt) => (
                <RadixSelect.Item
                  key={opt.value}
                  value={opt.value}
                  className="relative flex cursor-pointer items-center px-3 py-2 text-[11px] font-sans font-bold uppercase tracking-wider text-black select-none hover:bg-black hover:text-white focus:bg-black focus:text-white focus:outline-none data-[highlighted]:bg-black data-[highlighted]:text-white"
                >
                  <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className="absolute right-2">
                    <Check size={12} strokeWidth={3} />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </div>
  );
}
