import React, {type ComponentProps} from 'react';
import LucideIcon from '@site/src/components/LucideIcon';

// Lucide "info"
export default function AdmonitionIconInfo(props: ComponentProps<'svg'>): JSX.Element {
  return (
    <LucideIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </LucideIcon>
  );
}
