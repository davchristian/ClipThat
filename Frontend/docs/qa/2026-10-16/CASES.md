# Daftar seluruh test case

Hasil run final per suite, tanpa menghitung ulang retry. Lihat REPORT.md untuk membedakan bug aplikasi dari masalah test harness.

110 kasus: 105 PASS, 5 FAIL. Tidak semua FAIL berarti bug aplikasi.

## Backend / PGlite / provider mock

55/55 lulus.

| ID     | Kasus dan bukti                                                                                    | Hasil |
| ------ | -------------------------------------------------------------------------------------------------- | ----- |
| TC-001 | manual calendar export preserves Jakarta time in UTC, escapes text and excludes drafts/done events | PASS  |
| TC-002 | Supabase configuration accepts project and local URLs and rejects invalid values                   | PASS  |
| TC-003 | invalid Supabase URL yields a safe configuration error instead of an SDK exception                 | PASS  |
| TC-004 | live proxy with invalid Supabase URL allows auth pages and redirects protected pages               | PASS  |
| TC-005 | important class announcements automatically reach only course students without duplicates          | PASS  |
| TC-006 | student cannot create or start a session, or escalate role                                         | PASS  |
| TC-007 | join is idempotent, owner starts session, transcript retry does not duplicate                      | PASS  |
| TC-008 | shared questions contain no author, votes stay unique and private                                  | PASS  |
| TC-009 | private notes and saved copies are hidden from teacher and other students                          | PASS  |
| TC-010 | ending enqueues once, jobs have exclusive leases and class result enqueues private reviews         | PASS  |
| TC-011 | archive hides sources but keeps personal saved copies; restoration reopens class                   | PASS  |
| TC-012 | AI quotas are per-user and cannot be bypassed with arbitrary actions                               | PASS  |
| TC-013 | private photos and archived shared materials obey storage policies                                 | PASS  |
| TC-014 | calendar secrets stay server-only and unconfirmed agenda never leaves the app                      | PASS  |
| TC-015 | Google onboarding chooses a role only once; notification preferences are private                   | PASS  |
| TC-016 | course codes are generated automatically, join idempotently and keep courses isolated              | PASS  |
| TC-017 | continuous speech crosses 15-second rows using word timestamps even before finalization            | PASS  |
| TC-018 | Deepgram requests only a short-lived token with the server key                                     | PASS  |
| TC-019 | Deepgram failures are actionable without exposing provider responses                               | PASS  |
| TC-020 | streaming results distinguish drafts and finals and retain session offsets                         | PASS  |
| TC-021 | calendar credentials reject tampering and another user/provider                                    | PASS  |
| TC-022 | OAuth state binds the callback to its initiating user, provider, nonce and expiry                  | PASS  |
| TC-023 | calendar payload preserves Jakarta deadline as UTC and does not invite attendees                   | PASS  |
| TC-024 | Outlook create retries use stable transaction ID, and updating/deleting use stored event ID        | PASS  |
| TC-025 | Google retries an existing deterministic event without creating a duplicate                        | PASS  |
| TC-026 | new account boot drops previous account's private content and keeps agenda drafts unconfirmed      | PASS  |
| TC-027 | automatic agenda stays saved after personal edits, duplicate announcements and reordered drafts    | PASS  |
| TC-028 | graph merging keeps edges valid and combines explicitly identical subbab titles                    | PASS  |
| TC-029 | confirming one announcement keeps other drafts from the same transcript segment                    | PASS  |
| TC-030 | notes hide source UUID citations while preserving material and formulas                            | PASS  |
| TC-031 | off-topic speech can complete without inventing study notes or changing transcript                 | PASS  |
| TC-032 | relative announcements use the class date in Jakarta even when processing later                    | PASS  |
| TC-033 | class extraction receives date context and accepts schedule-only speech without study notes        | PASS  |
| TC-034 | lesson generation omits nested provider array caps but validates output limits locally             | PASS  |
| TC-035 | transcript timestamps display whole seconds without floating-point overflow                        | PASS  |
| TC-036 | 90 seconds are seconds; clamp early class and include overlapping speech                           | PASS  |
| TC-037 | capture preview signature rejects tampering, other users and expiration                            | PASS  |
| TC-038 | Gemini uses requested 2.5 model and rejects malformed provider JSON                                | PASS  |
| TC-039 | Whisper preserves segment offsets and sends complete multipart file                                | PASS  |
| TC-040 | mutations reject cross-origin requests and oversized/invalid bodies                                | PASS  |
| TC-041 | signup failures distinguish email restrictions, rate limits, and password rules                    | PASS  |
| TC-042 | service and configuration failures do not blame the submitted password                             | PASS  |
| TC-043 | unknown and existing-account failures keep a generic message without provider data                 | PASS  |
| TC-044 | live text extends its 15-second row immediately and starts the next interval                       | PASS  |
| TC-045 | uploaded speech appears once while draft awaits acknowledgement                                    | PASS  |
| TC-046 | Gemini microphone chunks include audio bytes and retain session timestamps                         | PASS  |
| TC-047 | silent audio produces no transcript segments                                                       | PASS  |
| TC-048 | dedicated Transcribe model uses Interactions and measured chunk timestamps                         | PASS  |
| TC-049 | dedicated speech silence is empty and malformed or incomplete responses are rejected               | PASS  |
| TC-050 | dedicated speech maps browser MP4 audio to M4A and preserves provider errors                       | PASS  |
| TC-051 | Gemini rejects invalid timestamps and malformed output before persistence                          | PASS  |
| TC-052 | quota failures stay retryable and do not switch to a paid provider                                 | PASS  |
| TC-053 | Gemini errors distinguish depleted credits, model access, and temporary quotas                     | PASS  |
| TC-054 | provider configuration supports Gemini and explicitly selected Whisper                             | PASS  |
| TC-055 | invalid audio and chunk duration are rejected without contacting Gemini                            | PASS  |

