import { z } from "zod";
export const uuid = z.string().uuid();
export const secondsSchema = z.number().finite().min(0).max(86400);
const shortText = z.string().trim().min(2).max(160);
export const authInput = z
  .object({
    email: z.email().max(254),
    password: z.string().min(8).max(128),
    name: z.string().trim().min(2).max(60).optional(),
    role: z.enum(["student", "lecturer"]).optional(),
  })
  .strict();
export const courseInput = z
  .object({ name: z.string().trim().min(2).max(120), code: z.string().trim().max(30).default("") })
  .strict();
export const sessionInput = z
  .object({ course_id: uuid, title: shortText, starts_at: z.iso.datetime({ offset: true }) })
  .strict();
export const questionInput = z
  .object({ text: z.string().trim().min(3).max(1000), at_seconds: secondsSchema.default(0) })
  .strict();
export const segmentInput = z
  .object({ start: secondsSchema, end: secondsSchema, text: z.string().trim().min(1).max(10000) })
  .refine((s) => s.end >= s.start);
export const transcriptInput = z
  .object({ chunk_id: uuid, segments: z.array(segmentInput).min(1).max(200) })
  .strict();
export const graphSchema = z
  .object({
    nodes: z
      .array(
        z.object({
          id: z.string().max(60),
          title: shortText,
          description: z.string().max(3000),
          source_ids: z.array(uuid).max(50),
        }),
      )
      .max(40),
    edges: z
      .array(
        z.object({
          from: z.string().max(60),
          to: z.string().max(60),
          relation: z.string().max(160),
        }),
      )
      .max(100),
  })
  .refine(
    (g) =>
      new Set(g.nodes.map((n) => n.id)).size === g.nodes.length &&
      g.edges.every(
        (e) => g.nodes.some((n) => n.id === e.from) && g.nodes.some((n) => n.id === e.to),
      ),
  );
export const noteSchema = z.object({
  title: shortText,
  body: z.string().min(1).max(10000),
  source_ids: z.array(uuid).min(1).max(50),
});
export const agendaDraftSchema = z.object({
  title: shortText,
  kind: z.enum(["Tugas", "Kuis", "Belajar"]),
  due_at: z.string().nullable(),
  source_id: uuid,
  quote: z.string().max(3000),
});
export const lessonResultSchema = z.object({
  notes: z.array(noteSchema).max(40),
  graph: graphSchema,
  agenda: z.array(agendaDraftSchema).max(30),
});
export const reviewSchema = z.object({
  sections: z.array(noteSchema).max(30),
  previous: z.array(z.object({ session_id: uuid, reason: z.string().max(2000) })).max(8),
});
export const captureSchema = z.object({
  summary: z.string().min(1).max(12000),
  question: z.string().min(3).max(1000),
});
export const captureClaimsSchema = z.object({
  id: uuid,
  user_id: uuid,
  session_id: uuid,
  start: secondsSchema,
  end: secondsSchema,
  text: z.string().max(60000),
  summary: z.string().max(12000),
  question: z.string().max(1000),
  exp: z.number(),
});
export type CaptureClaims = z.infer<typeof captureClaimsSchema>;
export const agendaInput = z
  .object({
    title: shortText,
    due_at: z.iso.datetime({ offset: true }),
    kind: z.enum(["Tugas", "Kuis", "Belajar"]),
    confirmed: z.boolean().default(false),
    done: z.boolean().default(false),
    session_id: uuid.nullable().optional(),
    source: z
      .object({ quote: z.string().max(3000), source_id: uuid })
      .nullable()
      .optional(),
  })
  .strict();
