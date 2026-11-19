/**
 * figmaAnimation engine: a rAF clock, multiplayer cursors and Figma's canvas chrome
 * (selection boxes, size badges, default-grey shapes, text carets, red spacing guides).
 * Everything lives in an overlay layer positioned in page coordinates of the stage,
 * so it scrolls with the content like objects on a canvas.
 */
import styles from './styles.module.css';

export type Point = {x: number; y: number};
export type Box = {x: number; y: number; w: number; h: number};
export type Tool = 'frame' | 'rect' | 'text' | 'image' | 'copy' | null;

export class Aborted extends Error {
  constructor() {
    super('figmaAnimation aborted');
    this.name = 'Aborted';
  }
}

// ---------------------------------------------------------------------------
// math

export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sx(t) - x;
      if (Math.abs(err) < 1e-5) return sy(t);
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    while (hi - lo > 1e-5) {
      if (sx(t) < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}

const springRaw = (t: number) => 1 - Math.exp(-6 * t) * Math.cos(8.5 * t);
const springEnd = springRaw(1);

export const ease = {
  linear: (t: number) => t,
  inOut: cubicBezier(0.65, 0, 0.35, 1),
  out: cubicBezier(0.16, 1, 0.3, 1),
  // a hand on a mouse: quick launch, long careful landing
  aim: cubicBezier(0.5, 0, 0.12, 1),
  // ~10% overshoot, settles without a visible wobble
  spring: (t: number) => springRaw(t) / springEnd,
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

export function lerpBox(a: Box, b: Box, t: number): Box {
  return {x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t)};
}

export function boxFrom(a: Point, b: Point): Box {
  return {x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y)};
}

export const sizeOf = (b: Box) => `${Math.round(b.w)} × ${Math.round(b.h)}`;

export type Deferred = {promise: Promise<void>; resolve: () => void; readonly done: boolean};

export function deferred(): Deferred {
  let settle!: () => void;
  let done = false;
  const promise = new Promise<void>((r) => {
    settle = r;
  });
  return {
    promise,
    resolve: () => {
      done = true;
      settle();
    },
    get done() {
      return done;
    },
  };
}

// ---------------------------------------------------------------------------
// time

/** Every wait and tween goes through here, so one abort() stops the whole show. */
export class Clock {
  /** Playback rate: the director speeds up when sections pile up in the queue. */
  speed = 1;
  private aborted = false;
  private readonly pending = new Set<(e: Error) => void>();

  get isAborted(): boolean {
    return this.aborted;
  }

  check(): void {
    if (this.aborted) throw new Aborted();
  }

  tween(duration: number, update: (p: number) => void, easing: (t: number) => number = ease.inOut): Promise<void> {
    this.check();
    const ms = Math.max(1, duration / this.speed);
    return new Promise((resolve, reject) => {
      let start = -1;
      let raf = 0;
      const fail = (e: Error) => {
        cancelAnimationFrame(raf);
        reject(e);
      };
      this.pending.add(fail);
      const frame = (now: number) => {
        if (start < 0) start = now;
        const p = clamp((now - start) / ms, 0, 1);
        update(easing(p));
        if (p < 1) {
          raf = requestAnimationFrame(frame);
        } else {
          this.pending.delete(fail);
          resolve();
        }
      };
      raf = requestAnimationFrame(frame);
    });
  }

  wait(ms: number): Promise<void> {
    this.check();
    return new Promise((resolve, reject) => {
      let id = 0;
      const fail = (e: Error) => {
        clearTimeout(id);
        reject(e);
      };
      this.pending.add(fail);
      id = window.setTimeout(() => {
        this.pending.delete(fail);
        resolve();
      }, ms / this.speed);
    });
  }

  abort(): void {
    this.aborted = true;
    for (const fail of this.pending) fail(new Aborted());
    this.pending.clear();
  }
}

// ---------------------------------------------------------------------------
// stage

export function make<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  parent?: Element,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = className;
  parent?.appendChild(el);
  return el;
}

export function place(el: HTMLElement, b: Box): void {
  el.style.transform = `translate3d(${Math.round(b.x)}px, ${Math.round(b.y)}px, 0)`;
  el.style.width = `${Math.round(b.w)}px`;
  el.style.height = `${Math.round(b.h)}px`;
}

/** Fade an overlay element out and drop it; not tied to the clock, so it also runs after an abort. */
export function dismiss(el: Element | null | undefined, ms = 180): void {
  if (!el) return;
  el.classList.add(styles.fading);
  window.setTimeout(() => el.remove(), ms);
}

