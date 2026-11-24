import { useId } from 'react';

/**
 * Al Sadu weave band: teeth (ewairjan) rows framing alternating diamonds.
 * Used as the seam under the header and as the progress band of a date request.
 */
export function SaduBand({
  className = '',
  height = 14,
  tone = 'full',
}: {
  className?: string;
  height?: number;
  /** `full` = woven colours, `muted` = unfinished threads, `gold` = on dark backgrounds. */
  tone?: 'full' | 'muted' | 'gold';
}) {
  const id = useId().replace(/:/g, '');
  const scale = height / 18;
  const c =
    tone === 'muted'
      ? { bg: 'var(--color-gypsum-200)', teeth: 'var(--color-gypsum-300)', a: 'var(--color-gypsum-300)', b: 'var(--color-gypsum-50)', dot: 'var(--color-gypsum-400)' }
      : tone === 'gold'
        ? { bg: 'transparent', teeth: 'var(--color-dallah-500)', a: 'var(--color-dallah-400)', b: 'var(--color-majlis-700)', dot: 'var(--color-dallah-200)' }
        : { bg: 'var(--color-majlis-800)', teeth: 'var(--color-dallah-500)', a: 'var(--color-sadu-500)', b: 'var(--color-dallah-100)', dot: 'var(--color-majlis-800)' };
  return (
    <svg className={`block w-full ${className}`} height={height} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <pattern id={`sadu-${id}`} width="24" height="18" patternUnits="userSpaceOnUse" patternTransform={`scale(${scale})`}>
          <rect width="24" height="18" fill={c.bg} />
          <path d="M0 0l6 4 6-4 6 4 6-4z" fill={c.teeth} />
          <path d="M0 18l6-4 6 4 6-4 6 4z" fill={c.teeth} />
          <path d="M6 5l4 4-4 4-4-4z" fill={c.a} />
          <path d="M18 5l4 4-4 4-4-4z" fill={c.b} />
          <circle cx="6" cy="9" r="1" fill={c.b} />
          <circle cx="18" cy="9" r="1" fill={c.dot} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#sadu-${id})`} />
    </svg>
  );
}
