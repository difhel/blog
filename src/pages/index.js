import React from 'react';
import FigmaAnimation from '@site/src/components/FigmaAnimation';
import HomePage from '@site/src/components/HomePage';

// The homepage, built live by three Figma-style collaborators on the first visit
export default function Home() {
  return <HomePage Stage={FigmaAnimation} />;
}