export class Stage {
  constructor(
    readonly root: HTMLElement,
    readonly layer: HTMLElement,
  ) {}

  /** An element's box in stage (page) coordinates. */
  box(el: Element): Box {
    const r = el.getBoundingClientRect();
    const s = this.root.getBoundingClientRect();
    return {x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height};
  }

  /** The visible part of the page, in stage coordinates. */
  viewport(): Box {
    const s = this.root.getBoundingClientRect();
    return {x: -s.left, y: -s.top, w: document.documentElement.clientWidth, h: window.innerHeight};
  }

  add<K extends keyof HTMLElementTagNameMap>(tag: K, className: string): HTMLElementTagNameMap[K] {
    return make(tag, className, this.layer);
  }

  ripple(at: Point, color: string): void {
    const r = this.add('span', styles.ripple);
    r.style.setProperty('--c', color);
    // left/top, not transform: the keyframes scale it, and scale would pull a translated ripple to the origin
    r.style.left = `${at.x}px`;
    r.style.top = `${at.y}px`;
    r.addEventListener('animationend', () => r.remove());
  }
}

// ---------------------------------------------------------------------------
// cursors

// Figma's multiplayer pointer: an arrowhead, tip at (3, 2.5)
const ARROW = 'M3 2.5 3 18.6 7.7 14 14.6 13.8Z';

// Lucide-style toolbar glyphs shown in the name tag
const TOOL_ICONS: Record<Exclude<Tool, null>, string> = {
  frame: '<path d="M22 6H2M22 18H2M6 2v20M18 2v20"/>',
  rect: '<rect x="4" y="4" width="16" height="16" rx="1.5"/>',
  text: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
  image:
    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  // Alt held while dragging: duplicate
  copy: '<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
};

export class Cursor {
  readonly root: HTMLDivElement;
  private readonly toolSlot: HTMLSpanElement;
  private currentTool: Tool = null;
  private disposed = false;
  visible = false;
  pos: Point = {x: -100, y: -100};

  /** Each scene hires a fresh crew on its own clock, so an interrupted scene can't act again. */
  constructor(
    private readonly stage: Stage,
    readonly clock: Clock,
    readonly name: string,
    readonly color: string,
  ) {
    this.root = stage.add('div', styles.cursor);
    this.root.style.setProperty('--c', color);
    this.root.innerHTML = `<svg class="${styles.cursorArrow}" viewBox="0 0 24 24"><path d="${ARROW}"/></svg>`;
    const tag = make('span', styles.cursorTag, this.root);
    this.toolSlot = make('span', styles.cursorTool, tag);
    tag.append(name);
    this.set(this.pos);
  }

  set(p: Point): void {
    this.pos = p;
    this.root.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
  }

  show(): void {
    if (this.disposed) return;
    this.visible = true;
    this.root.classList.add(styles.cursorVisible);
  }

  hide(): void {
    this.visible = false;
    this.tool(null);
    this.root.classList.remove(styles.cursorVisible, styles.pressed);
  }

  /** Fade out and leave the canvas for good. */
  dispose(): void {
    this.disposed = true;
    this.hide();
    window.setTimeout(() => this.root.remove(), 300);
  }

  tool(t: Tool): void {
    if (t === this.currentTool) return;
    this.currentTool = t;
    this.toolSlot.innerHTML = t ? `<svg viewBox="0 0 24 24">${TOOL_ICONS[t]}</svg>` : '';
    this.root.classList.toggle(styles.hasTool, Boolean(t));
  }

  /** Glide in from the nearest side of the viewport, unless already on the canvas. */
  enter(toward: Point): void {
    if (this.visible) return;
    const vp = this.stage.viewport();
    const fromLeft = toward.x < vp.x + vp.w / 2;
    this.set({
      x: fromLeft ? vp.x - 40 : vp.x + vp.w + 12,
      y: clamp(toward.y + rand(-90, 90), vp.y + 60, vp.y + vp.h - 60),
    });
    this.show();
  }

