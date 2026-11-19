import React, {type ComponentProps} from 'react';
import LucideIcon from '@site/src/components/LucideIcon';

// Lucide "triangle-alert"
export default function AdmonitionIconWarning(props: ComponentProps<'svg'>): JSX.Element {
  return (
    <LucideIcon {...props}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </LucideIcon>
  );
}
