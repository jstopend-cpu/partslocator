"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Bell } from "lucide-react";
import {
  getUnreadNotificationCount,
  getNotifications,
  markNotificationRead,
  type NotificationRow,
} from "@/app/actions/notifications";

const NOTIFICATION_ICONS: Record<string, string> = {
  NEW_USER: "🆕",
  SEARCH_LIMIT: "⚠️",
  NEW_ORDER: "📦",
  ADMIN_ACTION: "📝",
};

export default function AdminHeader() {
  const [bellOpen, setBellOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [list, setList] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadUnread = () => {
    getUnreadNotificationCount().then((r) => {
      if (r.ok && "count" in r) setUnreadCount(r.count);
    });
  };

  useEffect(() => {
    loadUnread();
    const t = setInterval(loadUnread, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (bellOpen) {
      setLoading(true);
      getNotifications(15).then((r) => {
        setLoading(false);
        if (r.ok && "data" in r) setList(r.data);
      });
    }
  }, [bellOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    loadUnread();
    setList((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setBellOpen(!bellOpen)}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/80 text-slate-300 transition-colors hover:border-orange-500/50 hover:bg-slate-800 hover:text-orange-400"
          aria-label={unreadCount > 0 ? `${unreadCount} αδιάβαστες ειδοποιήσεις` : "Ειδοποιήσεις"}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-xs font-medium text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
        {bellOpen && (
          <div className="absolute right-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
            <div className="border-b border-slate-700 bg-slate-800/80 px-3 py-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Ειδοποιήσεις
              </span>
              <Link
                href="/admin?tab=notifications"
                onClick={() => setBellOpen(false)}
                className="text-xs text-orange-400 hover:text-orange-300"
              >
                Όλες
              </Link>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-8 text-slate-500">Φόρτωση...</div>
              ) : list.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-500">Δεν υπάρχουν ειδοποιήσεις</div>
              ) : (
                <ul className="divide-y divide-slate-800">
                  {list.map((n) => (
                    <li
                      key={n.id}
                      className={`px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-800/60 ${
                        !n.isRead ? "bg-slate-800/40" : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => {
                          if (!n.isRead) handleMarkRead(n.id);
                        }}
                      >
                        <span className="mr-2" aria-hidden>
                          {NOTIFICATION_ICONS[n.type] ?? "📌"}
                        </span>
                        <span className={n.isRead ? "text-slate-400" : "text-slate-200"}>
                          {n.message.length > 80 ? `${n.message.slice(0, 80)}…` : n.message}
                        </span>
                        <div className="mt-1 text-[11px] text-slate-500">
                          {new Date(n.createdAt).toLocaleString("el-GR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
      <UserButton
        appearance={{
          elements: { avatarBox: "h-9 w-9" },
        }}
      />
    </div>
  );
}
