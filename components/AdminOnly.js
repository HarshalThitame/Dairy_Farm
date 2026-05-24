"use client";

import { useAuth } from "@/context/AuthContext";

export default function AdminOnly({ children, fallback = null }) {
  const { isAdmin, isFarmOwner, isSuperAdmin } = useAuth();

  if (isAdmin || isFarmOwner || isSuperAdmin) {
    return children;
  }

  return fallback;
}
