import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import BlogSidebar from '@theme/BlogSidebar';
import Translate from '@docusaurus/Translate';
import styles from './styles.module.css';
export default function BlogLayout(props) {
  const {sidebar, toc, children, ...layoutProps} = props;
  const hasSidebar = sidebar && sidebar.items.length > 0;
  console.log(props);
  const telegramPost = (
    props.children?.[0].props?.items?.[0]?.content?.frontMatter?.telegram ||
    props.children?.[0].props?.children?.type?.frontMatter?.telegram
  );
  console.log("Telegram Post Linked", telegramPost);
  const comments = telegramPost ? (
    <div id="mountComments"></div>
  ) : (
    <div><Translate>Comments to this post are disabled</Translate></div>
  );
  if (telegramPost) {
    document.addEventListener("DOMContentLoaded", () => {
      let telegramScript = document.createElement("script");
      telegramScript.setAttribute("src", "https://telegram.org/js/telegram-widget.js?22");
      telegramScript.setAttribute("data-telegram-discussion", telegramPost);
      telegramScript.setAttribute("data-comments-limit", "10");
      telegramScript.setAttribute("data-color", "29B127");
      telegramScript.setAttribute("data-dark-color", "72E350");
      document.getElementById("mountComments").insertBefore(telegramScript);
    })
  }
  return (
    <Layout {...layoutProps}>
      <div className="container margin-vert--lg">
        <div className="row">
          <BlogSidebar sidebar={sidebar} />
          <main
            className={clsx('col', {
              'col--7': hasSidebar,
              'col--9 col--offset-1': !hasSidebar,
            })}
            itemScope
            itemType="http://schema.org/Blog">
            {children}
            <div className={clsx(styles.telegramComments)}>
              {comments}
            </div>
          </main>
          {toc && <div className="col col--2">{toc}</div>}
        </div>
      </div>
    </Layout>
  );
}
