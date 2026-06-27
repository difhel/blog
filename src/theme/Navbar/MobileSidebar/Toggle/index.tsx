import React, { type ReactNode } from 'react';
import { translate } from '@docusaurus/Translate';
import { useNavbarMobileSidebar } from '@docusaurus/theme-common/internal';
import IconClose from '@theme/Icon/Close';
import IconMenu from '@theme/Icon/Menu';

export default function MobileSidebarToggle(): ReactNode {
  const { shown, toggle } = useNavbarMobileSidebar();

  return (
    <button
      onClick={toggle}
      aria-label={translate({
        id: 'theme.docs.sidebar.toggleSidebarButtonAriaLabel',
        message: 'Toggle navigation bar',
        description:
          'The ARIA label for hamburger menu button of mobile navigation',
      })}
      aria-expanded={shown}
      className="navbar__toggle clean-btn"
      type="button">
      {shown ? (
        <IconClose
          aria-hidden
          width={30}
          height={30}
          strokeWidth={1.5}
        />
      ) : (
        <IconMenu />
      )}
    </button>
  );
}
