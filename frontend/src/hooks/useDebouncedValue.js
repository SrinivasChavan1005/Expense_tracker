import { useEffect, useState } from "react";

// Returns `value` only after it has stopped changing for `delay` ms.
// Used for the search box so we don't call the API on every keystroke.
export function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
