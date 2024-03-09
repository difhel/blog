import React, { useEffect, useState } from 'react';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import BlogSidebar from '@theme/BlogSidebar';
import Translate from '@docusaurus/Translate';
import styles from './styles.module.css';

function bindComments(telegramPost) {
  const [DOMRendered, setDOMRendered] = useState(false);
  useEffect(() => {
    if (DOMRendered) return;
    setDOMRendered(true);
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
  })
  return (<></>);
}

export default function BlogLayout(props) {
  const {sidebar, toc, children, ...layoutProps} = props;
  const hasSidebar = sidebar && sidebar.items.length > 0;
  console.log(props);
  const telegramPost = (
    // props.children?.[0].props?.items?.[0]?.content?.frontMatter?.telegram ||
    props.children?.[1]?.props?.children?.type?.frontMatter?.telegram
    // props.children?.[1].props?.children
  );
  console.log("Telegram Post Linked", telegramPost);
  const comments = telegramPost ? (
    <>
      <div id="mountComments"></div>
      {bindComments(telegramPost)}
    </>
  ) : (
    <div><Translate>Comments to this post are disabled</Translate></div>
  );
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
            {
              ExecutionEnvironment.canUseDOM && location.href.endsWith("blog") ? null : (
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
