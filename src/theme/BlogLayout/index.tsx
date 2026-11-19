import React, { useEffect, useRef, type ReactNode } from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import BlogSidebar from '@theme/BlogSidebar';
import { useColorMode } from '@docusaurus/theme-common';

import type { Props } from '@theme/BlogLayout';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

import styles from './styles.module.css';

// Black Glass accent (light / dark), without '#': the widget takes bare hex.
const ACCENT_LIGHT = '5B5BD6';
const ACCENT_DARK = 'A5B4FF';

// Telegram discussion widget for the post's channel message (frontMatter.telegram).
// The widget renders into an iframe with its own theme, so it is recreated whenever the
// site's color mode changes; `data-dark` switches the iframe to dark text colors.
function TelegramComments({ post }: { post: string }): ReactNode {
  const { colorMode } = useColorMode();
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    mount.replaceChildren();
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-discussion', post);
    script.setAttribute('data-comments-limit', '10');
    script.setAttribute('data-color', ACCENT_LIGHT);
    script.setAttribute('data-dark-color', ACCENT_DARK);
    if (colorMode === 'dark') {
      script.setAttribute('data-dark', '1');
    }
    mount.appendChild(script);
    return () => mount.replaceChildren();
  }, [post, colorMode]);

  return <div ref={mountRef} className={styles.telegramComments} />;
}

export default function BlogLayout(props: Props): ReactNode {
  const { sidebar, toc, children, ...layoutProps } = props;
  const hasSidebar = sidebar && sidebar.items.length > 0;

  const telegramPost: string | undefined = (
    props.children as any
  )?.[1]?.props?.children?.type?.frontMatter?.telegram;

  const showComments =
    !!telegramPost &&
    !(ExecutionEnvironment.canUseDOM && location.pathname.endsWith('blog'));

  return (
    <Layout {...layoutProps}>
      <div className="container margin-vert--lg">
        <div className="row">
          <BlogSidebar sidebar={sidebar} />
          <main
            className={clsx('col', {
              'col--7': hasSidebar,
              'col--9 col--offset-1': !hasSidebar,
            })}>
            {children}
            {showComments && <TelegramComments post={telegramPost} />}
          </main>
          {toc && <div className="col col--2">{toc}</div>}
        </div>
      </div>
    </Layout>
  );
}
