import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const twMerge = extendTailwindMerge<'type'>({
  extend: {
    theme: {
      spacing: [
        'control-sm',
        'control-md',
        'control-touch-sm',
        'control-touch',
        'input',
        'icon-button-small',
        'icon-button-medium',
        'icon-button-large',
        'sidebar-tablet',
        'sidebar-desktop',
        'panel-tablet',
        'panel-desktop',
      ],
      radius: ['1', '2', '4', '5', '6', '7', '8', '10', '12', '16', 'full'],
      shadow: [
        'small',
        'popover',
        'drag',
        'panel',
        'raised',
        'focus-accent',
        'focus-danger',
      ],
    },
    classGroups: {
      type: [{ type: [() => true] }],
    },
    conflictingClassGroups: {
      type: [
        'font-family',
        'font-size',
        'font-weight',
        'leading',
        'tracking',
        'text-transform',
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