## Demo E2E (suite existing)

23/24 lulus.

| ID     | Kasus dan bukti                                                                                                    | Hasil |
| ------ | ------------------------------------------------------------------------------------------------------------------ | ----- |
| TC-056 | processing notes leave transcript and questions accessible — app.spec.ts:3                                         | PASS  |
| TC-057 | course cards keep their size with one, two or four courses — app.spec.ts:23                                        | PASS  |
| TC-058 | course shows schedule, overall summary, nearest agenda and past class sources — app.spec.ts:59                     | PASS  |
| TC-059 | completed classes retain transcript history and allow private review and lecturer answers — app.spec.ts:130        | PASS  |
| TC-060 | sidebar wheel stays separate and compact role options leave the name visible — app.spec.ts:169                     | PASS  |
| TC-061 | sidebar expands on hover and folds on leave without shifting the page — app.spec.ts:232                            | FAIL  |
| TC-062 | capture previews and discards without saving, then saves only after confirmation — app.spec.ts:277                 | PASS  |
| TC-063 | compact questions support anonymous posting, voting and reload on mobile — app.spec.ts:328                         | PASS  |
| TC-064 | unconfirmed class agenda stays off the calendar after class ends — app.spec.ts:381                                 | PASS  |
| TC-065 | agenda supports date selection, quick creation, edit, completion, export and delete — app.spec.ts:409              | PASS  |
| TC-066 | lecturer marks spoken answers, updates map, ends class, archives, restores and creates a session — app.spec.ts:451 | PASS  |
| TC-067 | main views work without browser errors or horizontal overflow — app.spec.ts:513                                    | PASS  |
| TC-068 | home shows its course and reminder bento without desktop scrolling — app.spec.ts:550                               | PASS  |
| TC-069 | home notification modal tracks handled items without adding a sidebar item — app.spec.ts:589                       | PASS  |
| TC-070 | live heading clock and page padding stay consistent across main views — app.spec.ts:640                            | PASS  |
| TC-071 | photo upload validates timestamp and persists in the saved collection — app.spec.ts:741                            | PASS  |
| TC-072 | personal item in a course opens beside its source lesson — app.spec.ts:764                                         | PASS  |
| TC-073 | a private bookmark remains available when its lesson is archived — app.spec.ts:774                                 | PASS  |
| TC-074 | profile is reachable from the sidebar and demo reset remains available — app.spec.ts:789                           | PASS  |
| TC-075 | login and registration remain readable on phone, tablet and desktop — app.spec.ts:808                              | PASS  |
| TC-076 | graph stays static while topic details work on desktop and phone — app.spec.ts:828                                 | PASS  |
| TC-077 | save current desktop and mobile design previews — app.spec.ts:891                                                  | PASS  |
| TC-078 | focus mode uses native fullscreen and restores the classroom at 1440px — focus-mode.spec.ts:4                      | PASS  |
| TC-079 | focus mode uses native fullscreen and restores the classroom at 390px — focus-mode.spec.ts:4                       | PASS  |

## Live E2E (Supabase fixture)

11/14 lulus.

