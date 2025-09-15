'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface PopoverContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PopoverContext = React.createContext<PopoverContextType | undefined>(undefined);

export function Popover({ open = false, onOpenChange, children }: PopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(open);

  const isControlled = onOpenChange !== undefined;
  const openState = isControlled ? open : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  return (
    <PopoverContext.Provider value={{ open: openState, onOpenChange: setOpen }}>
      {children}
    </PopoverContext.Provider>
  );
}

interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ asChild, children, onClick, ...props }, ref) => {
    const context = React.useContext(PopoverContext);

    if (!context) {
      throw new Error('PopoverTrigger must be used within Popover');
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      context.onOpenChange(!context.open);
      onClick?.(e);
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ref,
        onClick: handleClick,
        ...props,
      });
    }

    return (
      <button ref={ref} onClick={handleClick} {...props}>
        {children}
      </button>
    );
  }
);
PopoverTrigger.displayName = 'PopoverTrigger';

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = 'center', side = 'bottom', ...props }, ref) => {
    const context = React.useContext(PopoverContext);

    if (!context) {
      throw new Error('PopoverContent must be used within Popover');
    }

    if (!context.open) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          side === 'bottom' && 'slide-in-from-top-2',
          side === 'top' && 'slide-in-from-bottom-2',
          side === 'right' && 'slide-in-from-left-2',
          side === 'left' && 'slide-in-from-right-2',
          className
        )}
        style={{
          top: side === 'bottom' ? '100%' : side === 'top' ? 'auto' : '50%',
          bottom: side === 'top' ? '100%' : 'auto',
          left: side === 'right' ? '100%' : align === 'start' ? '0' : align === 'end' ? 'auto' : '50%',
          right: side === 'left' ? '100%' : align === 'end' ? '0' : 'auto',
          transform:
            side === 'left' || side === 'right'
              ? 'translateY(-50%)'
              : align === 'center'
              ? 'translateX(-50%)'
              : undefined,
          marginTop: side === 'bottom' ? '4px' : undefined,
          marginBottom: side === 'top' ? '4px' : undefined,
          marginLeft: side === 'right' ? '4px' : undefined,
          marginRight: side === 'left' ? '4px' : undefined,
        }}
        {...props}
      />
    );
  }
);
PopoverContent.displayName = 'PopoverContent';