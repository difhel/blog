import React, {type ReactNode} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {translate} from '@docusaurus/Translate';
import LucideIcon from '@site/src/components/LucideIcon';

/**
 * Navbar button next to the color mode toggle: plays the Figma-style build of the homepage.
 * It opens the magic page with ?force, which plays the show even for someone who has seen it
 * (the page drops ?force from the URL right away, so a later reload doesn't replay it).
 */
export default function MagicButton({className}: {className?: string}): ReactNode {
  const target = useBaseUrl('/magic');
  const label = translate({id: 'magic.navbar.play', message: 'Play the magic animation'});
  return (
    <div className={className}>
      <button
        type="button"
        className="clean-btn"
        title={label}
        aria-label={label}
        onClick={() => window.location.assign(`${target}?force`)}>
        {/* Lucide "sparkles" */}
        <LucideIcon width={20} height={20}>
          <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          <path className="navbar__magic-twinkle" d="M20 3v4M22 5h-4" />
          <path className="navbar__magic-twinkle" d="M4 17v2M5 18H3" />
        </LucideIcon>
      </button>
    </div>
  );
}
