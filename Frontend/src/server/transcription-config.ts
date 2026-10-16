import { setting } from "./config";
import { ApiError } from "./http";

// Keep configuration checks independent of audio and AI implementation modules.
export function transcriptionProvider(): "gemini" | "whisper" | "deepgram" {
  const provider =
    setting("TRANSCRIPTION_PROVIDER") || (setting("GEMINI_API_KEY") ? "gemini" : "whisper");
  if (provider !== "gemini" && provider !== "whisper" && provider !== "deepgram")
    throw new ApiError(
      503,
      "invalid_provider",
      "TRANSCRIPTION_PROVIDER harus gemini, whisper, atau deepgram.",
    );
  return provider;
}

export function transcriptionConfigured() {
  const provider = transcriptionProvider();
  return !!setting(
    provider === "deepgram"
      ? "DEEPGRAM_API_KEY"
      : provider === "gemini"
        ? "GEMINI_API_KEY"
        : "OPENAI_API_KEY",
  );
}
