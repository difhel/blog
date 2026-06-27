import React, { type ReactNode } from 'react';

import type { Props } from '@theme/Root';

export default function Root({ children }: Props): ReactNode {
  return <>{children}</>;
}
