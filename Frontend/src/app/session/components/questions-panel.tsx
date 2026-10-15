"use client";
import { useEffect, useState } from "react";
import { Check, MessageCircle, Send, ThumbsUp, UserRound } from "lucide-react";
import { useApp } from "@/state/app-provider";
import { Modal } from "@/components/ui";
import { seconds } from "@/lib/format";
import type { Question } from "@/lib/types";
export function QuestionsPanel({ sessionId, draft = "" }: { sessionId: string; draft?: string }) {
  const { data, update, notify, pending } = useApp();
  const [question, setQuestion] = useState(draft);
  const [answering, setAnswering] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  useEffect(() => {
    if (draft) setQuestion(draft);
  }, [draft]);
  const lecturer = data.role === "lecturer";
  const questions = data.questions
    .filter((q) => q.sessionId === sessionId)
    .sort(
      (a, b) =>
        Number(Boolean(a.oral || a.answer)) - Number(Boolean(b.oral || b.answer)) ||
        b.votes - a.votes,
    );
  return (
    <section className="questions-panel" aria-label="Pertanyaan kelas">
      {!lecturer && (
        <form
          className="ask-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const text = question.trim();
            if (!text || pending) return;
            const time = data.transcripts?.[sessionId]?.at(-1)?.time ?? 1110;
            const ok = await update((d) => ({
              ...d,
              questions: [
                ...d.questions,
                {
                  id: crypto.randomUUID(),
                  sessionId,
                  text,
                  time: seconds(time),
                  votes: 0,
                  supported: false,
                },
              ],
            }));
            if (ok) {
              setQuestion("");
              notify("Pertanyaan terkirim.");
            }
          }}
        >
          <textarea
            aria-label="Pertanyaan anonim"
            placeholder="Tanya tanpa nama…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={1000}
            minLength={3}
            rows={2}
            required
          />
          <div className="ask-form-footer">
            <span>
              <UserRound size={14} /> Anonim
            </span>
            <button
              className="button primary small"
              disabled={pending || question.trim().length < 3}
            >
              <Send size={15} /> Kirim
            </button>
          </div>
        </form>
      )}
      <div className="question-list-heading">
        <h2>{lecturer ? "Pertanyaan dari murid" : "Pertanyaan kelas"}</h2>
        <span>{questions.length} pertanyaan</span>
      </div>
      {questions.length ? (
        <div className="question-list">
          {questions.map((q) => (
            <article key={q.id} className="question-card">
              <button
                className={`vote-button ${q.supported ? "supported" : ""}`}
                aria-label={`${q.supported ? "Batalkan dukungan: " : "Dukung pertanyaan: "}${q.text}`}
                aria-pressed={q.supported}
                disabled={lecturer || pending}
                onClick={() =>
                  void update((d) => ({
                    ...d,
                    questions: d.questions.map((x) =>
                      x.id === q.id
                        ? { ...x, votes: x.votes + (x.supported ? -1 : 1), supported: !x.supported }
                        : x,
                    ),
                  }))
                }
              >
                <ThumbsUp size={16} />
                {q.votes}
              </button>
              <div className="question-body">
                <p>{q.text}</p>
                <small>
                  {q.oral ? "Dijawab di kelas" : q.answer ? "Dijawab dosen" : "Anonim"} · {q.time}
                </small>
                {q.answer && (
                  <div className="answer">
                    <strong>Jawaban dosen</strong>
                    <p>{q.answer}</p>
                  </div>
                )}
                {lecturer && (
                  <div className="question-actions">
                    <button
                      className="text-button"
                      onClick={() => {
                        setAnswering(q);
                        setAnswer(q.answer || "");
                      }}
                    >
                      <MessageCircle size={14} />
                      {q.answer ? "Edit jawaban" : "Jawab"}
                    </button>
                    <button
                      className="text-button"
                      aria-pressed={Boolean(q.oral)}
                      disabled={pending}
                      onClick={async () => {
                        if (
                          await update((d) => ({
                            ...d,
                            questions: d.questions.map((x) =>
                              x.id === q.id ? { ...x, oral: !x.oral } : x,
                            ),
                          }))
                        )
                          notify(
                            q.oral
                              ? "Tanda jawaban dibatalkan."
                              : "Ditandai sudah dijawab di kelas.",
                          );
                      }}
                    >
                      <Check size={14} />
                      {q.oral ? "Batalkan tanda" : "Tandai sudah dijawab"}
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="questions-empty">Belum ada pertanyaan.</p>
      )}
      <Modal open={!!answering} title="Jawab pertanyaan" onClose={() => setAnswering(null)}>
        <form
          className="form-stack"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!answering) return;
            if (
              await update((d) => ({
                ...d,
                questions: d.questions.map((q) =>
                  q.id === answering.id ? { ...q, answer: answer.trim() } : q,
                ),
              }))
            ) {
              setAnswering(null);
              notify("Jawaban tersimpan.");
            }
          }}
        >
          <p>{answering?.text}</p>
          <label>
            Jawaban dosen
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              maxLength={5000}
              required
              rows={5}
            />
          </label>
          <button className="button primary" disabled={pending || !answer.trim()}>
            Simpan jawaban
          </button>
        </form>
      </Modal>
    </section>
  );
}
