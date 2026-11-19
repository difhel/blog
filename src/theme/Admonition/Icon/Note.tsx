import React, {type ComponentProps} from 'react';
import LucideIcon from '@site/src/components/LucideIcon';

// Lucide "sticky-note"
export default function AdmonitionIconNote(props: ComponentProps<'svg'>): JSX.Element {
  return (
    <LucideIcon {...props}>
      <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" />
      <path d="M15 3v4a2 2 0 0 0 2 2h4" />
    </LucideIcon>
  );
}
