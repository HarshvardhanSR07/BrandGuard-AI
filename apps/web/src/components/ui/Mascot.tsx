import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

const DIRECTIONS = [
  'up-left',
  'up',
  'up-right',
  'left',
  'center',
  'right',
  'down-left',
  'down',
  'down-right',
] as const;

const REACTIONS = [
  'blink',
  'heart',
  'sparkle',
  'surprised',
  'wink',
  'bashful',
  'sleepy',
  'dizzy',
  'delighted',
] as const;

export type Direction = (typeof DIRECTIONS)[number];
export type Reaction = (typeof REACTIONS)[number];

// Clockwise 8 sectors from 0 rad (right), matching atan2 with y pointing down.
const CLOCKWISE: Direction[] = [
  'right',
  'down-right',
  'down',
  'down-left',
  'left',
  'up-left',
  'up',
  'up-right',
];

const PAYOFFS: Reaction[] = ['heart', 'sparkle', 'delighted'];
const BOOP_PAYOFF = 120;
const BOOP_END = 600;
const SQUASH_MS = 420;
const DIZZY_AFTER = 4;
const DIZZY_WINDOW = 1600;
const DIZZY_END = 1100;

const SQUASH: Keyframe[] = [
  { transform: 'scale(1, 1)', easing: 'ease-in' },
  { transform: 'scale(1.10, 0.86)', offset: 0.18, easing: 'ease-out' },
  { transform: 'scale(0.95, 1.08)', offset: 0.45, easing: 'ease-in-out' },
  { transform: 'scale(1.03, 0.97)', offset: 0.72, easing: 'ease-in-out' },
  { transform: 'scale(1, 1)' },
];

// background-size 300% makes each cell a clean 0/50/100% step on both axes.
function cell(index: number): CSSProperties {
  return { backgroundPosition: `${(index % 3) * 50}% ${Math.floor(index / 3) * 50}%` };
}

const layer: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundSize: '300% 300%',
  backgroundRepeat: 'no-repeat',
};

export type MascotProps = {
  /** The 3x3 sheet of head directions. */
  directions: string;
  /** The 3x3 sheet of expressions. */
  reactions: string;
  size?: number;
  className?: string;
  /** What a screen reader calls it. */
  label?: string;
};

