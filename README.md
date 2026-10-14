# ClipThat

Web app untuk mengikuti kelas, menyimpan pembahasan, dan mengulang materi.

```powershell
cd Frontend
npm.cmd install
npm.cmd run dev
```

Buka alamat **Local** di terminal, biasanya http://localhost:3000. Kode kelas contoh: **ALG05**.

| Folder | Kegunaan |
| --- | --- |
| [Frontend](Frontend/README.md) | Aplikasi Next.js + TypeScript + Tailwind CSS yang aktif |
| `docs/` | PRD dan functional requirements |
| [archive](archive/README.md) | Wireframe, eksperimen Figma, plugin, dan hasil validasi lama |

Dependency aplikasi hanya dikelola di `Frontend/`. Default mode demo tetap menyimpan data di browser.

Backend Next.js/TypeScript, migration Supabase, adapter Gemini 2.5, Whisper opsional, dan konfigurasi Cloudflare tersedia. Untuk mengaktifkan akun/data asli, ikuti [panduan setup backend](Frontend/docs/backend-setup.md). Referensi endpoint ada di [API backend](Frontend/docs/backend-api.md). Sinkronisasi kalender belum diimplementasikan.
