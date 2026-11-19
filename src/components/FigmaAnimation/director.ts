/**
 * figmaAnimation scenes: three collaborators build the homepage like a Figma file.
 *
 * Auto mode: the hero is built on load, then the director scrolls to each next section and
 * builds it. Once the visitor scrolls, manual mode: the section in focus (the last one that
 * has entered the upper 60% of the screen) gets the full show; whatever is mid-build and no
 * longer in focus, and every unbuilt section above the focus, settles with a quick soft reveal.
 */
import {
  Aborted,
  type Box,
  Clock,
  Cursor,
  Selection,
  Shape,
  Stage,
  autoLayoutGaps,
  boxFrom,
  clamp,
  cubicBezier,
  deferred,
  dismiss,
  ease,
  keystroke,
  lerp,
  lerpBox,
  make,
  measureGap,
  measureGlyphs,
  place,
  rand,
  sizeOf,
} from './engine';
import styles from './styles.module.css';

export const PEOPLE = [
  {name: 'Mark', color: '#FF7262'},
  {name: 'Claude', color: '#A259FF'},
  {name: 'Intern', color: '#0ACF83'},
] as const;

/**
 * auto: the director scrolls from one section to the next by itself;
 * manual: the visitor took over the scroll, the section in focus gets built.
 */
export type Status = {mode: 'auto' | 'manual' | 'done'; busy: boolean};

// Figma layer names for the cards of each section, in page order
const SECTION_LAYERS = ['Card / Start', 'Card / Talk', 'Card / Contact'];

// keys that scroll the page: pressing one hands the scroll back to the visitor
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

// a section is in focus once its top has passed this share of the viewport height
const FOCUS_LINE = 0.6;

const dragX = cubicBezier(0.3, 0.1, 0.2, 1);
const dragY = cubicBezier(0.5, 0, 0.25, 1);
// a soft landing with a little overshoot; the spring starts too abruptly for a dropped file
const DROP = cubicBezier(0.34, 1.36, 0.64, 1);

type Crew = Cursor[];

/**
 * For moves that run alongside the main flow and are awaited later: if the scene is
 * interrupted first, their rejection must not surface as an unhandled one.
 */
function background<T>(p: Promise<T>): Promise<T> {
  p.catch(() => undefined);
  return p;
}

export class Director {
  private readonly stage: Stage;
  /** for the director's own waits and scrolling; scenes run on their crew's clock */
  private readonly clock = new Clock();
  private sceneClock: Clock | null = null;
  private readonly touched = new Set<HTMLElement>();
  private readonly shown = new Set<HTMLElement>();
  private readonly anims = new Set<Animation>();
  private hero: HTMLElement | null = null;
  private sections: HTMLElement[] = [];
  /** hero first, then sections, in page order */
  private scenes: HTMLElement[] = [];
  private readonly built = new Set<HTMLElement>();
  private running: HTMLElement | null = null;
  private scrolling = false;
  private finished = false;
  private width = 0;
  private auto = true;
  /** where our own scrolling left the page; any other position came from the visitor */
  private expectedY = 0;
  private focusTimer = 0;

  constructor(
    root: HTMLElement,
    layer: HTMLElement,
    private readonly onStatus: (s: Status) => void,
  ) {
    this.stage = new Stage(root, layer);
  }

  start(): void {
    const root = this.stage.root;
    this.hero = root.querySelector<HTMLElement>('header.hero');
    this.sections = Array.from(root.querySelectorAll<HTMLElement>('main .container > section'));
    this.scenes = [...(this.hero ? [this.hero] : []), ...this.sections];
    this.width = window.innerWidth;
    this.expectedY = window.scrollY;
    window.addEventListener('resize', this.onResize);
    window.addEventListener('wheel', this.onIntent, {passive: true});
    window.addEventListener('touchmove', this.onIntent, {passive: true});
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('scroll', this.onScroll, {passive: true});
    this.emit();

    void (async () => {
      try {
        // measure glyphs with the real font, not the fallback
        await Promise.race([document.fonts?.ready, background(this.clock.wait(1500))]);
        await this.clock.wait(250);
      } catch {
        return;
      }
      // absorb the browser's own scroll restoration on load
      this.expectedY = window.scrollY;
      this.next();
    })();
  }

