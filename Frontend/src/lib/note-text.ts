// Source IDs belong in source_ids metadata, not in readable note text.
export function cleanNoteText(text: string): string {
  const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
  return text
    .replace(new RegExp(`\\s*\\[\\s*${uuid}(?:\\s*[,;]\\s*${uuid})*\\s*\\]`, "gi"), "")
    .trim();
}
