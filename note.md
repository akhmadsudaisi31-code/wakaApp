# Note Perubahan — wakaAPP (Migrasi UI ke Netlify/Vercel)

**Tanggal:** 20 Juli 2026  
**Dikerjakan oleh:** Antigravity AI  
**Alasan perubahan:** Kamera absensi tidak berfungsi di GAS HtmlService karena browser memblokir `getUserMedia()` dari dalam iframe `script.google.com`.

---

## Akar Masalah

Google Apps Script (GAS) HtmlService merender halaman web di dalam sebuah `<iframe>` dengan origin `script.google.com`. Browser modern memblokir akses kamera (`navigator.mediaDevices.getUserMedia`) dari iframe ini karena alasan keamanan.

---

## Solusi: Migrasi Arsitektur (GRATIS, Tanpa Google Cloud Console)

### Strategi Auth — Tanpa OAuth Client ID

Alih-alih menggunakan Google Identity Services (yang butuh Google Cloud Console), kita menggunakan **GAS sebagai pintu login native**:

```
1. User klik "Masuk dengan Google" di Netlify
2. Browser redirect ke GAS Web App URL
3. GAS baca email via Session.getActiveUser() ← Google handle auth-nya sendiri
4. GAS cek email di Master_Guru → jika authorized:
5. GAS buat UUID token → simpan di PropertiesService (valid 8 jam)
6. GAS redirect balik ke: {NETLIFY_URL}?token=xxx&name=yyy&role=zzz
7. Frontend simpan token di sessionStorage, bersihkan URL
8. Setiap API call kirim token → GAS validasi → jalankan fungsi
```

**Mengapa ini gratis & tidak butuh Google Cloud Console?**
- `Session.getActiveUser()` adalah fitur bawaan GAS — tidak perlu setup apapun
- PropertiesService adalah storage bawaan GAS — gratis
- `Utilities.getUuid()` adalah fungsi bawaan GAS — gratis
- Netlify/Vercel/Cloudflare Pages = gratis untuk static site

### Arsitektur Lama (v1.0)
```
Browser → GAS Web App (HtmlService iframe)  ← kamera diblokir!
          ↕ google.script.run
          GAS Backend (Sheets, Drive)
```

### Arsitektur Baru (v2.0)
```
Browser → Frontend (Netlify) ← kamera berfungsi! ✅
          ↕ fetch POST (JSON body, no CORS preflight)
          GAS Backend (doPost API Router)
          ↕
          Google Sheets + Google Drive + PropertiesService
```

---

## File Baru: `/home/naya/Documents/DevApp/wakaAPP-frontend/`

Folder baru ini berisi seluruh frontend yang dipindahkan:

| File | Keterangan |
|------|-----------|
| `index.html` | Shell utama SPA, routing client-side |
| `css/style.css` | Design system lengkap (variabel CSS, komponen, responsive) |
| `js/config.js` | ⚠️ Konfigurasi (GAS_URL & GOOGLE_CLIENT_ID wajib diisi) |
| `js/api.js` | API client — wrapper fetch ke GAS backend |
| `js/app.js` | Routing, state, login flow, toast notification |
| `js/pages/absen.js` | **Halaman Absensi** — kamera berfungsi di domain HTTPS valid |
| `js/pages/dashboard.js` | Dashboard dengan stat cards & tabel kepatuhan |
| `js/pages/ejurnal.js` | Form E-Jurnal harian |
| `js/pages/jadwal.js` | Halaman jadwal mengajar |
| `js/pages/perangkat.js` | Perangkat Ajar dengan upload link & verifikasi |
| `netlify.toml` | Config Netlify (headers keamanan, izin kamera) |

---

## File Dimodifikasi: `/home/naya/Documents/DevApp/wakaAPP/src/`

### `src/Code.js`
- **`doGet()`**: Diubah — sekarang hanya menampilkan halaman info bahwa UI sudah dipindah.
- **`doPost()`**: **BARU** — router API utama. Menerima `{action, token, payload}`, memverifikasi token, lalu memanggil fungsi yang sesuai.
- **`_api_getJadwal()`**: **BARU** — endpoint jadwal yang sebelumnya tidak ada sebagai endpoint terpisah.
- **`_jsonResponse()`**: **BARU** — helper untuk membungkus response sebagai JSON.
- **`GAS_CURRENT_USER`**: **BARU** — variabel global untuk menyimpan user yang terverifikasi selama satu request.

