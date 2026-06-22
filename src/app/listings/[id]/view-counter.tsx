"use client";

import { useEffect } from "react";
import { useTelegram } from "@/context/telegram";

export function ViewCounter({ listingId }: { listingId: string }) {
  const { token } = useTelegram();

  useEffect(() => {
    fetch(`/api/listings/${listingId}/view`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).catch(() => {});
  }, [listingId, token]);

  return null;
}
