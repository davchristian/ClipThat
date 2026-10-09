"use client";

import { useState } from "react";
import { Check, ChevronUp, Send } from "lucide-react";
import { useApp } from "@/state/app-provider";
import { Empty, Modal } from "@/components/ui";
import { seconds } from "@/lib/format";
import type { Question } from "@/lib/types";

export function QuestionsPanel({ sessionId, teacher }: { sessionId: string; teacher: string }) {
  const { data, update, notify } = useApp();
  const [question, setQuestion] = useState("");
  const [answering, setAnswering] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const lecturer = data.role === "lecturer";
  const questions = data.questions.filter((q) => q.sessionId === sessionId);
  return (
    <section className="list-panel questions-panel">
      {!lecturer && (
        <form
          className="ask-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!question.trim()) return;
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
            required
          />
          <button className="button primary" disabled={!question.trim()}>
            <Send size={16} />
            Kirim
          </button>
        </form>
      )}
      {questions.length ? (
        questions.map((q) => (
          <article key={q.id} className="question-card">
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
                      ? { ...x, votes: x.votes + (x.supported ? -1 : 1), supported: !x.supported }
                      : x,
                  ),
                }))
              }
            >
              <ChevronUp size={17} />
              {q.votes}
            </button>
            <div className="question-body">
              <p>{q.text}</p>
              <small>
                {q.answer || q.oral ? "Terjawab" : "Anonim"} · {q.time}
              </small>
              {q.answer && (
                <div className="answer">
                  <strong>{teacher}</strong>
                  <p>{q.answer}</p>
                </div>
              )}
              {q.oral && !q.answer && (
                <div className="answer">
                  <Check size={14} />
                  Dijawab di kelas
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
                    {q.answer ? "Edit jawaban" : "Jawab"}
                  </button>
                  {!q.answer && !q.oral && (
                    <button
                      className="text-button"
                      onClick={() => {
                        update((d) => ({
                          ...d,
                          questions: d.questions.map((x) =>
                            x.id === q.id ? { ...x, oral: true } : x,
                          ),
                        }));
                        notify("Ditandai terjawab.");
                      }}
                    >
                      Sudah dibahas
                    </button>
                  )}
                </div>
              )}
            </div>
          </article>
        ))
      ) : (
        <Empty title="Belum ada pertanyaan" />
      )}
      <Modal open={!!answering} title="Jawab pertanyaan" onClose={() => setAnswering(null)}>
        <p className="capture-excerpt">{answering?.text}</p>
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            if (!answer.trim()) return;
            update((d) => ({
              ...d,
              questions: d.questions.map((q) =>
                q.id === answering?.id ? { ...q, answer: answer.trim() } : q,
              ),
            }));
            setAnswering(null);
            notify("Jawaban tersimpan.");
          }}
        >
          <label>
            Jawabanmu
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              maxLength={3000}
              required
              autoFocus
            />
          </label>
          <button className="button primary" disabled={!answer.trim()}>
            Simpan jawaban
          </button>
        </form>
      </Modal>
    </section>
  );
}
