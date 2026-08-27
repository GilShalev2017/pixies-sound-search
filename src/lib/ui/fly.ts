// Called from one place: SoundExplorer.tsx's `handleSelect`, right after a
// result is clicked, before the track is set as `selected`. It's the only
// export (`flyToStage`) - purely visual, has no idea what a "track" is,
// just animates one DOM rect to another.
/**
 * The "fly to the image container" transition.
 *
 * Implemented with the Web Animations API on a throwaway ghost element: the
 * result row keeps its place in the list (no layout thrash), and the ghost is
 * removed as soon as the flight ends, so nothing leaks into the DOM.
 */

export interface FlyOptions {
  readonly imageUrl: string | null;
  readonly durationMs?: number;
  readonly reducedMotion?: boolean;
}

function rectOf(element: Element): DOMRect {
  return element.getBoundingClientRect();
}

/**
 * What this does, step by step:
 * 1. Bails out immediately (no animation) if reduced-motion is on, this
 *    isn't running in a browser, or the Web Animations API is unsupported.
 * 2. Measures `source` and `target`'s current on-screen rectangles.
 * 3. Creates a throwaway `ghost` div, styled to sit exactly on top of
 *    `source` (same position/size, same image or a fallback gradient).
 * 4. Computes how far the ghost needs to move and scale to land on `target`.
 * 5. Animates the ghost through those keyframes with `.animate()`.
 * 6. Once the animation finishes (or errors), removes the ghost from the DOM.
 */
export function flyToStage(source: Element, target: Element, options: FlyOptions): Promise<void> {
  const { imageUrl, durationMs = 720, reducedMotion = false } = options;

  if (reducedMotion || typeof document === 'undefined' || typeof Element.prototype.animate !== 'function') {
    return Promise.resolve();
  }

  const from = rectOf(source);
  const to = rectOf(target);
  if (from.width === 0 || to.width === 0) return Promise.resolve();

  const ghost = document.createElement('div');
  ghost.className = 'fly-ghost';
  ghost.setAttribute('aria-hidden', 'true');
  ghost.style.left = `${from.left}px`;
  ghost.style.top = `${from.top}px`;
  ghost.style.width = `${from.width}px`;
  ghost.style.height = `${from.height}px`;
  if (imageUrl) ghost.style.backgroundImage = `url("${imageUrl}")`;
  else ghost.style.background = 'linear-gradient(140deg, #7c3aed, #22d3ee)';

  document.body.appendChild(ghost);

  const scaleX = to.width / from.width;
  const scaleY = to.height / from.height;
  const translateX = to.left + to.width / 2 - (from.left + from.width / 2);
  const translateY = to.top + to.height / 2 - (from.top + from.height / 2);

  const animation = ghost.animate(
    [
      { transform: 'translate(0px, 0px) scale(1)', opacity: 1, offset: 0 },
      {
        transform: `translate(${translateX * 0.55}px, ${translateY * 0.5 - 26}px) scale(${
          1 + (Math.max(scaleX, scaleY) - 1) * 0.55
        })`,
        opacity: 1,
        offset: 0.6,
      },
      {
        transform: `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`,
        opacity: 0,
        offset: 1,
      },
    ],
    { duration: durationMs, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
  );

  return animation.finished
    .catch(() => undefined)
    .then(() => {
      ghost.remove();
    });
}
