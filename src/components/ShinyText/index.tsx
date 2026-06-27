import React, { type CSSProperties, type ReactNode } from 'react';

import styles from './styles.module.css';

type ShinyTextProps = {
  children?: ReactNode;
  className?: string;
  color?: string;
  delay?: number;
  direction?: 'left' | 'right';
  disabled?: boolean;
  pauseOnHover?: boolean;
  shineColor?: string;
  speed?: number;
  spread?: number;
  text?: string;
  yoyo?: boolean;
};

type ShinyTextStyle = CSSProperties & {
  '--shiny-text-color': string;
  '--shiny-text-delay': string;
  '--shiny-text-direction': string;
  '--shiny-text-duration': string;
  '--shiny-text-shine-color': string;
  '--shiny-text-spread': string;
};

export default function ShinyText({
  children,
  className = '',
  color = 'var(--ifm-heading-color, var(--ifm-font-color-base))',
  delay = 0,
  direction = 'left',
  disabled = false,
  pauseOnHover = false,
  shineColor = 'var(--ifm-color-content-inverse, #fff)',
  speed = 2,
  spread = 120,
  text,
  yoyo = false,
}: ShinyTextProps): ReactNode {
  const animationName =
    direction === 'left' ? styles.shineLeft : styles.shineRight;
  const classNames = [
    styles.shinyText,
    !disabled && animationName,
    yoyo && styles.yoyo,
    pauseOnHover && styles.pauseOnHover,
    className,
  ].filter(Boolean);
  const style: ShinyTextStyle = {
    '--shiny-text-color': color,
    '--shiny-text-delay': `${Math.max(delay, 0)}s`,
    '--shiny-text-direction': direction === 'left' ? 'normal' : 'reverse',
    '--shiny-text-duration': `${Math.max(speed, 0.01)}s`,
    '--shiny-text-shine-color': shineColor,
    '--shiny-text-spread': `${spread}deg`,
  };

  if (disabled) {
    return <span className={className}>{text ?? children}</span>;
  }

  return (
    <span className={classNames.join(' ')} style={style}>
      {text ?? children}
    </span>
  );
}
