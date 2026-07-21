/**
 * config.js — Konfigurasi Aplikasi
 *
 * ⚠️  Untuk testing lokal: set DEV_MODE = true
 * Saat DEV_MODE aktif, tidak perlu GAS_URL — pakai data dummy.
 * Sebelum deploy ke produksi, set DEV_MODE = false dan isi GAS_URL.
 */
const CONFIG = {
  /**
   * DEV_MODE = true  → Login dengan data dummy, UI jalan tanpa backend.
   * DEV_MODE = false → Terhubung ke GAS (Production Mode).
   */
  DEV_MODE: false,

  /**
   * URL Google Apps Script Web App yang sudah di-deploy.
   * Cara deploy GAS:
   *   1. Buka Apps Script Editor → Deploy → New Deployment
   *   2. Type: Web App
   *   3. Execute as: User accessing the web app
   *   4. Who has access: Anyone
   *   5. Deploy → Salin URL-nya ke sini
   */
  GAS_URL: "https://script.google.com/macros/s/AKfycbx7BX6_bJGI_rk8CaVMs6I1hUhlUK1O_Bla6cyyV0yJ7w5_AeikflLkw-YqaOVYNSXS/exec",
  
  /**
   * Client ID OAuth Google Cloud Console
   */
  GOOGLE_CLIENT_ID: "105185834997-4gp2085j4476v1jhkete28lsas20krmf.apps.googleusercontent.com",

  NAMA_SEKOLAH: "SMK SURAMADU",
  APP_VERSION: "2.0.0"
};
