/**
 * Shared by the homepage component and docusaurus.config.ts (headTags), so keep this file
 * free of browser and CSS imports: the config loads it in Node at build time.
 */

// set once the show has been seen (played to the end or skipped): next visits get the page as is
export const SEEN_KEY = 'magicAnimation';

// crawlers and audits get the page as is: content visible at once, no 18 s show to wait out
export const BOTS = /bot|crawl|spider|slurp|lighthouse/i;

/**
 * Baked into the static <head> of every page at build time, so it runs once per page load,
 * before the page paints, and React never re-inserts it. For a returning visitor (or a crawler)
 * it turns the "not built yet" CSS off, so the homepage doesn't flash empty until React decides
 * not to play. ?force and ?loop play; window.__figPlaying is a guard for a show already running.
 */
export const STATIC_SCRIPT = `try{var q=new URLSearchParams(location.search);if(!window.__figPlaying&&(localStorage.getItem('${SEEN_KEY}')||${BOTS}.test(navigator.userAgent))&&!q.has('force')&&!q.has('loop'))document.documentElement.setAttribute('data-fig-static','')}catch(e){}`;