### `src/Auth.js`
- **`verifyAndGetUser(idToken)`**: **BARU** — memverifikasi Google ID Token via `https://oauth2.googleapis.com/tokeninfo`, lalu mencari email di `Master_Guru`.
- **`_findUserByEmail(email)`**: **BARU** — helper internal yang merestrukturisasi logika pencarian user, digunakan oleh kedua fungsi verifikasi.
- **`requireRole()`**: **DIMODIFIKASI** — sekarang mengutamakan `GAS_CURRENT_USER` (token-based) sebelum fallback ke `Session.getActiveUser()`.
- **`getCurrentUser()`**: Dipertahankan untuk kompatibilitas backward.

---

## Cara Deploy

### 1. Persiapan Google Cloud (sekali saja)

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau gunakan yang ada
3. Aktifkan **Google Identity API**
4. Buat **OAuth 2.0 Client ID** (tipe: Web Application)
5. Di "Authorized JavaScript origins", tambahkan URL Netlify Anda (contoh: `https://waka-smk.netlify.app`)
6. Salin **Client ID** — formatnya: `123456789-abc.apps.googleusercontent.com`

### 2. Setup GAS Backend

1. Buka Apps Script project di Google Apps Script editor
2. Push perubahan via clasp:
   ```bash
   cd /home/naya/Documents/DevApp/wakaAPP
   clasp push
   ```
3. **Deploy ulang** sebagai Web App dengan pengaturan:
   - **Execute as**: `Me (owner)`
   - **Who has access**: `Anyone` ← PENTING (bukan "Anyone with Google account")
4. Salin **Deployment URL** (akan berakhiran `/exec`)

### 3. Konfigurasi Frontend

Edit file `js/config.js`:
```javascript
const CONFIG = {
  GAS_URL: "https://script.google.com/macros/s/DEPLOYMENT_ID_ANDA/exec",
  GOOGLE_CLIENT_ID: "CLIENT_ID_ANDA.apps.googleusercontent.com",
  NAMA_SEKOLAH: "Nama SMK Anda",
};
```

Edit `index.html`, temukan dan ganti:
```html
data-client_id="__GOOGLE_CLIENT_ID__"
```
dengan:
```html
data-client_id="CLIENT_ID_ANDA.apps.googleusercontent.com"
```

### 4. Deploy ke Netlify

**Cara A: Drag & Drop (Paling Mudah)**
1. Buka [netlify.com/drop](https://app.netlify.com/drop)
2. Drag folder `wakaAPP-frontend` ke halaman tersebut
3. Selesai! Anda mendapat URL otomatis.
4. Tambahkan URL tersebut ke Authorized JavaScript Origins di Google Cloud Console.

**Cara B: via Git**
```bash
cd /home/naya/Documents/DevApp/wakaAPP-frontend
git init
git add .
git commit -m "initial: wakaAPP frontend v2.0"
# Push ke GitHub, lalu connect repo di netlify.com
```

**Cara C: Netlify CLI**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir /home/naya/Documents/DevApp/wakaAPP-frontend
```

---

## Teknis: Mengapa Kamera Sekarang Berfungsi?

| Aspek | GAS HtmlService (v1.0) | Netlify/Vercel (v2.0) |
|-------|----------------------|----------------------|
| Origin halaman | `script.google.com` (iframe) | Domain Anda sendiri (HTTPS) |
| `getUserMedia()` | ❌ Diblokir browser | ✅ Berfungsi penuh |
| Permissions-Policy | ❌ Tidak bisa dikontrol | ✅ `camera=(self)` |
| HTTPS | ✅ Ya (tapi iframe) | ✅ Ya (langsung) |

---

## Teknis: CORS & Komunikasi API

Frontend mengirim request ke GAS dengan cara ini (di `api.js`):
```javascript
fetch(CONFIG.GAS_URL, {
  method: 'POST',
  body: JSON.stringify({ action, token, payload })
  // TIDAK set Content-Type untuk menghindari CORS preflight
});
```

GAS menerima request via `doPost(e)`:
- `e.postData.contents` berisi JSON string
- Token diverifikasi via `tokeninfo` API Google
- Response dikembalikan sebagai `ContentService.MimeType.JSON`

GAS dengan deploy `Anyone` otomatis menambahkan `Access-Control-Allow-Origin: *` pada response sehingga tidak ada masalah CORS.

---

## Fitur yang Belum Dimigrasi (TODO)

- [ ] Halaman **Supervisi KBM** (Fase 5 di CLAUDE.md)
- [ ] Halaman **PKL** (Fase 4 di CLAUDE.md)
- [ ] Halaman **Master Data** (CRUD tabel Master_Guru, Master_Kelas, dll.)
- [ ] PWA offline support (Service Worker)
- [ ] Notifikasi WA otomatis (opsional, butuh API pihak ketiga)
