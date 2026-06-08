'use client';

import * as RadixTooltip from '@radix-ui/react-tooltip';
import React from 'react';

type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
};

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={300}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            sideOffset={4}
            className="z-50 max-w-xs rounded bg-background-dark px-2.5 py-1.5 text-xs text-white font-sans shadow-md animate-in fade-in-0 zoom-in-95"
          >
            {content}
            <RadixTooltip.Arrow className="fill-background-dark" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