  /** Travel along a slightly bowed path with a hand-like landing and a tiny overshoot. */
  async moveTo(target: Point, {duration, arc = 1}: {duration?: number; arc?: number} = {}): Promise<void> {
    const from = this.pos;
    const dx = target.x - from.x;
    const dy = target.y - from.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.5) return;
    const ms = duration ?? clamp(260 + dist * 0.5, 300, 1150);
    const bend = rand(-0.2, 0.2) * arc * dist;
    const ctrl = {x: from.x + dx / 2 - (dy / dist) * bend, y: from.y + dy / 2 + (dx / dist) * bend};
    const over = Math.min(6, dist * 0.025);
    await this.clock.tween(
      ms,
      (p) => {
        const u = ease.aim(p);
        const iu = 1 - u;
        const bump = p > 0.7 ? Math.sin((Math.PI * (p - 0.7)) / 0.3) * over : 0;
        this.set({
          x: iu * iu * from.x + 2 * iu * u * ctrl.x + u * u * target.x + (dx / dist) * bump,
          y: iu * iu * from.y + 2 * iu * u * ctrl.y + u * u * target.y + (dy / dist) * bump,
        });
      },
      ease.linear,
    );
    this.set(target);
  }

  async press(): Promise<void> {
    this.root.classList.add(styles.pressed);
    await this.clock.wait(90);
  }

  async release(): Promise<void> {
    this.root.classList.remove(styles.pressed);
    await this.clock.wait(60);
  }

  async click(): Promise<void> {
    await this.press();
    this.stage.ripple(this.pos, this.color);
    await this.release();
  }

  /** Fidget around the current spot until `until` settles: someone waiting for a teammate. */
  async idle(until: Promise<unknown>): Promise<void> {
    let done = false;
    void until.then(() => {
      done = true;
    });
    const home = this.pos;
    while (!done) {
      await this.moveTo({x: home.x + rand(-16, 16), y: home.y + rand(-12, 12)}, {duration: rand(380, 640), arc: 2});
      if (!done) await this.clock.wait(rand(60, 260));
    }
  }
}

// ---------------------------------------------------------------------------
// canvas chrome

export type SelectionKind = 'select' | 'hover' | 'text';

/** Figma's blue selection: 1px box, white square handles, size badge, layer name. */
export class Selection {
  readonly root: HTMLDivElement;
  private badgeEl?: HTMLSpanElement;
  private labelEl?: HTMLSpanElement;
  private dotEl?: HTMLSpanElement;

  constructor(stage: Stage, kind: SelectionKind = 'select') {
    const kindClass = kind === 'hover' ? styles.selHover : kind === 'text' ? styles.selText : '';
    this.root = stage.add('div', `${styles.sel} ${kindClass}`);
    if (kind === 'select') {
      for (const corner of ['tl', 'tr', 'bl', 'br']) make('span', `${styles.handle} ${styles[corner]}`, this.root);
    }
  }

  place(b: Box): this {
    place(this.root, b);
    return this;
  }

  badge(text: string | null): this {
    if (text === null) {
      this.badgeEl?.remove();
      this.badgeEl = undefined;
      return this;
    }
    this.badgeEl ??= make('span', styles.badge, this.root);
    this.badgeEl.textContent = text;
    return this;
  }

  label(text: string | null): this {
    if (text === null) {
      this.labelEl?.remove();
      this.labelEl = undefined;
      return this;
    }
    this.labelEl ??= make('span', styles.label, this.root);
    this.labelEl.textContent = text;
    return this;
  }

  /** The corner-radius dot Figma shows inside a selected shape. */
  radiusDot(offset: number | null): this {
    if (offset === null) {
      dismiss(this.dotEl, 120);
      this.dotEl = undefined;
      return this;
    }
    this.dotEl ??= make('span', styles.radiusDot, this.root);
    this.dotEl.style.transform = `translate(${offset}px, ${offset}px)`;
    return this;
  }

  remove(): void {
    dismiss(this.root);
  }
}

/** A rectangle as Figma draws it: the default #D9D9D9 fill, square corners. */
export class Shape {
  readonly root: HTMLDivElement;

  constructor(stage: Stage) {
    this.root = stage.add('div', styles.shape);
  }

  place(b: Box): this {
    place(this.root, b);
    return this;
  }

  radius(px: number): this {
    this.root.style.borderRadius = `${px}px`;
    return this;
  }

  /** Swap the default grey for the real surface; CSS transitions do the morph. */
  fill(cs: CSSStyleDeclaration, radius: number): this {
    this.root.classList.add(styles.shapeFilling);
    this.root.style.backgroundColor = cs.backgroundColor;
    this.root.style.borderColor = cs.borderTopColor;
    this.root.style.borderWidth = cs.borderTopWidth;
    this.root.style.borderRadius = `${radius}px`;
    return this;
  }

