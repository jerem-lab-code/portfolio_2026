export function initScrollLock({ allowSelector }) {
  function isAllowedTarget(target) {
    if (!target || !(target instanceof Element)) return false;
    return Boolean(target.closest(allowSelector));
  }

  // iOS Safari: stop page rubber-banding; allow scroll only inside the gallery.
  document.addEventListener(
    "touchmove",
    (event) => {
      if (isAllowedTarget(event.target)) return;
      event.preventDefault();
    },
    { passive: false }
  );

  // Desktop trackpads / wheels: same rule.
  document.addEventListener(
    "wheel",
    (event) => {
      if (isAllowedTarget(event.target)) return;
      event.preventDefault();
    },
    { passive: false }
  );
}

