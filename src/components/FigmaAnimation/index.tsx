import React, {type CSSProperties, type ReactNode, useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import {useHistory} from '@docusaurus/router';
import {translate} from '@docusaurus/Translate';
import {Director, PEOPLE, type Status} from './director';
import {BOTS, SEEN_KEY} from './static-script';

import styles from './styles.module.css';

// playback rate of the show; `?speed=1` plays it at the original pace (0.25 to 4)
const SPEED = 2;

// ?loop: how long the finished page stays on screen before the show starts over
const LOOP_PAUSE = 4000;

declare global {
  interface Window {
    /** set while a show runs: the <head> script must not switch the page to static then */
    __figPlaying?: boolean;
  }
}

// without JS nothing would ever get built: show the page as is
const NOSCRIPT = `<style>
.${styles.armed} header.hero{clip-path:none!important}
.${styles.armed} header.hero .container>div,.${styles.armed} header.hero .container>div>*,
.${styles.armed} main .container>section>h2,.${styles.armed} main .container>section>h2~div>*{opacity:1!important;pointer-events:auto!important}
.${styles.armed}::before{display:none}
</style>`;

function readSeen(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function writeSeen(): void {
  try {
    window.localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // private mode or storage off: the show just plays again next time
  }
}

/** Should this page load play the show? ?force and ?loop do; reduced motion, a returning visitor and a crawler don't. */
function shouldPlay(params: URLSearchParams): boolean {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return params.has('force') || params.has('loop') || !(readSeen() || BOTS.test(navigator.userAgent));
}

// The first mount hydrates the static HTML, which is always "armed"; a later mount (coming back
// to the homepage within the site) renders on the client and can start in the right state.
let hydrated = false;

/** Play it again: the same page with ?force, which wins over the "seen" flag. */
function replay(): void {
  const params = new URLSearchParams(window.location.search);
  params.set('force', '');
  window.location.assign(`${window.location.pathname}?${params.toString().replace('force=', 'force')}`);
}

/**
 * figmaAnimation: wraps the homepage and has three multiplayer cursors build it,
 * Figma style. The hero is built on load, then the page scrolls itself from section to section;
 * scrolling skips the section in progress and the one scrolled to gets built.
 *
 * Plays once per visitor; after that the page shows as is, and the sparkles button in the
 * navbar (MagicButton) plays it again.
 * `?force` plays it anyway (and is dropped from the URL right away), `?loop` replays it
 * on its own, for a kiosk.
 */
export default function FigmaAnimation({children}: {children: ReactNode}): ReactNode {
  const history = useHistory();
  const stageRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const director = useRef<Director | null>(null);
  const [status, setStatus] = useState<Status>({mode: 'auto', busy: false});
  const [armed, setArmed] = useState(() => !hydrated || shouldPlay(new URLSearchParams(window.location.search)));
  const [running, setRunning] = useState(false);
  const [looping, setLooping] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    const layer = layerRef.current;
    if (!stage || !layer) return undefined;
    const params = new URLSearchParams(window.location.search);
    const force = params.has('force');
    const loop = params.has('loop');
    const unmark = () => document.documentElement.removeAttribute('data-fig-static');
    hydrated = true;
    const play = shouldPlay(params);
    // before ?force leaves the URL: from here on the <head> script keeps its hands off
    if (play) window.__figPlaying = true;
    if (force) {
      // a one-off: a reload or a shared link shouldn't force it again
      params.delete('force');
      const search = params.toString();
      history.replace({...history.location, search: search ? `?${search}` : ''});
    }
    if (!play) {
      // reduced motion, seen it, or a crawler: the page as is, no pile;
      // the sparkles button in the navbar plays it again
      setArmed(false);
      return unmark;
    }
    unmark();

    // The show always starts at the top. A reload would otherwise restore the old scroll
    // position into a page that is empty again, with the hero being built off-screen or
    // under the navbar. 'manual' also stops the browser restoring it on the next reload.
    const restoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    window.scrollTo({top: 0, behavior: 'instant'});
    const speed = Math.min(4, Math.max(0.25, Number(params.get('speed')) || SPEED));
    stage.style.setProperty('--fig-speed', String(speed));
    let replayTimer = 0;
    const d = new Director(
      stage,
      layer,
      (s) => {
        setStatus(s);
        if (s.mode === 'done') {
          setArmed(false);
          window.__figPlaying = false;
          writeSeen();
          if (loop && !replayTimer) replayTimer = window.setTimeout(() => window.location.reload(), LOOP_PAUSE);
        }
      },
      speed,
    );
    setLooping(loop);
    setRunning(true);
    director.current = d;
    d.start();
    return () => {
      window.clearTimeout(replayTimer);
      d.destroy();
      director.current = null;
      window.__figPlaying = false;
      window.history.scrollRestoration = restoration;
    };
    // the decision is made once, on mount; the ?force cleanup above must not re-run it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const done = status.mode === 'done';
  // once started, the pile stays: during the show it says how to skip, at the end how to replay
  const live = running && !done;
  const idle = done || (status.mode === 'manual' && !status.busy);
  let hint = translate({id: 'magic.status.scroll', message: 'Scroll to skip this section'});
  if (done) {
    hint = looping
      ? translate({id: 'magic.status.looping', message: 'Playing again…'})
      : translate({id: 'magic.status.done', message: 'Play again?'});
  }

  return (
    <div ref={stageRef} className={clsx(styles.stage, armed && styles.armed)}>
      <noscript dangerouslySetInnerHTML={{__html: NOSCRIPT}} />
      {children}
      <div ref={layerRef} className={styles.layer} aria-hidden="true" />
      <div className={clsx(styles.pile, running && styles.pileVisible, idle && styles.waiting)}>
        <span className={styles.avatars} aria-hidden="true">
          {PEOPLE.map((p) => (
            <span key={p.name} className={styles.avatar} style={{'--c': p.color} as CSSProperties} title={p.name}>
              {p.name[0]}
            </span>
          ))}
        </span>
        <span className={styles.pileText} role="status">
          <span className={styles.live} />
          {hint}
        </span>
        {live ? (
          <button type="button" className={styles.skip} onClick={() => director.current?.skip()}>
            {translate({id: 'magic.skip', message: 'Skip'})}
          </button>
        ) : (
          <button type="button" className={styles.skip} onClick={replay}>
            {translate({id: 'magic.reload', message: 'Reload'})}
          </button>
        )}
      </div>
    </div>
  );
}
