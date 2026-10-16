// Loads data from the API and tracks loading / error state.
//
// Usage:
//   const { data, status, error, reload } = useApiData(
//     (signal) => getDashboardSummary(range, { signal }),
//     [range.from, range.to]
//   );
//
// - Re-runs whenever a value in `deps` changes.
// - Cancels the previous request if the inputs change before it finishes, so
//   an old, slow response can't overwrite newer data.
// - Keeps showing the previous data while reloading (no flicker).
import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage, isAbortError } from "../utils/helper";

export function useApiData(fetcher, deps) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Always call the latest fetcher without making it an effect dependency.
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher; // runs before the effect below (same render)
  });

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setError("");

    fetcherRef
      .current(controller.signal)
      .then((result) => {
        setData(result);
        setStatus("success");
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        setError(getErrorMessage(err, "Couldn't load this data."));
        setStatus("error");
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { data, status, error, reload, isLoading: status === "loading" };
}
