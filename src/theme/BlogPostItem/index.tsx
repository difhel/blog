import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import { useBlogPost } from '@docusaurus/plugin-content-blog/client';
import BlogPostItemContainer from '@theme/BlogPostItem/Container';
import BlogPostItemHeader from '@theme/BlogPostItem/Header';
import BlogPostItemContent from '@theme/BlogPostItem/Content';
import BlogPostItemFooter from '@theme/BlogPostItem/Footer';
import type { Props } from '@theme/BlogPostItem';

// Black Glass: the list view is a card (cover on top, body below); the post page gets the
// cover as a hero under its header. Styles live in src/css/blog-black-glass.css.
export default function BlogPostItem({
  children,
  className,
}: Props): JSX.Element {
  const { isBlogPostPage, frontMatter, assets, metadata } = useBlogPost();
  const excerpt = (frontMatter as any).cutHtml || frontMatter.description;

  if (!isBlogPostPage) {
    return (
      <BlogPostItemContainer className={clsx('bg-card', className)}>
        {assets.image && (
          <Link to={metadata.permalink} className="bg-card__media" tabIndex={-1} aria-hidden="true">
            <img src={assets.image} alt="" loading="lazy" />
          </Link>
        )}
        <div className="bg-card__body">
          <BlogPostItemHeader />
          {excerpt && (
            <div className="bg-card__excerpt" dangerouslySetInnerHTML={{ __html: excerpt }} />
          )}
          <BlogPostItemContent>{children}</BlogPostItemContent>
          <BlogPostItemFooter />
        </div>
      </BlogPostItemContainer>
    );
  }

  return (
    <BlogPostItemContainer className={clsx('bg-post', className)}>
      <BlogPostItemHeader />
      {assets.image && (
        <img src={assets.image} className="bg-post__cover" alt="" />
      )}
      <BlogPostItemContent>{children}</BlogPostItemContent>
      <BlogPostItemFooter />
    </BlogPostItemContainer>
  );
}
