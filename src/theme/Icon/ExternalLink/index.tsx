import React, {type ReactNode} from 'react';
import {translate} from '@docusaurus/Translate';
import type {Props} from '@theme/Icon/ExternalLink';
import LucideIcon from '@site/src/components/LucideIcon';

import styles from './styles.module.css';

// Lucide "arrow-up-right", same glyph as the homepage cards
export default function IconExternalLink({width = 14, height = 14}: Props): ReactNode {
  return (
    <LucideIcon
      width={width}
      height={height}
      aria-hidden={undefined}
      aria-label={translate({
        id: 'theme.IconExternalLink.ariaLabel',
        message: '(opens in new tab)',
        description: 'The ARIA label for the external link icon',
      })}
      className={styles.iconExternalLink}>
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </LucideIcon>
  );
}