export function Mascot(props: MascotProps) {
  const { directions, reactions, size = 140, className, label = 'mascot' } = props;

  const buttonRef = useRef<HTMLButtonElement>(null);
  const squashRef = useRef<HTMLSpanElement>(null);
  const timersRef = useRef<number[]>([]);
  const boopsRef = useRef({ count: 0, at: 0 });

  // Cross-fading direction states for buttery smooth gaze transitions
  const [activeDirection, setActiveDirection] = useState<Direction>('center');
  const [prevDirection, setPrevDirection] = useState<Direction>('center');
  const [isCrossFading, setIsCrossFading] = useState(false);
  const [reaction, setReaction] = useState<Reaction | null>(null);

  // Smooth continuous parallax head tilt & lean
  const [parallax, setParallax] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      return;
    }

    let currentSector = -1;
    let pointer: { x: number; y: number } | null = null;
    let rafId: number | null = null;

    const aim = () => {
      const button = buttonRef.current;
      if (!button || !pointer) {
        return;
      }

      const box = button.getBoundingClientRect();
      // Calibrated anchor: mascot head/eyes are at ~42% height of the portrait bust
      const centerX = box.left + box.width * 0.5;
      const centerY = box.top + box.height * 0.42;

      const dx = pointer.x - centerX;
      const dy = pointer.y - centerY;

      // Continuous smooth parallax offset (clamped between -1 and 1)
      const maxDistance = Math.max(window.innerWidth * 0.35, 320);
      const px = Math.max(-1, Math.min(1, dx / maxDistance));
      const py = Math.max(-1, Math.min(1, dy / maxDistance));
      setParallax({ x: px, y: py });

      // Responsive dead zone: within 18% of mascot size, look straight ahead ('center')
      const deadZone = Math.max(16, size * 0.18);
      if (Math.hypot(dx, dy) < deadZone) {
        if (currentSector !== -1) {
          currentSector = -1;
          changeDirection('center');
        }
        return;
      }

      // Convert (dx, dy) into normalized angle [0, 2*PI)
      const rad = Math.atan2(dy, dx);
      const angle = rad < 0 ? rad + 2 * Math.PI : rad;

      // 8 sectors of 45 deg (PI/4 rad), shifted by half sector (PI/8 rad)
      const rawSector = ((angle + Math.PI / 8) % (2 * Math.PI)) / (Math.PI / 4);
      const sector = Math.floor(rawSector);

      if (sector !== currentSector) {
        // Hysteresis buffer to eliminate boundary jitter
        const fraction = rawSector - sector;
        if (currentSector === -1 || (fraction > 0.08 && fraction < 0.92)) {
          currentSector = sector;
          changeDirection(CLOCKWISE[sector]);
        }
      }
    };

    const changeDirection = (next: Direction) => {
      setActiveDirection((curr) => {
        if (curr === next) return curr;
        setPrevDirection(curr);
        setIsCrossFading(true);
        window.setTimeout(() => setIsCrossFading(false), 140);
        return next;
      });
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      if (!rafId) {
        rafId = window.requestAnimationFrame(() => {
          rafId = null;
          aim();
        });
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('scroll', aim, { passive: true });

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', aim);
    };
  }, [size]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(window.clearTimeout);
    };
  }, []);

  const boop = () => {
    timersRef.current.forEach(window.clearTimeout);
    timersRef.current = [];

    const later = (ms: number, next: Reaction | null) => {
      timersRef.current.push(window.setTimeout(() => setReaction(next), ms));
    };

    const now = Date.now();
    const boops = boopsRef.current;
    boops.count = now - boops.at < DIZZY_WINDOW ? boops.count + 1 : 1;
    boops.at = now;

    if (boops.count >= DIZZY_AFTER) {
      boops.count = 0;
      setReaction('dizzy');
      later(DIZZY_END, null);
    } else {
      setReaction('blink');
      later(BOOP_PAYOFF, PAYOFFS[(boops.count - 1) % PAYOFFS.length]);
      later(BOOP_END, null);
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    squashRef.current?.animate(SQUASH, { duration: SQUASH_MS, easing: 'linear' });
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={boop}
      aria-label={`Boop the ${label}`}
      className={className}
      style={{
        position: 'relative',
        display: 'block',
        flexShrink: 0,
        width: size,
        height: size,
        padding: 0,
        border: 0,
        background: 'transparent',
        appearance: 'none',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <span
        ref={squashRef}
        style={{
          position: 'relative',
          display: 'block',
          width: '100%',
          height: '100%',
          transformOrigin: '50% 78%',
          transform: `translate3d(${parallax.x * 7}px, ${parallax.y * 5}px, 0) rotate(${parallax.x * 2.8}deg)`,
          transition: 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {/* Underlying Previous Direction Layer (During Dissolve) */}
        {isCrossFading && (
          <span
            aria-hidden="true"
            style={{
              ...layer,
              backgroundImage: `url(${directions})`,
              ...cell(DIRECTIONS.indexOf(prevDirection)),
              opacity: reaction ? 0 : 1,
            }}
          />
        )}

        {/* Active Incoming Direction Layer with Silky Cross-Fade */}
        <span
          aria-hidden="true"
          style={{
            ...layer,
            backgroundImage: `url(${directions})`,
            ...cell(DIRECTIONS.indexOf(activeDirection)),
            opacity: reaction ? 0 : 1,
            animation: isCrossFading ? 'mascotCrossFade 0.14s ease-out forwards' : undefined,
          }}
        />

        {/* Reactions Layer (Boop pay-offs, winks, sparkles) */}
        <span
          aria-hidden="true"
          style={{
            ...layer,
            backgroundImage: `url(${reactions})`,
            ...cell(REACTIONS.indexOf(reaction ?? 'blink')),
            opacity: reaction ? 1 : 0,
            transition: 'opacity 0.09s ease-in-out',
          }}
        />
      </span>
    </button>
  );
}
