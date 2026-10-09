# Arsip

Eksperimen desain lama dipindahkan ke sini agar terpisah dari frontend aktif.

| Folder | Isi |
| --- | --- |
| `figma/wireframe/` | Wireframe dan generator Figma awal |
| `figma/uiux/` | Desain, preview, dan generator plugin lama |
| `figma/uiux/plugin/` | Paket development plugin: manifest, code, UI |
| `figma/uiux/packages/` | ZIP plugin yang pernah dikemas |
| `figma/uiux/previews/` | Screenshot desain lama |
| `figma/uiux/reports/` | Laporan validasi dan metadata Figma lama |

Frontend yang dipakai sekarang ada di [Frontend](../Frontend/README.md). Generator lama tetap dapat dibaca/dijalankan dari direktori masing-masing; tidak digunakan oleh Next.js.

`empty-root-package-lock.json` adalah lockfile kosong yang sebelumnya berada di root. Dependency aplikasi dikelola hanya melalui `Frontend/package.json` dan `Frontend/package-lock.json`.
