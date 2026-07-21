# CLAUDE.md — Sistem Waka Kurikulum SMK (Google Apps Script)

> File ini adalah konteks proyek untuk AI coding agent. Baca seluruh isi file ini
> sebelum menulis kode apa pun. Ikuti arsitektur, konvensi, dan urutan fase yang
> didefinisikan di sini. Jangan membangun fase berikutnya sebelum fase sebelumnya
> selesai dan berfungsi.

## 1. Konteks Proyek

Aplikasi ini dibangun untuk membantu **Waka Kurikulum** di sebuah **SMK** (Sekolah
Menengah Kejuruan) di Indonesia mengelola pekerjaan operasional kurikulum
sepanjang tahun ajaran — mulai dari input jurnal mengajar harian guru, tracking
kelengkapan perangkat ajar, monitoring PKL (Praktik Kerja Lapangan), supervisi
KBM, sampai dashboard analisis dan laporan akhir semester.

Pengguna akhir **bukan** orang teknis. Guru rata-rata awam teknologi, sehingga
UI harus sesederhana mungkin dan bisa diisi dari HP dalam waktu singkat.

## 2. Batasan & Asumsi Lingkungan (PENTING)

- **Tidak ada Google Workspace for Education.** Semua guru menggunakan akun
  Gmail pribadi masing-masing. **Jangan** mengasumsikan domain email sekolah
  untuk otorisasi.
- Otentikasi/otorisasi dilakukan dengan **whitelist manual**: setiap user
  (guru/Waka/Kepsek) didaftarkan di sheet `Master_Guru` beserta email Gmail
  pribadi mereka dan peran (`role`) masing-masing. Saat Web App diakses,
  sistem mengambil email aktif via `Session.getActiveUser().getEmail()`,
  mencocokkan ke `Master_Guru`, baru menentukan akses & tampilan.
- Skala sekolah: **< 30 guru**. Desain tidak perlu dioptimalkan untuk ribuan
  baris data — prioritaskan kesederhanaan kode di atas optimasi prematur.
- Web App di-deploy dengan akses **"Anyone with Google account"**, eksekusi
  **"Execute as: User accessing the web app"** agar `Session.getActiveUser()`
  bisa terbaca (bukan "Execute as: Me").
- Tidak ada budget untuk layanan berbayar di luar Google Workspace/Apps Script
  bawaan. Hindari dependency eksternal berbayar. Google Sheets adalah database
  utama — tidak menggunakan database eksternal (Firebase, dsb) kecuali diminta
  eksplisit di kemudian hari.
- Tahun ajaran di Indonesia: Juli–Juni, terbagi 2 semester (Ganjil & Genap).

## 3. Tech Stack

- **Google Apps Script (V8 runtime)** sebagai backend & business logic.
- **Google Sheets** sebagai database (satu Spreadsheet, banyak sheet/tab).
- **HtmlService** untuk UI Web App (bukan Google Form) — karena kita butuh
  role-based view, validasi custom, dan dashboard interaktif. Gunakan HTML +
  CSS sederhana + `google.script.run` untuk komunikasi client-server.
  - Gunakan template HTML terpisah per halaman (`<?!= include('namafile') ?>`
    pattern), jangan satu file HTML raksasa.
- **Google Charts** (bawaan, gratis) untuk grafik di dashboard. Looker Studio
  bisa jadi opsi lanjutan (dijelaskan di Fase 2), tapi dashboard utama tetap
  harus bisa diakses dari dalam Web App itu sendiri.
