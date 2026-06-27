import React, { useEffect, type ReactNode } from 'react';

import type { Props } from '@theme/Root';

type LiquidGlassConfig = {
  alpha: number;
  blur: number;
  border: number;
  b: number;
  displace: number;
  frost: number;
  g: number;
  lightness: number;
  r: number;
  radius: number;
  saturation: number;
  scale: number;
  x: 'R' | 'G' | 'B';
  y: 'R' | 'G' | 'B';
};

const liquidGlassPill: LiquidGlassConfig = {
  alpha: 0.93,
  blur: 11,
  border: 0.07,
  b: 20,
  displace: 0,
  frost: 0,
  g: 10,
  lightness: 50,
  r: 0,
  radius: 40,
  saturation: 1,
  scale: -180,
  x: 'R',
  y: 'B',
};

const liquidGlassRounded: LiquidGlassConfig = {
  ...liquidGlassPill,
  radius: 24,
};

function buildDisplacementImage(width: number, height: number, config: LiquidGlassConfig): string {
  const border = Math.min(width, height) * (config.border * 0.5);
  const radius = Math.min(config.radius, Math.min(width, height) * 0.5);
  const innerWidth = Math.max(width - border * 2, 0);
  const innerHeight = Math.max(height - border * 2, 0);
  const svg = `
    <svg class="displacement-image" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="red" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#0000"/>
          <stop offset="100%" stop-color="red"/>
        </linearGradient>
        <linearGradient id="blue" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0000"/>
          <stop offset="100%" stop-color="blue"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${width}" height="${height}" fill="black"/>
      <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="url(#red)"/>
      <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="url(#blue)" style="mix-blend-mode: ${'difference'}"/>
      <rect x="${border}" y="${border}" width="${innerWidth}" height="${innerHeight}" rx="${radius}" fill="hsl(0 0% ${config.lightness}% / ${config.alpha})" style="filter:blur(${config.blur}px)"/>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;
}

function createFilter(id: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'liquid-glass-filter');
  svg.setAttribute('focusable', 'false');
  svg.innerHTML = `
    <defs>
      <filter id="${id}" color-interpolation-filters="sRGB">
        <feImage x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map"/>
        <feDisplacementMap id="${id}-redchannel" in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="B" result="dispRed"/>
        <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="red"/>
        <feDisplacementMap id="${id}-greenchannel" in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="B" result="dispGreen"/>
        <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="green"/>
        <feDisplacementMap id="${id}-bluechannel" in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="B" result="dispBlue"/>
        <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="blue"/>
        <feBlend in="red" in2="green" mode="screen" result="rg"/>
        <feBlend in="rg" in2="blue" mode="screen" result="output"/>
        <feGaussianBlur in="output" stdDeviation="0"/>
      </filter>
    </defs>
  `;
  return svg;
}

function updateFilter(element: HTMLElement, id: string, config: LiquidGlassConfig): void {
  const rect = element.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);

  if (width === 0 || height === 0) {
    return;
  }

  const radius = element.classList.contains('navbar-sidebar')
    ? Math.min(config.radius, Math.round(Math.min(width, height) * 0.5))
    : Math.round(height * 0.5);
  const image = buildDisplacementImage(width, height, { ...config, radius });
  const filter = element.querySelector<SVGFilterElement>(`#${CSS.escape(id)}`);
  const imageNode = filter?.querySelector<SVGFEImageElement>('feImage');
  const displacementNodes = filter?.querySelectorAll<SVGFEDisplacementMapElement>(
    'feDisplacementMap',
  );
  const blur = filter?.querySelector<SVGFEGaussianBlurElement>('feGaussianBlur');

  imageNode?.setAttribute('href', image);
  displacementNodes?.[0]?.setAttribute('scale', `${config.scale + config.r}`);
  displacementNodes?.[1]?.setAttribute('scale', `${config.scale + config.g}`);
  displacementNodes?.[2]?.setAttribute('scale', `${config.scale + config.b}`);
  displacementNodes?.forEach((node) => {
    node.setAttribute('xChannelSelector', config.x);
    node.setAttribute('yChannelSelector', config.y);
  });
  blur?.setAttribute('stdDeviation', `${config.displace}`);

  element.style.setProperty('--liquid-glass-filter', `url("#${id}")`);
  element.style.setProperty('--liquid-glass-frost', `${config.frost}`);
  element.style.setProperty('--liquid-glass-radius', `${radius}px`);
  element.style.setProperty('--liquid-glass-saturation', `${config.saturation}`);
  element.dataset.liquidGlassReady = 'true';
}

function setupLiquidGlass(): () => void {
  const observers = new Map<HTMLElement, ResizeObserver>();

  const register = (element: HTMLElement) => {
    if (observers.has(element)) {
      return;
    }

    const id = `liquid-glass-${observers.size}`;
    const config = element.classList.contains('navbar-sidebar')
      ? liquidGlassRounded
      : liquidGlassPill;
    const oldFilter = element.querySelector('.liquid-glass-filter');
    oldFilter?.remove();
    element.append(createFilter(id));
    updateFilter(element, id, config);

    const observer = new ResizeObserver(() => updateFilter(element, id, config));
    observer.observe(element);
    observers.set(element, observer);
  };

  const registerAll = () => {
    document
      .querySelectorAll<HTMLElement>('.liquid-glass, .navbar, .navbar-sidebar')
      .forEach(register);
  };

  registerAll();

  const mutationObserver = new MutationObserver(registerAll);
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return () => {
    mutationObserver.disconnect();
    observers.forEach((observer) => observer.disconnect());
    document.querySelectorAll('.liquid-glass-filter').forEach((filter) => filter.remove());
    document.querySelectorAll<HTMLElement>('[data-liquid-glass-ready]').forEach((element) => {
      delete element.dataset.liquidGlassReady;
      element.style.removeProperty('--liquid-glass-filter');
      element.style.removeProperty('--liquid-glass-frost');
      element.style.removeProperty('--liquid-glass-radius');
      element.style.removeProperty('--liquid-glass-saturation');
    });
  };
}

export default function Root({ children }: Props): ReactNode {
  useEffect(() => setupLiquidGlass(), []);

  return <>{children}</>;
}
