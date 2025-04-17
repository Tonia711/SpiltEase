import { useState, useEffect } from "react";
import api from "../utils/api";

export default function useAxios({
  method,
  url,
  body = null,
  runOnMount = true,
}) {
  const [data, setData] = useState(null);
  const [isLoading, setLoading] = useState(runOnMount);
  const [error, setError] = useState(null);

  const sendRequest = async (customBody = body) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api({ method, url, data: customBody });
      setData(res.data);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (runOnMount) {
      sendRequest();
    }
  }, []);

  return { data, isLoading, error, sendRequest };
}
