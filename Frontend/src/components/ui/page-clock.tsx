"use client";

import { useEffect, useState } from "react";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});
const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Jakarta",
});

export function PageClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const refresh = () => setNow(new Date());
    refresh();
    const timer = window.setInterval(refresh, 1000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  return (
    <div className="page-clock" aria-label="Waktu saat ini">
      <time dateTime={now?.toISOString()}>
        <span>{now ? dateFormatter.format(now) : ""}</span>
        <span>{now ? `${timeFormatter.format(now)} WIB` : ""}</span>
      </time>
    </div>
  );
}
