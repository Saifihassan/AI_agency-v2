"use client";

import { useEffect, useState } from "react";
import { createClient } from "./client";

export function useAuthUser() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        setUser(data.user ? { id: data.user.id, email: data.user.email } : null);
        setLoading(false);
      });
    } catch {
      setLoading(false);
    }
  }, []);

  return { user, loading };
}
