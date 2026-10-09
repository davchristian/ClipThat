export function seconds(value: number) {
  return (
    Math.floor(value / 60)
      .toString()
      .padStart(2, "0") +
    ":" +
    (value % 60).toString().padStart(2, "0")
  );
}

export function dateLabel(date: string, long = false) {
  return new Date(date + "T12:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: long ? "long" : "short",
  });
}
