import React, {type ComponentProps, type ReactNode} from 'react';

type Props = ComponentProps<'svg'> & {children: ReactNode};

// Line icon in the Lucide style used by the Black Glass design system:
// 24px grid, 2px round stroke, colored by `currentColor`.
export default function LucideIcon({children, className, ...props}: Props): JSX.Element {
  return (
    <svg
      className={className ? `lucide-icon ${className}` : 'lucide-icon'}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}>
      {children}
    </svg>
  );
}
