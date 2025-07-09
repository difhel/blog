import React, { useEffect, useRef, type ReactNode } from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import BlogSidebar from '@theme/BlogSidebar';

import type { Props } from '@theme/BlogLayout';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

import styles from './styles.module.css';

function bindComments(telegramPost) {
  console.log("bindComments", telegramPost);
  const hasRun = useRef(false);
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    console.log("DOMContentLoaded");
    let telegramScript = document.createElement("script");
    telegramScript.setAttribute("src", "https://telegram.org/js/telegram-widget.js?22");
    telegramScript.setAttribute("data-telegram-discussion", telegramPost);
    telegramScript.setAttribute("data-comments-limit", "10");
    telegramScript.setAttribute("data-color", "29B127");
    telegramScript.setAttribute("data-dark-color", "72E350");
    let mountCommentsNode = document.getElementById("mountComments");
    mountCommentsNode.parentNode.insertBefore(telegramScript, mountCommentsNode);
    console.log("Telegram script added");
  });

  return <div id="mountComments"></div>

}

export default function BlogLayout(props: Props): ReactNode {
  const { sidebar, toc, children, ...layoutProps } = props;
  const hasSidebar = sidebar && sidebar.items.length > 0;

   // console.log(props);
   const telegramPost: string | undefined = (
    // props.children?.[0].props?.items?.[0]?.content?.frontMatter?.telegram ||
    props.children?.[1]?.props?.children?.type?.frontMatter?.telegram
    // props.children?.[1].props?.children
  );

  console.log("Telegram Post Linked", telegramPost);

  const comments = telegramPost ? (
    <>
      {bindComments(telegramPost)}
    </>
  ) : null;

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
            {
              ExecutionEnvironment.canUseDOM && location.pathname.endsWith("blog")
                ? null
                : (
                  <div className={clsx(styles.telegramComments)}>
                    {comments}
                  </div>
                )
            }
          </main>
          {toc && <div className="col col--2">{toc}</div>}
        </div>
      </div>
    </Layout>
  );
}