import React, {type ReactNode} from 'react';
import type {Props} from '@theme/Icon/DarkMode';
import LucideIcon from '@site/src/components/LucideIcon';

// Lucide "moon"
export default function IconDarkMode(props: Props): ReactNode {
  return (
    <LucideIcon width={20} height={20} {...props}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </LucideIcon>
  );
}
