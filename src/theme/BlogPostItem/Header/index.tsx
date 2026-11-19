import React from 'react';
import BlogPostItemHeaderTitle from '@theme/BlogPostItem/Header/Title';
import BlogPostItemHeaderInfo from '@theme/BlogPostItem/Header/Info';
import BlogPostItemHeaderAuthors from '@theme/BlogPostItem/Header/Authors';

// Meta label (date · reading time) sits above the title, Black Glass style.
export default function BlogPostItemHeader(): JSX.Element {
  return (
    <header className="bg-header">
      <BlogPostItemHeaderInfo />
      <BlogPostItemHeaderTitle />
      <BlogPostItemHeaderAuthors />
    </header>
  );
}