| ID     | Kasus dan bukti                                                                                                   | Hasil |
| ------ | ----------------------------------------------------------------------------------------------------------------- | ----- |
| TC-080 | live email login uses Supabase and rejects invalid credentials without opening the dashboard — live.spec.ts:18    | PASS  |
| TC-081 | live capture discard makes no save request; confirmation uses the real signed-token save route — live.spec.ts:32  | FAIL  |
| TC-082 | live question and private note persist while calendar integrations are retired — live.spec.ts:82                  | FAIL  |
| TC-083 | profile opens from sidebar and logs out at 1440px as student — live.spec.ts:111                                   | PASS  |
| TC-084 | profile opens from sidebar and logs out at 390px as student — live.spec.ts:111                                    | PASS  |
| TC-085 | profile opens from sidebar and logs out at 390px as lecturer — live.spec.ts:111                                   | PASS  |
| TC-086 | retired calendar endpoints do not exchange tokens and the worker runs only study jobs — live.spec.ts:150          | PASS  |
| TC-087 | live lecturer creates the first course and session; student requests cannot run the worker — live.spec.ts:172     | PASS  |
| TC-088 | course code is generated and students join only from Course at 1440px — live.spec.ts:219                          | PASS  |
| TC-089 | course code is generated and students join only from Course at 390px — live.spec.ts:219                           | PASS  |
| TC-090 | generated class graph links to its transcript and agenda confirmation survives reload — live.spec.ts:249          | FAIL  |
| TC-091 | Deepgram auto-records and ending waits for final transcript and failed-save retry — live.spec.ts:301              | PASS  |
| TC-092 | lecturer recording stays compact and fractional transcript timestamps do not overlap at 1440px — live.spec.ts:382 | PASS  |
| TC-093 | lecturer recording stays compact and fractional transcript timestamps do not overlap at 390px — live.spec.ts:382  | PASS  |

## Audit tambahan demo/UI

9/9 lulus.

| ID     | Kasus dan bukti                                                                                                    | Hasil |
| ------ | ------------------------------------------------------------------------------------------------------------------ | ----- |
| TC-094 | QA inventory and profile course grid: student 390px — qa-audit.spec.ts:8                                           | PASS  |
| TC-095 | QA inventory and profile course grid: student 1440px — qa-audit.spec.ts:8                                          | PASS  |
| TC-096 | QA inventory and profile course grid: lecturer 390px — qa-audit.spec.ts:8                                          | PASS  |
| TC-097 | QA inventory and profile course grid: lecturer 1440px — qa-audit.spec.ts:8                                         | PASS  |
| TC-098 | QA question grows for wrapped text, shrinks on clear and has no anonymous timestamp metadata — qa-audit.spec.ts:92 | PASS  |
| TC-099 | QA auth required fields, email format and password visibility — qa-audit.spec.ts:113                               | PASS  |
| TC-100 | QA invalid session and corrupt demo storage recover without a page crash — qa-audit.spec.ts:131                    | PASS  |
| TC-101 | QA global search filters classes, handles no results, navigates and closes with Escape — qa-audit.spec.ts:141      | PASS  |
| TC-102 | QA diagnose retained route clocks and keyboard sidebar focus — qa-audit.spec.ts:162                                | PASS  |

## Audit tambahan live

2/3 lulus.

| ID     | Kasus dan bukti                                                                                                      | Hasil |
| ------ | -------------------------------------------------------------------------------------------------------------------- | ----- |
| TC-103 | QA live capture persists through the current Notes UI and retains preview on a save error — qa-live-audit.spec.ts:14 | PASS  |
| TC-104 | QA generated agenda draft remains reachable for the student to complete — qa-live-audit.spec.ts:56                   | FAIL  |
| TC-105 | QA private note saves and survives reload with fresh content — qa-live-audit.spec.ts:66                              | PASS  |

## Gemini asli / data sintetis

5/5 lulus.

| ID     | Kasus dan bukti                                                                         | Hasil |
| ------ | --------------------------------------------------------------------------------------- | ----- |
| TC-106 | mixed_material_quiz_offtopic — notes include matrices, exclude holiday; quiz 2026-10-20 | PASS  |
| TC-107 | offtopic_only — notes and graph and agenda empty                                        | PASS  |
| TC-108 | unclear_date — no dated agenda                                                          | PASS  |
| TC-109 | revised_schedule — one quiz on 2026-10-21 at 09:00 Jakarta                              | PASS  |
| TC-110 | historical_hypothetical — no agenda                                                     | PASS  |

## Pesan kegagalan final

### sidebar expands on hover and folds on leave without shifting the page

```text
Error: expect(received).toBe(expected) // Object.is equality

Expected: 216
Received: 76

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
```

### live capture discard makes no save request; confirmation uses the real signed-token save route

```text
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Tersimpan (1)' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('button', { name: 'Tersimpan (1)' }) with timeout 5000ms
  - waiting for getByRole('button', { name: 'Tersimpan (1)' })

```

### live question and private note persist while calendar integrations are retired

```text
Test timeout of 45000ms exceeded.
```

### generated class graph links to its transcript and agenda confirmation survives reload

```text
Error: expect(locator).toBeVisible() failed

Locator: locator('.agenda-draft:visible').filter({ hasText: 'Latihan matriks' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('.agenda-draft:visible').filter({ hasText: 'Latihan matriks' }) with timeout 5000ms
  - waiting for locator('.agenda-draft:visible').filter({ hasText: 'Latihan matriks' })

```

### QA generated agenda draft remains reachable for the student to complete

```text
Error: expect(locator).toBeVisible() failed

Locator: getByText('Latihan matriks', { exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Latihan matriks', { exact: true }) with timeout 5000ms
  - waiting for getByText('Latihan matriks', { exact: true })

```
