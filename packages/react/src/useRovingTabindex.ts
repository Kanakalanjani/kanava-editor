import { useCallback, useRef } from "react";

/**
 * Hook that implements roving tabindex for keyboard navigation within
 * a toolbar or menu container. Handles arrow key navigation between
 * focusable children, with wrap-around.
 *
 * Usage: Spread `getRovingProps()` on the container element.
 * Each interactive child should use `tabIndex={-1}` (the hook manages
 * which child gets `tabIndex={0}` on focus).
 */
export function useRovingTabindex(
  orientation: "horizontal" | "vertical" = "horizontal",
) {
  const containerRef = useRef<HTMLElement | null>(null);

  const getFocusableChildren = (): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [role="menuitem"]:not([aria-disabled="true"]), [role="option"]:not([aria-disabled="true"]), input, [tabindex]',
      ),
    ).filter((el) => el.tabIndex !== undefined && !el.hasAttribute("disabled"));
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const prevKey = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
      const nextKey = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";

      if (e.key !== prevKey && e.key !== nextKey && e.key !== "Home" && e.key !== "End") {
        return;
      }

      const items = getFocusableChildren();
      if (items.length === 0) return;

      const currentIndex = items.indexOf(e.target as HTMLElement);
      if (currentIndex < 0) return;

      e.preventDefault();
      let nextIndex: number;

      if (e.key === "Home") {
        nextIndex = 0;
      } else if (e.key === "End") {
        nextIndex = items.length - 1;
      } else if (e.key === nextKey) {
        nextIndex = (currentIndex + 1) % items.length;
      } else {
        nextIndex = (currentIndex - 1 + items.length) % items.length;
      }

      items[nextIndex].focus();
    },
    [orientation],
  );

  const getRovingProps = useCallback(
    () => ({
      ref: (el: HTMLElement | null) => { containerRef.current = el; },
      onKeyDown: handleKeyDown,
    }),
    [handleKeyDown],
  );

  return { getRovingProps };
}
