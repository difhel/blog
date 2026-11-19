import React, {type CSSProperties, type ReactNode, useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import {translate} from '@docusaurus/Translate';
import {Director, PEOPLE, type Status} from './director';

import styles from './styles.module.css';

// ?loop: how long the finished page stays on screen before the show starts over
const LOOP_PAUSE = 4000;

// without JS nothing would ever get built: show the page as is
const NOSCRIPT = `<style>
.${styles.armed} header.hero{clip-path:none!important}
.${styles.armed} header.hero .container>div,.${styles.armed} header.hero .container>div>*,
.${styles.armed} main .container>section>h2,.${styles.armed} main .container>section>h2~div>*{opacity:1!important;pointer-events:auto!important}
.${styles.armed}::before{display:none}
</style>`;

/**
 * figmaAnimation: wraps the homepage and has three multiplayer cursors build it,
 * Figma style. The hero is built on load, then the page scrolls itself from section to section;
 * once the visitor scrolls, it stops driving and each section builds the first time it is scrolled to.
 * At the end the pile offers to play it again. `/magic?loop` replays it on its own, for a kiosk.
 */
export default function FigmaAnimation({children}: {children: ReactNode}): ReactNode {
  const stageRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const director = useRef<Director | null>(null);
  const [status, setStatus] = useState<Status>({mode: 'auto', busy: false});
  const [armed, setArmed] = useState(true);
  const [running, setRunning] = useState(false);
  const [looping, setLooping] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    const layer = layerRef.current;
    if (!stage || !layer) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setArmed(false);
      return undefined;
    }
    // The show always starts at the top. A reload would otherwise restore the old scroll
    // position into a page that is empty again, with the hero being built off-screen or
    // under the navbar. 'manual' also stops the browser restoring it on the next reload.
    const restoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    window.scrollTo({top: 0, behavior: 'instant'});
    const loop = new URLSearchParams(window.location.search).has('loop');
    let replay = 0;
    const d = new Director(stage, layer, (s) => {
      setStatus(s);
      if (s.mode === 'done') {
        setArmed(false);
        if (loop && !replay) replay = window.setTimeout(() => window.location.reload(), LOOP_PAUSE);
      }
    });
    setLooping(loop);
    setRunning(true);
    director.current = d;
    d.start();
    return () => {
      window.clearTimeout(replay);
      d.destroy();
      director.current = null;
      window.history.scrollRestoration = restoration;
    };
  }, []);

  const done = status.mode === 'done';
  // once started, the pile stays: during the show it says how to pause, at the end how to replay
  const live = running && !done;
  const idle = done || (status.mode === 'manual' && !status.busy);
  // keep the manual hint even if a late status repeats the mode
  const [manual, setManual] = useState(false);
  if (status.mode === 'manual' && !manual) setManual(true);
  let hint = manual
    ? translate({id: 'magic.status.manual', message: 'Scroll to keep animating'})
    : translate({id: 'magic.status.auto', message: 'Scroll to pause animation'});
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
          // the page reloads at the top (scroll restoration is off here), so the show starts over
          <button type="button" className={styles.skip} onClick={() => window.location.reload()}>
            {translate({id: 'magic.reload', message: 'Reload'})}
          </button>
        )}
      </div>
    </div>
  );
}
