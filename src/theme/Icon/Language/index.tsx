import React, {type ReactNode} from 'react';
import type {Props} from '@theme/Icon/Language';
import LucideIcon from '@site/src/components/LucideIcon';

// Lucide "languages"
export default function IconLanguage(props: Props): ReactNode {
  return (
    <LucideIcon width={18} height={18} {...props}>
      <path d="m5 8 6 6" />
      <path d="m4 14 6-6 2-3" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="m22 22-5-10-5 10" />
      <path d="M14 18h6" />
    </LucideIcon>
  );
}
