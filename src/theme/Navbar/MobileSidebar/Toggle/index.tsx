import React, { type ReactNode } from 'react';
import { translate } from '@docusaurus/Translate';
import { useNavbarMobileSidebar } from '@docusaurus/theme-common/internal';
import LucideIcon from '@site/src/components/LucideIcon';

// Lucide "panel-left-open"; the chevron flips when the sidebar is open
function SidebarToggleIcon(): ReactNode {
  return (
    <LucideIcon className="navbar__sidebar-toggle-icon" width={20} height={20}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
      <path className="navbar__sidebar-toggle-arrow" d="m14 9 3 3-3 3" />
    </LucideIcon>
  );
}

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
      <SidebarToggleIcon />
    </button>
  );
}
