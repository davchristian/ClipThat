import { ApiError } from "./http";

export function signupError(error: { code?: string; status?: number }): ApiError {
  switch (error.code) {
    case "email_address_not_authorized":
      return new ApiError(
        503,
        "signup_email_not_authorized",
        "Supabase belum bisa mengirim email konfirmasi ke alamat ini. Gunakan email anggota organisasi Supabase atau atur SMTP proyek terlebih dahulu.",
      );
    case "over_email_send_rate_limit":
      return new ApiError(
        429,
        "signup_email_rate_limit",
        "Batas pengiriman email konfirmasi tercapai. Tunggu sebelum mencoba lagi.",
      );
    case "over_request_rate_limit":
      return new ApiError(
        429,
        "signup_rate_limit",
        "Terlalu banyak percobaan pendaftaran. Tunggu beberapa menit lalu coba lagi.",
      );
    case "signup_disabled":
    case "email_provider_disabled":
      return new ApiError(
        503,
        "signup_disabled",
        "Pendaftaran email belum diaktifkan pada proyek Supabase.",
      );
    case "weak_password":
      return new ApiError(
        422,
        "signup_weak_password",
        "Kata sandi belum memenuhi aturan keamanan proyek. Gunakan kata sandi yang lebih kuat.",
      );
    case "email_address_invalid":
      return new ApiError(
        422,
        "signup_invalid_email",
        "Gunakan alamat email aktif. Domain contoh atau pengujian tidak didukung oleh Supabase.",
      );
    case "captcha_failed":
      return new ApiError(
        503,
        "signup_captcha_failed",
        "Proyek Supabase meminta verifikasi CAPTCHA. Integrasi CAPTCHA perlu disiapkan sebelum pendaftaran dapat digunakan.",
      );
  }
  if (error.status === 401 || error.status === 403)
    return new ApiError(
      503,
      "signup_configuration",
      "Layanan akun belum terhubung dengan benar. Periksa Project URL dan publishable key Supabase.",
    );
  if (error.status && error.status >= 500)
    return new ApiError(
      503,
      "signup_service_error",
      "Layanan akun gagal memproses pendaftaran. Periksa Auth logs Supabase, termasuk trigger dan migrasi database.",
    );
  return new ApiError(
    400,
    "signup_failed",
    "Akun belum dapat dibuat. Periksa email dan kata sandi, atau coba masuk jika sudah pernah mendaftar.",
  );
}
