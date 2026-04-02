"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to `community_posts` for the active community or private thread.
 * Uses a ref so the callback does not need a stable identity.
 */
export function useCommunityPostsRealtime(
  communityId: string | null,
  selectedPrivateChatId: string | null,
  onChange: () => void
) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!communityId) return;

    const filter = selectedPrivateChatId
      ? `private_chat_id=eq.${selectedPrivateChatId}`
      : `community_id=eq.${communityId}`;

    const channel = supabase
      .channel(
        `community-posts-${communityId}-${selectedPrivateChatId ?? "public"}`
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "community_posts",
          filter,
        },
        () => {
          onChangeRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId, selectedPrivateChatId]);
}
