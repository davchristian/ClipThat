"use client";
import { useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { liveMode } from "@/lib/app-mode";
import { supabaseConfigError } from "@/lib/supabase-config";

export function useTranscriptRealtime(
  sessionId: string,
  ready: boolean,
  reload: () => Promise<void>,
) {
  useEffect(() => {
    if (!liveMode || !ready) return;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (supabaseConfigError(url, key)) return;
    const db = createBrowserClient(url!, key!);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      // Throttle rather than debounce: continuous inserts must not postpone refresh forever.
      if (timer) return;
      timer = setTimeout(() => {
        timer = undefined;
        void reload();
      }, 300);
    };
    const channel = db
      .channel(`transcript:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transcript_segments",
          filter: `session_id=eq.${sessionId}`,
        },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${sessionId}` },
        refresh,
      )
      .subscribe();
    // Existing polling remains a fallback for reconnects or disabled replication.
    return () => {
      if (timer) clearTimeout(timer);
      void db.removeChannel(channel);
    };
  }, [sessionId, ready, reload]);
}
