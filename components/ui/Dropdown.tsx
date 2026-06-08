'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import React from 'react';

export type DropdownItem = {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
};

type DropdownProps = {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'start' | 'center' | 'end';
};

export function Dropdown({ trigger, items, align = 'end' }: DropdownProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={8}
          className="z-50 min-w-[12rem] overflow-hidden border-2 border-black bg-white shadow-impact p-0"
        >
          {items.map((item, i) => (
            <DropdownMenu.Item
              key={i}
              disabled={item.disabled}
              onSelect={item.onClick}
              className={[
                'flex items-center gap-3 px-4 py-3 text-xs font-sans font-bold uppercase tracking-widest cursor-pointer select-none focus:outline-none border-b border-black last:border-b-0',
                'hover:bg-black hover:text-white data-[highlighted]:bg-black data-[highlighted]:text-white data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
                item.danger ? 'text-red-600 hover:text-white' : 'text-black',
              ].join(' ')}
            >
              {item.icon ? <span>{item.icon}</span> : null}
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