  /** Jump to the end: everything shows at once, the chrome goes away. */
  skip(): void {
    if (this.finished) return;
    this.teardown();
    this.onStatus({mode: 'done', busy: false});
  }

  destroy(): void {
    this.finished = true;
    this.teardown();
  }

  private teardown(): void {
    this.finished = true;
    this.clock.abort();
    this.sceneClock?.abort();
    window.clearTimeout(this.focusTimer);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('wheel', this.onIntent);
    window.removeEventListener('touchmove', this.onIntent);
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('scroll', this.onScroll);
    for (const a of this.anims) a.cancel();
    this.anims.clear();
    for (const el of this.touched) el.style.clipPath = '';
    this.stage.layer.replaceChildren();
  }

  private emit(): void {
    if (!this.finished) {
      this.onStatus({mode: this.auto ? 'auto' : 'manual', busy: Boolean(this.running) || this.scrolling});
    }
  }

  // the overlay is laid out for one width; on a real resize, just finish
  private readonly onResize = () => {
    if (Math.abs(window.innerWidth - this.width) > 40) this.skip();
  };

  // ---- the visitor takes the scroll over

  private readonly onIntent = () => this.toManual();

  private readonly onKey = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, button, [contenteditable]')) return;
    if (SCROLL_KEYS.has(e.key)) this.toManual();
  };

  private readonly onScroll = () => {
    // auto mode: only the director moves the page, any other position means the visitor did
    // (this also catches dragging the scrollbar, which fires none of the events above)
    if (this.auto) {
      if (Math.abs(window.scrollY - this.expectedY) > 4) this.toManual();
      return;
    }
    // manual mode: re-check the focus once the scroll settles
    window.clearTimeout(this.focusTimer);
    this.focusTimer = window.setTimeout(this.checkFocus, 140);
  };

  private toManual(): void {
    if (!this.auto || this.finished) return;
    this.auto = false;
    this.emit();
    window.clearTimeout(this.focusTimer);
    this.focusTimer = window.setTimeout(this.checkFocus, 140);
  }

  /** The last scene whose top has entered the upper part of the screen. */
  private focus(): HTMLElement | null {
    const line = window.innerHeight * FOCUS_LINE;
    let focus = this.hero;
    for (const s of this.sections) if (s.getBoundingClientRect().top < line) focus = s;
    return focus ?? this.sections[0] ?? null;
  }

  private inView(el: HTMLElement): boolean {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }

  private readonly checkFocus = () => {
    if (this.finished || this.auto) return;
    const focus = this.focus();
    if (!this.running) {
      this.next();
      return;
    }
    if (!focus || focus === this.running) return;
    // back on something already built: keep going unless the scene in progress is off-screen
    if (this.built.has(focus) && this.inView(this.running)) return;
    // the visitor moved on: wrap up the current scene, the next one starts right after
    this.sceneClock?.abort();
  };

  // ---- scenes in order

  private next(): void {
    if (this.finished || this.running || this.scrolling) return;
    if (this.auto) {
      const target = this.scenes.find((s) => !this.built.has(s));
      if (target) void this.run(target, target !== this.hero);
      return;
    }
    const focus = this.focus();
    if (focus && !this.built.has(focus)) {
      // everything above the focus that was skipped over just appears
      for (const s of this.scenes) {
        if (s === focus) break;
        if (!this.built.has(s)) this.settle(s);
      }
      void this.run(focus, false);
    } else {
      this.emit();
    }
  }

  private async run(target: HTMLElement, scrollFirst: boolean): Promise<void> {
    if (scrollFirst) {
      this.scrolling = true;
      this.emit();
      let arrived = false;
      try {
        arrived = await this.scrollToSection(target);
      } catch {
        return;
      } finally {
        this.scrolling = false;
      }
      if (!arrived) {
        this.next();
        return;
      }
    }

    this.running = target;
    this.emit();
    const clock = new Clock();
    this.sceneClock = clock;
    const crew: Crew = PEOPLE.map((p) => new Cursor(this.stage, clock, p.name, p.color));
    try {
      if (target === this.hero) await this.buildHero(target, crew);
      else await this.buildSection(target, crew);
      this.built.add(target);
    } catch (e) {
      if (this.finished) return;
      if (!(e instanceof Aborted)) {
        console.error('figmaAnimation:', e);
        this.skip();
        return;
      }
      // interrupted: drop the half-built chrome and let the scene settle
      this.clearChrome();
      this.settle(target);
    } finally {
      crew.forEach((c) => c.dispose());
      this.running = null;
    }

    if (this.built.size >= this.scenes.length) await this.finish();
    else this.next();
  }

  /** Remove selections, shapes, carets, guides; the crews' cursors fade on their own. */
  private clearChrome(): void {
    for (const el of Array.from(this.stage.layer.children)) {
      if (!el.classList.contains(styles.cursor)) el.remove();
    }
  }

  /** The quick way: whatever of the scene isn't there yet fades and rises into place. */
  private settle(scene: HTMLElement): void {
    this.built.add(scene);
    let parts: (HTMLElement | null)[];
    if (scene === this.hero) {
      const glass = scene.querySelector<HTMLElement>('.container > div');
      parts = [glass, glass?.querySelector('img') ?? null, glass?.querySelector<HTMLElement>('h1') ?? null];
      if (scene.style.clipPath !== 'none') {
        this.touched.add(scene);
        scene.style.clipPath = 'none';
        this.anims.add(scene.animate([{opacity: 0}, {opacity: 1}], {duration: 420, easing: 'ease-out'}));
      }
    } else {
      const list = scene.querySelector<HTMLElement>(':scope > h2 ~ div');
      parts = [scene.querySelector<HTMLElement>(':scope > h2'), ...(list ? (Array.from(list.children) as HTMLElement[]) : [])];
    }
    let i = 0;
    for (const el of parts) {
      if (!el || this.shown.has(el)) continue;
      el.style.clipPath = '';
      this.show(el);
      this.anims.add(
        el.animate(
          [
            {opacity: 0, filter: 'blur(6px)', transform: 'translateY(12px)'},
            {opacity: 1, filter: 'blur(0)', transform: 'none'},
          ],
          {duration: 520, delay: 50 * i++, easing: 'cubic-bezier(.2, 1, .3, 1)', fill: 'backwards'},
        ),
      );
    }
  }

  /** Glide the page so the section sits under the navbar. False if the visitor took over. */
  private async scrollToSection(section: HTMLElement): Promise<boolean> {
    await this.clock.wait(100);
    if (!this.auto) return false;
    const nav = document.querySelector('.navbar');
    const offset = (nav ? nav.getBoundingClientRect().bottom : 0) + 16;
    const from = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const to = clamp(from + section.getBoundingClientRect().top - offset, 0, max);
    const dist = Math.abs(to - from);
    if (dist > 2) {
      await this.clock.tween(
        clamp(450 + dist * 0.6, 700, 1400),
        (p) => {
          if (!this.auto) return;
          const y = Math.round(lerp(from, to, p));
          this.expectedY = y;
          window.scrollTo({top: y, behavior: 'instant'});
        },
        ease.inOut,
      );
    }
    return this.auto;
  }

  private async finish(): Promise<void> {
    try {
      await this.clock.wait(400);
    } catch {
      return;
    }
    this.teardown();
    this.onStatus({mode: 'done', busy: false});
  }

  // -------------------------------------------------------------------------
  // primitives on real elements

  private show(el: HTMLElement, fade = 0): void {
    this.touched.add(el);
    this.shown.add(el);
    el.style.opacity = '1';
    el.style.pointerEvents = 'auto';
    if (fade) this.anims.add(el.animate([{opacity: 0}, {opacity: 1}], {duration: fade, easing: 'ease-out'}));
  }

  /** Children land one after another, auto-layout style. */
  private rise(el: HTMLElement): void {
    Array.from(el.children).forEach((child, i) => {
      this.anims.add(
        child.animate(
          [
            {opacity: 0, transform: 'translateY(10px) scale(0.98)'},
            {opacity: 1, transform: 'none'},
          ],
          {duration: 560, delay: 70 * i, easing: 'cubic-bezier(.2, 1, .3, 1)', fill: 'backwards'},
        ),
      );
    });
  }

  // -------------------------------------------------------------------------
  // actions

  /** Frame tool: drag a frame across the screen, then it snaps to fill the page. */
  private async drawFrame(cur: Cursor, frame: HTMLElement, name: string, released: () => void): Promise<void> {
    const {stage} = this;
    const {clock} = cur;
    const b = stage.box(frame);
    const vp = stage.viewport();
    const nav = document.querySelector('.navbar');
    const navBottom = nav ? stage.box(nav).y + stage.box(nav).h : vp.y;
    const pad = clamp(vp.w * 0.05, 16, 40);
    const start = {x: b.x + pad, y: Math.max(b.y, navBottom) + pad};
    const end = {x: b.x + b.w - pad, y: Math.min(b.y + b.h, vp.y + vp.h) - pad};

    this.touched.add(frame);
    const clip = (box: Box) => {
      const top = Math.max(0, box.y - b.y);
      const left = Math.max(0, box.x - b.x);
      const right = Math.max(0, b.x + b.w - box.x - box.w);
      const bottom = Math.max(0, b.y + b.h - box.y - box.h);
      frame.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px)`;
    };

    cur.enter({x: vp.x, y: start.y + vp.h * 0.25});
    cur.tool('frame');
    await cur.moveTo(start);
    await cur.press();
    // placed right away: anything added unplaced paints a frame at the layer's top-left corner
    const sel = new Selection(stage).label(name).place(boxFrom(start, start));
    await clock.tween(
      950,
      (p) => {
        const pt = {x: lerp(start.x, end.x, dragX(p)), y: lerp(start.y, end.y, dragY(p))};
        cur.set(pt);
        const box = boxFrom(start, pt);
        sel.place(box).badge(sizeOf(box));
        clip(box);
      },
      ease.linear,
    );
    await cur.release();
    cur.tool(null);
    released();

    // the frame fills the page, the pointer gets out of the way
    const from = boxFrom(start, end);
    const away = background(cur.moveTo({x: end.x - vp.w * 0.18, y: end.y - 70}));
    await clock.tween(
      900,
      (p) => {
        const box = lerpBox(from, b, p);
        sel.place(box).badge(sizeOf(box));
        clip(box);
      },
      ease.spring,
    );
    frame.style.clipPath = 'none';
    await away;
    await clock.wait(200);
    sel.remove();
  }

  /**
   * Rectangle tool: drag a grey rect over the element, optionally pull the corner-radius
   * dot, swap the grey for the element's real fill, then the content lands inside.
   */
  private async drawRect(
    cur: Cursor,
    el: HTMLElement,
    {name, radiusHandle = false, children = true}: {name: string; radiusHandle?: boolean; children?: boolean},
  ): Promise<void> {
    const {stage} = this;
    const {clock} = cur;
    const b = stage.box(el);
    const cs = getComputedStyle(el);
    const radius = Math.min(parseFloat(cs.borderTopLeftRadius) || 0, b.h / 2, b.w / 2);
    const start = {x: b.x, y: b.y};
    const end = {x: b.x + b.w, y: b.y + b.h};

    cur.enter(start);
    cur.tool('rect');
    await cur.moveTo(start);
    await cur.press();
    const shape = new Shape(stage).place(boxFrom(start, start));
    const sel = new Selection(stage).label(name).place(boxFrom(start, start));
    await clock.tween(
      clamp(380 + Math.hypot(b.w, b.h) * 0.45, 520, 1000),
      (p) => {
        const pt = {x: lerp(start.x, end.x, dragX(p)), y: lerp(start.y, end.y, dragY(p))};
        cur.set(pt);
        const box = boxFrom(start, pt);
        shape.place(box);
        sel.place(box).badge(sizeOf(box));
      },
      ease.linear,
    );
    await cur.release();

    if (radiusHandle && radius > 0) {
      const inset = clamp(b.h / 5, 8, 16);
      const pull = Math.min(radius * 0.45, 24);
      sel.radiusDot(inset);
      await cur.moveTo({x: b.x + inset + 4, y: b.y + inset + 4}, {duration: 420});
      await cur.press();
      await clock.tween(
        650,
        (p) => {
          shape.radius(radius * p);
          sel.radiusDot(inset + pull * p).badge(`Radius ${Math.round(radius * p)}`);
          cur.set({x: b.x + inset + 4 + pull * p, y: b.y + inset + 4 + pull * p});
        },
        ease.inOut,
      );
      await cur.release();
      sel.radiusDot(null).badge(sizeOf(b));
    }

    cur.tool(null);
    shape.fill(cs, radius);
    // step aside so the content is not under the pointer when it lands
    const aside = background(cur.moveTo({x: b.x + b.w + rand(16, 40), y: b.y + b.h + rand(12, 30)}, {duration: 520}));
    await clock.wait(340);
    this.show(el, 260);
    if (children) this.rise(el);
    shape.remove();
    await aside;
    await clock.wait(200);
    sel.remove();
  }

  /** Text tool: click, the text box appears, the text is typed in, Escape. */
  private async typeText(cur: Cursor, el: HTMLElement): Promise<void> {
    const {stage} = this;
    const {clock} = cur;
    const base = stage.box(el);
    const {glyphs, lines} = measureGlyphs(el);
    if (!glyphs.length) {
      this.show(el, 200);
      return;
    }
    const first = glyphs[0];
    const at = {x: base.x + first.x + 2, y: base.y + first.y + first.h * 0.55};

    cur.enter(at);
    cur.tool('text');
    await cur.moveTo(at);
    await cur.click();
    // nudge the pointer off the text, the way you do before typing
    // ...to the left of the text, not onto whatever lies below it
    const away = background(
      cur.moveTo({x: Math.max(stage.viewport().x + 6, at.x - 34), y: at.y + 10}, {duration: 380}),
    );

    this.touched.add(el);
    el.style.clipPath = 'inset(0 100% 100% 0)';
    el.style.opacity = '1';
    const box = new Selection(stage, 'text');
    const caret = stage.add('span', styles.caret);
    let left = first.x;
    let right = first.x;
    const top = lines[0].top;
    const frameAt = (line: number, x: number) => {
      const l = lines[line];
      caret.style.transform = `translate3d(${Math.round(base.x + x)}px, ${Math.round(base.y + l.top)}px, 0)`;
      caret.style.height = `${Math.round(l.bottom - l.top)}px`;
      box.place({x: base.x + left - 3, y: base.y + top - 2, w: right - left + 6, h: l.bottom - top + 4});
    };
    frameAt(0, first.x);
    await clock.wait(260);
    caret.classList.add(styles.caretTyping);

    for (const g of glyphs) {
      const line = lines[g.line];
      left = Math.min(left, g.x);
      right = Math.max(right, g.x + g.w);
      const edge = g.x + g.w;
      el.style.clipPath = `polygon(-60px -60px, calc(100% + 60px) -60px, calc(100% + 60px) ${line.top}px, ${edge}px ${line.top}px, ${edge}px ${line.bottom + 2}px, -60px ${line.bottom + 2}px)`;
      frameAt(g.line, edge);
      await clock.wait(keystroke(g.ch));
    }

    el.style.clipPath = '';
    this.shown.add(el);
    caret.classList.remove(styles.caretTyping);
    await away;
    await clock.wait(420);
    // Escape: leave edit mode, the text layer stays selected for a beat
    caret.remove();
    box.root.remove();
    const textBox = {x: base.x + left - 3, y: base.y + top - 2, w: right - left + 6, h: lines[lines.length - 1].bottom - top + 4};
    const sel = new Selection(stage).place(textBox).badge(sizeOf(textBox));
    cur.tool(null);
    await clock.wait(480);
    sel.remove();
  }

  /** A file dragged in from the desktop: the thumbnail rides the cursor, then lands. */
  private async dropImage(
    cur: Cursor,
    img: HTMLImageElement,
    ready: Promise<void>,
    dropped: () => void,
  ): Promise<void> {
    const {stage} = this;
    const {clock} = cur;
    // Decode up front: an <img> that is not decoded yet paints nothing for a frame or two,
    // which reads as a flicker (likely after a reload, when the decoded copy is gone)
    const decoded = img.decode().catch(() => undefined);
    const thumb = make('img', styles.dragThumb);
    thumb.alt = '';
    thumb.src = img.currentSrc || img.src;
    await thumb.decode().catch(() => undefined);
    cur.root.appendChild(thumb);

    const t0 = stage.box(img);
    cur.enter({x: t0.x + t0.w, y: t0.y});
    cur.tool('image');
    await cur.moveTo({x: t0.x + t0.w + 60, y: t0.y + t0.h + 40});
    await cur.idle(ready);

    const t = stage.box(img);
    await cur.moveTo({x: t.x + t.w / 2, y: t.y + t.h / 2}, {arc: 0.6});
    // the very same thumbnail lands: moved from the pointer onto the canvas, no new image to load
    const from = stage.box(thumb);
    const land = (p: number) => {
      const b = lerpBox(from, t, p);
      const q = clamp(p, 0, 1);
      thumb.style.transform = `translate3d(${b.x}px, ${b.y}px, 0) rotate(${lerp(-8, 0, q)}deg)`;
      thumb.style.width = `${b.w}px`;
      thumb.style.height = `${b.h}px`;
      thumb.style.borderRadius = `${lerp(8, t.w / 2, q)}px`;
      // the white "dragged file" ring and the lift shadow settle as it lands
      thumb.style.boxShadow = `0 0 0 ${lerp(2, 0, q)}px #fff, 0 ${lerp(10, 0, q)}px ${lerp(24, 0, q)}px rgb(0 0 0 / ${lerp(0.3, 0, q)})`;
    };
    // place it before it joins the layer: otherwise it paints one frame at the layer's
    // top-left corner in its natural size, the flicker you could catch after a reload
    thumb.className = styles.fly;
    land(0);
    stage.layer.appendChild(thumb);
    stage.ripple(cur.pos, cur.color);
    dropped();
    const away = background(cur.moveTo({x: t.x - 30, y: t.y + t.h + 40}, {duration: 480}));
    await clock.tween(620, land, DROP);
    cur.tool(null);
    // swap to the real avatar under the thumbnail; drop the thumbnail only once it has painted
    await decoded;
    this.show(img);
    await clock.wait(60);
    thumb.remove();
    const sel = new Selection(stage).place(t).badge(sizeOf(t)).label('avatar.webp');
    await away;
    await clock.wait(380);
    sel.remove();
  }

  /**
   * Alt-drag: grab a finished card, drag a duplicate into the next slot, then the duplicate
   * turns into the real card there (same frame, its own content).
   */
  private async duplicate(cur: Cursor, source: HTMLElement, target: HTMLElement, name: string): Promise<void> {
    const {stage} = this;
    const {clock} = cur;
    const s = stage.box(source);
    const t = stage.box(target);
    const grab = {x: s.x + Math.min(s.w * 0.3, 96), y: s.y + s.h * 0.55};

    cur.enter(grab);
    cur.tool(null);
    await cur.moveTo(grab);
    const sel = new Selection(stage).place(s).label(name);
    await clock.wait(140);
    cur.tool('copy');
    await clock.wait(160);
    await cur.press();

    // the duplicate: the source card itself, cloned onto the canvas; placed before it's added
    const ghost = source.cloneNode(true) as HTMLElement;
    ghost.removeAttribute('href');
    ghost.setAttribute('tabindex', '-1');
    ghost.classList.add(styles.ghost);
    Object.assign(ghost.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      margin: '0',
      width: `${s.w}px`,
      height: `${s.h}px`,
      opacity: '1',
      transform: `translate3d(${s.x}px, ${s.y}px, 0)`,
    });
    stage.layer.appendChild(ghost);

    const dx = t.x - s.x;
    const dy = t.y - s.y;
    await clock.tween(
      clamp(420 + Math.hypot(dx, dy) * 0.5, 560, 900),
      (p) => {
        // lifted off the canvas mid-way, set down on arrival
        const lift = Math.sin(Math.PI * p);
        const x = s.x + dx * p;
        const y = s.y + dy * p;
        ghost.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${1 + 0.025 * lift})`;
        ghost.style.boxShadow = `0 ${Math.round(18 * lift)}px ${Math.round(40 * lift)}px rgb(0 0 0 / ${(0.3 * lift).toFixed(3)})`;
        cur.set({x: grab.x + dx * p, y: grab.y + dy * p});
        sel.place({x, y, w: s.w, h: s.h});
      },
      ease.inOut,
    );
    await cur.release();
    cur.tool(null);
    sel.place(t).badge(sizeOf(t));
    const guide = measureGap(stage, stage.box(source), t);

    // the copy takes the real card's content
    this.show(target, 280);
    this.rise(target);
    dismiss(ghost, 300);
    const aside = background(cur.moveTo({x: t.x + t.w * 0.7, y: t.y + t.h + rand(14, 30)}, {duration: 460}));
    await clock.wait(520);
    dismiss(guide);
    sel.remove();
    await aside;
  }

  /** Hover, click, and the classic selection, optionally with Alt-style spacing to a neighbour. */
  private async select(cur: Cursor, el: HTMLElement, name: string, neighbour?: HTMLElement): Promise<void> {
    const {stage} = this;
    const {clock} = cur;
    const b = stage.box(el);
    // grab it by the empty edge, so the name tag doesn't sit on the content
    const at = {x: b.x + b.w - Math.min(28, b.w * 0.08), y: b.y + b.h * rand(0.55, 0.75)};
    cur.enter(at);
    cur.tool(null);
    await cur.moveTo(at);
    const hover = new Selection(stage, 'hover').place(b);
    await clock.wait(240);
    await cur.click();
    hover.root.remove();
    const sel = new Selection(stage).place(b).label(name).badge(sizeOf(b));
    let guide: HTMLElement | null = null;
    if (neighbour) {
      await clock.wait(320);
      guide = measureGap(stage, b, stage.box(neighbour));
    }
    await clock.wait(1100);
    dismiss(guide);
    sel.remove();
  }

  /**
   * The section's list as an auto layout frame: select it, its gaps light up in Figma's
   * auto layout pink, and the value shows on the gap under the pointer.
   */
  private async autoLayout(cur: Cursor, list: HTMLElement, name: string): Promise<void> {
    const {stage} = this;
    const {clock} = cur;
    const frame = stage.box(list);
    const gaps = autoLayoutGaps(
      frame,
      Array.from(list.children).map((child) => stage.box(child)),
    );
    const at = {x: frame.x + frame.w - Math.min(28, frame.w * 0.08), y: frame.y + Math.min(frame.h * 0.3, 60)};
    cur.enter(at);
    cur.tool(null);
    await cur.moveTo(at);
    const hover = new Selection(stage, 'hover').place(frame);
    await clock.wait(220);
    await cur.click();
    hover.root.remove();
    const sel = new Selection(stage).place(frame).label(name).badge(sizeOf(frame));
    await clock.wait(200);

    const strips = gaps.map((gap, i) => {
      const el = stage.add('div', `${styles.gap} ${gap.axis === 'row' ? styles.gapRow : ''}`);
      place(el, gap);
      el.style.animationDelay = `${i * 60}ms`;
      make('span', styles.gapHandle, el);
      return el;
    });
    await clock.wait(320 + gaps.length * 60);

    // hover a column gap, then a row gap: the value follows the pointer
    const tour = [gaps.findIndex((g) => g.axis === 'column'), gaps.findIndex((g) => g.axis === 'row')].filter(
      (i) => i >= 0,
    );
    let label: HTMLElement | null = null;
    for (const i of tour) {
      const g = gaps[i];
      const cx = g.x + g.w / 2;
      const cy = g.y + g.h / 2;
      // just past the value pill, so the name tag doesn't cover it
      await cur.moveTo(g.axis === 'column' ? {x: cx + 2, y: cy + 16} : {x: cx + 22, y: cy + 2}, {duration: 460});
      strips.forEach((el) => el.classList.remove(styles.gapHot));
      strips[i].classList.add(styles.gapHot);
      label?.remove();
      label = make('span', styles.gapLabel, strips[i]);
      label.textContent = String(Math.round(g.size));
      await clock.wait(700);
    }
    await clock.wait(350);
    strips.forEach((el) => dismiss(el));
    sel.remove();
  }

  /** The nearest card above this one in the same column; else the one before it. */
  private cardAbove(card: HTMLElement, cards: HTMLElement[]): HTMLElement {
    const t = this.stage.box(card);
    let best: HTMLElement | null = null;
    let bestBottom = -Infinity;
    for (const other of cards) {
      if (other === card) continue;
      const o = this.stage.box(other);
      const bottom = o.y + o.h;
      if (Math.abs(o.x - t.x) < 4 && bottom <= t.y + 1 && bottom > bestBottom) {
        best = other;
        bestBottom = bottom;
      }
    }
    return best ?? cards[Math.max(0, cards.indexOf(card) - 1)];
  }

  // -------------------------------------------------------------------------
  // scenes

  private async buildHero(hero: HTMLElement, crew: Crew): Promise<void> {
    const glass = hero.querySelector<HTMLElement>('.container > div');
    const avatar = glass?.querySelector('img') ?? null;
    const title = glass?.querySelector<HTMLElement>('h1') ?? null;
    const [a, b, c] = crew;
    const {clock} = a;
    const frameName = `Home / ${window.innerWidth >= 997 ? 'Desktop' : 'Mobile'}`;
    const released = deferred();
    const glassDone = deferred();
    const avatarDropped = deferred();

    await Promise.all([
      (async () => {
        await this.drawFrame(a, hero, frameName, released.resolve);
        // the title goes in once the avatar is on its way, so three people don't pile up on one spot
        await a.idle(avatar ? avatarDropped.promise : glassDone.promise);
        if (title) await this.typeText(a, title);
      })(),
      (async () => {
        await released.promise;
        if (glass) await this.drawRect(b, glass, {name: 'Hero', radiusHandle: true, children: false});
        glassDone.resolve();
      })(),
      (async () => {
        await released.promise;
        await clock.wait(500);
        if (avatar) await this.dropImage(c, avatar, glassDone.promise, avatarDropped.resolve);
        avatarDropped.resolve();
      })(),
    ]);

    if (glass) await this.select(b, glass, 'Hero');
    crew.forEach((cur) => cur.hide());
    await clock.wait(100);
  }

  private async buildSection(section: HTMLElement, crew: Crew): Promise<void> {
    const layer = SECTION_LAYERS[this.sections.indexOf(section)] ?? 'Card';
    const title = section.querySelector<HTMLElement>(':scope > h2');
    const list = section.querySelector<HTMLElement>(':scope > h2 ~ div');
    const cards = list ? (Array.from(list.children) as HTMLElement[]) : [];
    const [a, b, c] = crew;
    const {clock} = a;
    // each card is done once it's on the page; a copy waits for its source to be done
    const done = new Map(cards.map((card) => [card, deferred()]));
    const build = async (cur: Cursor, card: HTMLElement, i: number) => {
      if (i < 2) {
        await this.drawRect(cur, card, {name: layer, radiusHandle: i === 0});
      } else {
        // many identical cards: the first two are drawn, the rest are Alt-dragged copies
        const source = this.cardAbove(card, cards);
        const ready = done.get(source);
        if (ready && !ready.done) await cur.idle(ready.promise);
        await this.duplicate(cur, source, card, layer);
      }
      done.get(card)?.resolve();
    };
    await Promise.all([
      title ? this.typeText(a, title) : null,
      (async () => {
        await clock.wait(150);
        for (const [i, card] of cards.entries()) if (i % 2 === 0) await build(b, card, i);
      })(),
      (async () => {
        await clock.wait(450);
        for (const [i, card] of cards.entries()) if (i % 2 === 1) await build(c, card, i);
      })(),
    ]);

    // the last section closes the show with the whole list as an auto layout frame
    const last = section === this.sections[this.sections.length - 1];
    if (last && list && cards.length > 1) await this.autoLayout(a, list, title?.textContent?.trim() || layer);
    else if (cards.length > 0) await this.select(a, cards[0], layer, cards[1]);
    crew.forEach((cur) => cur.hide());
    await clock.wait(100);
  }
}
