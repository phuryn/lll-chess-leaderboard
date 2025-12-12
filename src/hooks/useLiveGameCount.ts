import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useLiveGameCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
    
    const { count: liveCount, error } = await supabase
      .from("games")
      .select("*", { count: "exact", head: true })
      .eq("status", "continue")
      .gte("created_at", eightHoursAgo);

    if (!error && liveCount !== null) {
      setCount(liveCount);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  return { count, loading, refetch: fetchCount };
}
