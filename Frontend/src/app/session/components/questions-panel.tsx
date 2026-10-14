"use client";

import { useState } from "react";
import { Check, Send, ThumbsUp, UserRound } from "lucide-react";
import { useApp } from "@/state/app-provider";
import { seconds } from "@/lib/format";

export function QuestionsPanel({ sessionId }: { sessionId: string }) {
  const { data, update, notify } = useApp();
  const [question, setQuestion] = useState("");
  const lecturer = data.role === "lecturer";
  const live = data.lessons.some((lesson) => lesson.id === sessionId && lesson.status === "live");
  const questions = data.questions
    .filter((q) => q.sessionId === sessionId)
    .sort((a, b) => Number(Boolean(a.oral)) - Number(Boolean(b.oral)) || b.votes - a.votes);
  return (
    <section className="questions-panel" aria-label="Pertanyaan kelas">
      {!lecturer && live && (
        <form
          className="ask-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!live || !question.trim()) return;
            update((d) => ({
              ...d,
              questions: [
                ...d.questions,
                {
                  id: crypto.randomUUID(),
                  sessionId,
                  text: question.trim(),
                  time: seconds(1110),
                  votes: 0,
                  supported: false,
                },
              ],
            }));
            setQuestion("");
            notify("Pertanyaan terkirim.");
          }}
        >
          <textarea
            aria-label="Pertanyaan anonim"
            placeholder="Tanya tanpa nama…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={1000}
            rows={2}
            required
          />
          <div className="ask-form-footer">
            <span>
              <UserRound size={14} aria-hidden="true" /> Anonim
            </span>
            <button className="button primary small" disabled={!question.trim()}>
              <Send size={15} aria-hidden="true" />
              Kirim
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
              {!live ? (
                <div
                  className="question-vote-history"
                  aria-label={`${q.votes} dukungan saat kelas`}
                >
                  <strong>{q.votes}</strong>
                  <small>dukungan</small>
                </div>
              ) : (
                <button
                  className={`vote-button ${q.supported ? "supported" : ""}`}
                  aria-label={`${q.supported ? "Batalkan dukungan: " : "Dukung pertanyaan: "}${q.text}`}
                  aria-pressed={q.supported}
                  disabled={lecturer}
                  onClick={() =>
                    update((d) => ({
                      ...d,
                      questions: d.questions.map((x) =>
                        x.id === q.id
                          ? {
                              ...x,
                              votes: x.votes + (x.supported ? -1 : 1),
                              supported: !x.supported,
                            }
                          : x,
                      ),
                    }))
                  }
                >
                  <ThumbsUp size={16} aria-hidden="true" />
                  {q.votes}
                </button>
              )}
              <div className="question-body">
                <p>{q.text}</p>
                <small>
                  {q.oral ? "Dijawab di kelas" : "Anonim"} · {q.time}
                </small>
                {lecturer && live && (
                  <div className="question-actions">
                    <button
                      className="text-button"
                      aria-pressed={Boolean(q.oral)}
                      onClick={() => {
                        update((d) => ({
                          ...d,
                          questions: d.questions.map((item) =>
                            item.id === q.id ? { ...item, oral: !item.oral } : item,
                          ),
                        }));
                        notify(
                          q.oral ? "Tanda jawaban dibatalkan." : "Ditandai sudah dijawab di kelas.",
                        );
                      }}
                    >
                      <Check size={14} aria-hidden="true" />
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
    </section>
  );
}
