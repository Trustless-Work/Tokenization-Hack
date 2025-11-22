import React, { useEffect } from "react";

export const useOutsideClick = (
  ref: React.RefObject<HTMLDivElement>,
  callback: Function,
) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Element | null;

      // Ignore clicks occurring inside any open dialog rendered via portal
      // (e.g., Radix/shadcn Dialog), to avoid unintended outside-close.
      if (target && target.closest('[role="dialog"]')) {
        return;
      }

      // DO NOTHING if the element being clicked is the target element or their children
      if (!ref.current || (target && ref.current.contains(target))) {
        return;
      }
      callback(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, callback]);
};