  remove(): void {
    dismiss(this.root, 280);
  }
}

/** Figma's red spacing guide between two boxes (what you see holding Alt). */
export function measureGap(stage: Stage, a: Box, b: Box): HTMLElement | null {
  const [l, r] = a.x <= b.x ? [a, b] : [b, a];
  const [t, d] = a.y <= b.y ? [a, b] : [b, a];
  const overlapY = Math.min(l.y + l.h, r.y + r.h) - Math.max(l.y, r.y);
  const overlapX = Math.min(t.x + t.w, d.x + d.w) - Math.max(t.x, d.x);
  const wrap = stage.add('div', styles.measure);
  const label = make('span', styles.measureLabel, wrap);
  let gap: number;
  if (overlapY > 0 && r.x >= l.x + l.w - 0.5) {
    gap = r.x - (l.x + l.w);
    // A narrow side-by-side gap can't hold the pill: it would sit on both cards' edges.
    // Like Figma, draw the guide at the top of the gap and hang the number above the row.
    const narrow = gap < 36;
    const top = Math.max(l.y, r.y);
    const y = narrow ? top + 8 : top + overlapY / 2;
    place(wrap, {x: l.x + l.w, y, w: gap, h: 1});
    wrap.classList.add(styles.measureH);
    if (narrow) label.classList.add(styles.measureLabelAbove);
  } else if (overlapX > 0 && d.y >= t.y + t.h - 0.5) {
    gap = d.y - (t.y + t.h);
    const x = Math.max(t.x, d.x) + overlapX / 2;
    place(wrap, {x, y: t.y + t.h, w: 1, h: gap});
    wrap.classList.add(styles.measureV);
  } else {
    wrap.remove();
    return null;
  }
  label.textContent = String(Math.round(gap));
  return wrap;
}

export type Gap = Box & {axis: 'column' | 'row'; size: number};

/**
 * The gaps of an auto layout frame: between neighbours in a row, and between rows across
 * the whole frame (that's how Figma paints a wrapping auto layout).
 */
export function autoLayoutGaps(frame: Box, items: Box[]): Gap[] {
  const rows: Box[][] = [];
  for (const item of [...items].sort((p, q) => p.y - q.y || p.x - q.x)) {
    const row = rows[rows.length - 1];
    if (row && Math.abs(row[0].y - item.y) < 2) row.push(item);
    else rows.push([item]);
  }
  const gaps: Gap[] = [];
  rows.forEach((row, r) => {
    const top = Math.min(...row.map((i) => i.y));
    const bottom = Math.max(...row.map((i) => i.y + i.h));
    row.sort((p, q) => p.x - q.x);
    for (let i = 1; i < row.length; i++) {
      const x = row[i - 1].x + row[i - 1].w;
      const w = row[i].x - x;
      if (w > 0.5) gaps.push({x, y: top, w, h: bottom - top, axis: 'column', size: w});
    }
    const next = rows[r + 1];
    if (next) {
      const h = Math.min(...next.map((i) => i.y)) - bottom;
      if (h > 0.5) gaps.push({x: frame.x, y: bottom, w: frame.w, h, axis: 'row', size: h});
    }
  });
  return gaps;
}

// ---------------------------------------------------------------------------
// text

export type Glyph = Box & {line: number; ch: string};
export type Line = {top: number; bottom: number};

/** Per-character boxes relative to the element, grouped into lines. */
export function measureGlyphs(el: Element): {glyphs: Glyph[]; lines: Line[]} {
  const base = el.getBoundingClientRect();
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  const glyphs: Glyph[] = [];
  const lines: Line[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n as Text;
    for (let i = 0; i < text.length; i++) {
      range.setStart(text, i);
      range.setEnd(text, i + 1);
      const r = range.getBoundingClientRect();
      if (!r.height) continue;
      const g: Glyph = {x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height, line: 0, ch: text.data[i]};
      const last = lines[lines.length - 1];
      if (!last || g.y >= last.bottom - g.h * 0.5) {
        lines.push({top: g.y, bottom: g.y + g.h});
      } else {
        last.top = Math.min(last.top, g.y);
        last.bottom = Math.max(last.bottom, g.y + g.h);
      }
      g.line = lines.length - 1;
      glyphs.push(g);
    }
  }
  return {glyphs, lines};
}

export const keystroke = (ch: string) =>
  ch === ' ' ? rand(90, 150) : /[.,!?:;]/.test(ch) ? rand(140, 220) : rand(42, 100);
