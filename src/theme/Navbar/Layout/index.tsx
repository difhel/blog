import React, { useEffect, type ReactNode } from 'react';
import clsx from 'clsx';
import { ThemeClassNames, useThemeConfig } from '@docusaurus/theme-common';
import {
  useHideableNavbar,
  useNavbarMobileSidebar,
} from '@docusaurus/theme-common/internal';
import { translate } from '@docusaurus/Translate';
import NavbarMobileSidebar from '@theme/Navbar/MobileSidebar';

import styles from './styles.module.css';

type Props = {
  children: ReactNode;
};

export default function NavbarLayout({ children }: Props): ReactNode {
  const {
    navbar: { hideOnScroll, style },
  } = useThemeConfig();
  const mobileSidebar = useNavbarMobileSidebar();
  const { navbarRef, isNavbarVisible } = useHideableNavbar(hideOnScroll);

  useEffect(() => {
    if (!mobileSidebar.shown) {
      return undefined;
    }

    const closeOnOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest('.navbar-sidebar, .navbar__toggle')) {
        return;
      }

      mobileSidebar.toggle();
    };

    document.addEventListener('pointerdown', closeOnOutsidePointerDown);

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointerDown);
    };
  }, [mobileSidebar]);

  return (
    <div className={clsx('navbar-shell', {'navbar-sidebar--show': mobileSidebar.shown})}>
      <nav
        ref={navbarRef}
        aria-label={translate({
          id: 'theme.NavBar.navAriaLabel',
          message: 'Main',
          description: 'The ARIA label for the main navigation',
        })}
        className={clsx(
          ThemeClassNames.layout.navbar.container,
          'navbar',
          'navbar--fixed-top',
          hideOnScroll && [
            styles.navbarHideable,
            !isNavbarVisible && styles.navbarHidden,
          ],
          {
            'navbar--dark': style === 'dark',
            'navbar--primary': style === 'primary',
          },
        )}>
        {children}
      </nav>
      <NavbarMobileSidebar />
    </div>
  );
}
