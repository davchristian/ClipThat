"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  Circle,
  MessageCircle,
  RotateCcw,
} from "lucide-react";
import { Modal } from "@/components/ui";
import { useApp } from "@/state/app-provider";
import type { AppNotification } from "./notification-model";

const icons = {
  agenda: CalendarDays,
  review: RotateCcw,
  summary: BookOpenText,
  questions: MessageCircle,
};

export function NotificationStrip({
  notifications,
  handledIds,
}: {
  notifications: AppNotification[];
  handledIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const latest = notifications.find((item) => !handledIds.includes(item.id));
  return (
    <>
      <section className="home-reminders" aria-label="Notifikasi penting">
        <div className="home-reminders-heading">
          <span className="home-reminders-icon">
            <Bell size={19} />
          </span>
          <span>
            <span className="eyebrow">NOTIFIKASI</span>
            <button className="home-reminders-more" onClick={() => setOpen(true)}>
              Lihat lengkapnya <ArrowRight size={14} />
            </button>
          </span>
        </div>
        <div className="home-reminders-list">
          {latest ? (
            <Link className="home-latest-notification" href={latest.href}>
              <span>
                <small>Belum diatasi</small>
                <strong>{latest.title}</strong>
              </span>
              <ArrowRight size={17} />
            </Link>
          ) : (
            <p className="home-reminders-empty">Semua sudah tertangani.</p>
          )}
        </div>
      </section>
      <NotificationModal
        open={open}
        onClose={() => setOpen(false)}
        notifications={notifications}
        handledIds={handledIds}
      />
    </>
  );
}

function NotificationModal({
  open,
  onClose,
  notifications,
  handledIds,
}: {
  open: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  handledIds: string[];
}) {
  const { update } = useApp();
  const ordered = [...notifications].sort(
    (a, b) => Number(handledIds.includes(a.id)) - Number(handledIds.includes(b.id)),
  );
  function toggleHandled(id: string) {
    update((state) => ({
      ...state,
      handledNotifications: (state.handledNotifications || []).includes(id)
        ? (state.handledNotifications || []).filter((item) => item !== id)
        : [...(state.handledNotifications || []), id],
    }));
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Notifikasi"
      subtitle="Pengingat dan kabar dari kelasmu. Tandai jika sudah diatasi."
      wide
      className="notifications-modal"
    >
      {notifications.length ? (
        <div className="notifications-list">
          {ordered.map((item) => (
            <NotificationCard
              item={item}
              handled={handledIds.includes(item.id)}
              onToggleHandled={() => toggleHandled(item.id)}
              key={item.id}
            />
          ))}
        </div>
      ) : (
        <div className="notifications-empty">
          <Bell size={24} />
          <h3>Belum ada notifikasi</h3>
          <p>Pengingat kelas yang perlu kamu lihat akan muncul di sini.</p>
        </div>
      )}
    </Modal>
  );
}

function NotificationCard({
  item,
  handled,
  onToggleHandled,
}: {
  item: AppNotification;
  handled: boolean;
  onToggleHandled: () => void;
}) {
  const Icon = icons[item.kind];
  return (
    <article
      className={`notification-card notification-card-${item.kind} ${handled ? "handled" : ""}`}
    >
      <Link className="notification-card-link" href={item.href}>
        <span className="notification-card-icon">
          <Icon size={18} />
        </span>
        <span className="notification-card-copy">
          <span className="notification-card-label">{item.label}</span>
          <strong>{item.title}</strong>
          <small>{item.detail}</small>
        </span>
        <ArrowUpRight className="notification-card-arrow" size={17} />
      </Link>
      <button
        className={`notification-status ${handled ? "handled" : ""}`}
        aria-label={`${handled ? "Tandai belum diatasi" : "Tandai sudah diatasi"}: ${item.title}`}
        aria-pressed={handled}
        onClick={onToggleHandled}
      >
        {handled ? <CheckCircle2 size={15} /> : <Circle size={15} />}
        {handled ? "Sudah diatasi" : "Belum diatasi"}
      </button>
    </article>
  );
}
