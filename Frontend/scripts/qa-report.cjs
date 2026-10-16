const fs = require("node:fs");
const path = require("node:path");
const root = "docs/qa/2026-10-16";
const read = (name) => {
  const buffer = fs.readFileSync(path.join(root, name));
  return buffer
    .toString(buffer[0] === 0xff && buffer[1] === 0xfe ? "utf16le" : "utf8")
    .replace(/^\uFEFF/, "");
};
const escape = (value) =>
  String(value)
    .replace(/\|/g, "\\|")
    .replace(/[\r\n]+/g, " ");
const cases = [];
for (const line of read("backend.log").split(/\r?\n/)) {
  const match = line.match(/^[✔✓]\s+(.+?)\s+\([\d.]+ms\)/);
  if (match)
    cases.push({ group: "Backend / PGlite / provider mock", title: match[1], status: "PASS" });
}
function visit(suite, group) {
  for (const spec of suite.specs || []) {
    for (const test of spec.tests || []) {
      const result = test.results.at(-1);
      cases.push({
        group,
        title: spec.title,
        file: `${spec.file}:${spec.line}`,
        status: result?.status === "passed" ? "PASS" : "FAIL",
        error: result?.error?.message?.replace(/\u001b\[[\d;]*m/g, "").slice(0, 650) || "",
      });
    }
  }
  for (const child of suite.suites || []) visit(child, group);
}
for (const [file, group] of [
  ["demo-final-results.json", "Demo E2E (suite existing)"],
  ["live-final-results.json", "Live E2E (Supabase fixture)"],
  ["qa-demo-verified-results.json", "Audit tambahan demo/UI"],
  ["qa-live-verified-results.json", "Audit tambahan live"],
]) {
  const data = JSON.parse(read(file));
  data.suites.forEach((s) => visit(s, group));
}
for (const item of JSON.parse(read("ai-real-results.json")))
  cases.push({
    group: "Gemini asli / data sintetis",
    title: item.name,
    status: item.pass ? "PASS" : "FAIL",
    expected: item.expected,
  });
const totals = {
  total: cases.length,
  pass: cases.filter((c) => c.status === "PASS").length,
  fail: cases.filter((c) => c.status === "FAIL").length,
};
const groups = Object.fromEntries(
  [...new Set(cases.map((c) => c.group))].map((group) => [
    group,
    {
      total: cases.filter((c) => c.group === group).length,
      pass: cases.filter((c) => c.group === group && c.status === "PASS").length,
      fail: cases.filter((c) => c.group === group && c.status === "FAIL").length,
    },
  ]),
);
fs.writeFileSync(
  path.join(root, "case-results.json"),
  JSON.stringify({ totals, groups, cases }, null, 2),
);
const lines = [
  "# Daftar seluruh test case",
  "",
  "Hasil run final per suite, tanpa menghitung ulang retry. Lihat REPORT.md untuk membedakan bug aplikasi dari masalah test harness.",
  "",
  `${totals.total} kasus: ${totals.pass} PASS, ${totals.fail} FAIL. Tidak semua FAIL berarti bug aplikasi.`,
  "",
];
for (const [group, count] of Object.entries(groups)) {
  lines.push(
    `## ${group}`,
    "",
    `${count.pass}/${count.total} lulus.`,
    "",
    "| ID | Kasus dan bukti | Hasil |",
    "| --- | --- | --- |",
  );
  for (const [index, item] of cases.entries())
    if (item.group === group)
      lines.push(
        `| TC-${String(index + 1).padStart(3, "0")} | ${escape(item.title)}${item.file ? ` — ${escape(item.file)}` : ""}${item.expected ? ` — ${escape(item.expected)}` : ""} | ${item.status} |`,
      );
  lines.push("");
}
lines.push("## Pesan kegagalan final", "");
for (const item of cases.filter((c) => c.status === "FAIL"))
  lines.push(`### ${item.title}`, "", "```text", item.error || "Lihat log suite.", "```", "");
fs.writeFileSync(path.join(root, "CASES.md"), lines.join("\n"));
console.log(JSON.stringify({ totals, groups }));
