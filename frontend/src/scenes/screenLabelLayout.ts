const LABEL_OVERLAP_GAP = 6;

export function hasHigherPriorityScreenOverlap(node: HTMLElement): boolean {
  const bounds = node.getBoundingClientRect();
  if (bounds.width === 0 || bounds.height === 0) return false;

  const priority = Number(node.dataset.screenLabelPriority);
  const candidates = document.querySelectorAll<HTMLElement>(
    "[data-screen-obstacle], [data-screen-label-priority]"
  );

  for (const candidate of candidates) {
    if (candidate === node || candidate.offsetWidth === 0 || candidate.offsetHeight === 0) {
      continue;
    }

    const style = getComputedStyle(candidate);
    if (
      style.visibility === "hidden" ||
      style.display === "none" ||
      Number(style.opacity) <= 0.01
    ) {
      continue;
    }

    if (
      !candidate.hasAttribute("data-screen-obstacle") &&
      Number(candidate.dataset.screenLabelPriority) >= priority
    ) {
      continue;
    }

    const occupied = candidate.getBoundingClientRect();
    if (
      bounds.left < occupied.right + LABEL_OVERLAP_GAP &&
      bounds.right > occupied.left - LABEL_OVERLAP_GAP &&
      bounds.top < occupied.bottom + LABEL_OVERLAP_GAP &&
      bounds.bottom > occupied.top - LABEL_OVERLAP_GAP
    ) {
      return true;
    }
  }

  return false;
}
