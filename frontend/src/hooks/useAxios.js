import { useState, useEffect } from "react";
import api from "../utils/api";

// Generic axios-based data fetching hook
export default function useAxios({
  method,
  url,
  body = null,
  runOnMount = true,
}) {
  const [data, setData] = useState(null);
  const [isLoading, setLoading] = useState(runOnMount);
  const [error, setError] = useState(null);

  // Manual or initial request trigger
  const sendRequest = async (customBody = body) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api({ method, url, data: customBody });
      setData(res.data); // Store response data
      return res;
    } catch (err) {
      setError(err); // Capture error for UI feedback
      throw err; // Allow consumer to catch it
    } finally {
      setLoading(false);
    }
  };

  // Auto-run request on mount if specified
  useEffect(() => {
    if (runOnMount) {
      sendRequest();
    }
  }, []);

  return { data, isLoading, error, sendRequest };
}
