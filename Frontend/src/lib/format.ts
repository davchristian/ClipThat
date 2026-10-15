export function seconds(value: number) {
  const whole = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  return (
    Math.floor(whole / 60)
      .toString()
      .padStart(2, "0") +
    ":" +
    (whole % 60).toString().padStart(2, "0")
  );
}

export function dateLabel(date: string, long = false) {
  return new Date(date + "T12:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: long ? "long" : "short",
  });
}