- Development lokal disarankan pakai **`clasp`** (Google's CLI) agar kode bisa
  dikelola sebagai file terpisah dan di-push ke Apps Script project. Struktur
  folder di bawah mengasumsikan penggunaan `clasp`.
- **Tidak** menggunakan npm package pihak ketiga di dalam Apps Script runtime
  (Apps Script tidak mendukung Node modules secara native).

## 4. Struktur Folder Proyek

```
/
├── CLAUDE.md
├── appsscript.json           # manifest (timezone: Asia/Jakarta, webapp config)
├── src/
│   ├── Code.js               # entry point (doGet, include helper)
│   ├── Config.js             # konstanta: nama sheet, ID spreadsheet, dsb
│   ├── Auth.js                # cek email vs Master_Guru, ambil role
│   ├── modules/
│   │   ├── MasterData.js
│   │   ├── EJurnal.js
│   │   ├── PerangkatAjar.js
│   │   ├── Dashboard.js
│   │   ├── PKL.js             # fase lanjut
│   │   ├── Supervisi.js       # fase lanjut
│   │   └── LaporanAkhir.js    # fase lanjut
│   ├── triggers/
│   │   └── Reminders.js       # time-driven triggers (pengingat isi jurnal)
│   └── utils/
│       └── Helpers.js         # format tanggal, validasi, dsb
├── html/
│   ├── Index.html             # shell utama (router sisi client sederhana)
│   ├── Login_NotAuthorized.html
│   ├── EJurnal_Form.html
│   ├── Dashboard_View.html
│   └── partials/
│       ├── Header.html
│       └── Footer.html
└── docs/
    └── skema-sheet.md         # dokumentasi skema tiap sheet (auto-update jika berubah)
```

## 5. Skema Data (Google Sheets)

Semua sheet berada dalam **satu Spreadsheet** ("DB_WakaKurikulum"). Baris 1 =
header. Jangan mengubah urutan kolom yang sudah ada di sheet existing —
selalu tambah kolom baru di ujung kanan.

### Sheet: `Master_Guru`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id_guru | string | contoh: G001 |
| nama | string | |
| email | string | Gmail pribadi, dipakai untuk cek login |
| role | enum | `guru` \| `waka` \| `kepsek` |
| mapel_diampu | string | dipisah koma jika lebih dari satu |
| status_aktif | boolean | |

### Sheet: `Master_Kelas`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id_kelas | string | contoh: X-TKJ-1 |
| tingkat | enum | X, XI, XII |
| jurusan | string | contoh: TKJ, RPL, dst — **diisi manual oleh user, jangan di-hardcode** |
| wali_kelas | string | id_guru |

### Sheet: `Master_Jadwal`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id_jadwal | string | |
| id_guru | string | |
| id_kelas | string | |
| mapel | string | |
| hari | enum | Senin..Sabtu |
| jam_ke | number | |
| tahun_ajaran | string | contoh: 2026/2027 |
| semester | enum | Ganjil, Genap |

### Sheet: `Master_ATP` (Alur Tujuan Pembelajaran — dipakai untuk hitung % ketercapaian materi)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id_atp | string | |
| mapel | string | |
| kelas_tingkat | enum | X, XI, XII |
| urutan | number | urutan materi dalam satu semester |
| deskripsi_materi | string | |

### Sheet: `E_Jurnal` (transaksional, tumbuh setiap hari)
| Kolom | Tipe | Keterangan |
|---|---|---|
| timestamp | datetime | auto saat submit |
| tanggal | date | |
| id_guru | string | |
| id_kelas | string | |
| mapel | string | |
| jam_ke | number | |
| id_atp | string | referensi materi dari Master_ATP (nullable jika free text) |
| materi_bebas | string | jika guru isi materi di luar ATP |
| jumlah_hadir | number | |
| jumlah_sakit | number | |
| jumlah_izin | number | |
| jumlah_alpa | number | |
| catatan_kendala | string | |

### Sheet: `Perangkat_Ajar` (Fase 3)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id_guru | string | |
| mapel | string | |
| jenis_dokumen | enum | ATP, Modul Ajar, Prota, Prosem |
| status | enum | Belum Kumpul, Sudah Kumpul, Terverifikasi |
| link_dokumen | string (URL) | |
| tanggal_update | date | |

### Sheet lain (PKL, Supervisi, Laporan) — didefinisikan saat masuk fase masing-masing, jangan dibuat prematur.

## 6. Alur Otorisasi (Auth.js)

```
1. User buka Web App URL.
2. doGet() panggil Auth.getCurrentUser()
3. getCurrentUser(): ambil email via Session.getActiveUser().getEmail()
4. Cari email di Master_Guru.
   - Tidak ketemu / status_aktif = false → render Login_NotAuthorized.html
     dengan pesan jelas + kontak Waka Kurikulum untuk didaftarkan.
   - Ketemu → simpan {id_guru, nama, role} ke session/cache, render Index.html
     sesuai role.
5. Setiap fungsi server-side yang dipanggil dari client HARUS re-validasi role
   di sisi server (jangan percaya role dari client). Gunakan pola:
   requireRole(['waka','kepsek']) di awal fungsi sensitif.
```

## 7. Roadmap Fase Pembangunan

**Kerjakan berurutan. Setiap fase harus punya kriteria "selesai" yang jelas
sebelum lanjut ke fase berikutnya — jangan mencampur pengerjaan antar fase.**

### Fase 0 — Fondasi (WAJIB PERTAMA)
- Setup Spreadsheet + semua sheet Master (`Master_Guru`, `Master_Kelas`,
  `Master_Jadwal`, `Master_ATP`) lengkap dengan header dan contoh 2-3 baris
  dummy data untuk testing.
- Implementasi `Auth.js` end-to-end (login by email whitelist).
- Halaman shell `Index.html` yang menampilkan nama user & role setelah login.
- **Kriteria selesai:** user dengan email terdaftar bisa login dan lihat
  nama+role-nya; user tidak terdaftar melihat halaman "not authorized" yang
  informatif.

### Fase 1 — E-Jurnal Harian
- Form input jurnal (`EJurnal_Form.html`) khusus role `guru`:
  - Dropdown kelas & mapel di-filter otomatis dari `Master_Jadwal` sesuai
    guru yang login dan hari ini (jangan tampilkan semua kelas).
  - Pilihan materi dari `Master_ATP` (dengan opsi "materi di luar ATP").
  - Input jumlah hadir/sakit/izin/alpa (angka, bukan per-nama siswa dulu —
    itu penyederhanaan sengaja untuk MVP).
  - Validasi: cegah submit ganda untuk kombinasi tanggal+kelas+jam_ke+guru
    yang sama (update existing row, bukan duplikat).
- Trigger time-driven harian (jam 16:00 WIB) yang mengecek guru dengan
  jadwal hari itu tapi belum mengisi jurnal → kirim email pengingat otomatis
  (`MailApp.sendEmail`).
- **Kriteria selesai:** guru bisa submit jurnal dari HP dalam < 5 langkah;
  data masuk ke sheet `E_Jurnal` dengan benar; reminder email terkirim untuk
  guru yang belum isi.

### Fase 2 — Dashboard Analisis
- View berbeda per role:
  - `guru`: rekap kelengkapan jurnal miliknya sendiri (persen per minggu).
  - `waka`/`kepsek`: rekap semua guru — % kelengkapan pengisian, %
    ketercapaian materi per mapel (hitung dari jumlah id_atp unik yang sudah
    diajarkan dibagi total ATP mapel tsb), daftar guru dengan kepatuhan
    rendah (< 80% dalam 7 hari terakhir).
- Gunakan Google Charts (bar chart, pie chart) di dalam HtmlService.
- **Kriteria selesai:** Waka Kurikulum bisa melihat, dalam satu layar, guru
  mana yang perlu ditindaklanjuti minggu ini.

### Fase 3 — Perangkat Ajar
- Tracking status kumpul ATP/Modul Ajar/Prota/Prosem per guru per mapel.
- Waka bisa update status verifikasi; guru bisa lihat status miliknya +
  upload link dokumen (Google Drive link, bukan file upload langsung).
- **Kriteria selesai:** Waka bisa melihat rekap "siapa yang belum kumpul apa"
  dalam satu tabel/dashboard.

### Fase 4 — PKL (Praktik Kerja Lapangan)
- Skema data ditentukan saat mulai fase ini (data DU/DI, penempatan siswa,
  pembimbing, jadwal monitoring, nilai PKL). Diskusikan skema sebelum coding.

### Fase 5 — Supervisi KBM & Laporan Akhir Semester
- Skema data ditentukan saat mulai fase ini. Laporan akhir sebaiknya bisa
  di-export ke Google Docs/PDF otomatis (pakai `DocumentApp` +
  `DriveApp.createFile` atau konversi PDF).

## 8. Konvensi Kode

- Bahasa nama variabel/fungsi: **Inggris** untuk kode, **Indonesia** untuk
  label UI, nama sheet, dan nama kolom (karena user akhir & Waka Kurikulum
  akan membuka Sheet-nya langsung).
- Semua fungsi yang dipanggil dari client (`google.script.run`) diberi prefix
  jelas, misal `api_getJurnalHariIni()`, agar mudah dibedakan dari fungsi
  internal.
- Selalu bungkus operasi Sheet dengan `try/catch` dan kembalikan objek
  `{success: boolean, data/message}` ke client — jangan biarkan error mentah
  Apps Script tampil ke user awam.
- Gunakan `PropertiesService` untuk konfigurasi yang bisa berubah (misal ID
  spreadsheet, jam kirim reminder), jangan hardcode di banyak tempat — taruh
  semua di `Config.js`.
- Tulis komentar dalam Bahasa Indonesia untuk logic bisnis yang spesifik
  konteks pendidikan (misal kenapa suatu perhitungan % ketercapaian dihitung
  begitu), supaya mudah di-maintain non-programmer di kemudian hari.

## 9. Placeholder yang Perlu Diisi User Sebelum/Selama Development

- [ ] Nama sekolah (untuk header dashboard & email notifikasi)
- [ ] Daftar jurusan/kompetensi keahlian + jumlah rombel per tingkat
- [ ] Tahun ajaran aktif saat ini (contoh: 2026/2027) dan semester berjalan
- [ ] Daftar awal guru (nama, email Gmail pribadi, mapel diampu) untuk isi
      `Master_Guru`
- [ ] Jam pengiriman reminder harian yang diinginkan (default usulan: 16:00 WIB)

## 10. Non-Goals (Sengaja Tidak Dikerjakan di Awal)

- Tidak membangun native mobile app — cukup Web App responsif.
- Tidak membangun sistem notifikasi WhatsApp (butuh API pihak ketiga
  berbayar) — cukup email di tahap awal, bisa dipertimbangkan lagi nanti.
- Tidak melakukan absensi siswa per-nama individual di Fase 1 — cukup
  agregat jumlah (hadir/sakit/izin/alpa) demi kecepatan input guru.
- Tidak membangun sistem role-permission granular berlapis — cukup 3 role
  (`guru`, `waka`, `kepsek`) di awal.
