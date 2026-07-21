// Konfigurasi Utama Aplikasi

const CONFIG = {
  // TODO: Jalankan setupDatabase() di Setup.js, lalu copy ID Spreadsheet ke sini
  SPREADSHEET_ID: "1PeK5Lxnyr43ausV1MWYN1BuHxq-vghv_nHbqsjpg1eU",

  /**
   * URL Frontend Netlify/Vercel/Cloudflare Pages.
   * GAS akan redirect ke URL ini setelah user berhasil login.
   * Ganti dengan URL deploy Anda.
   * Contoh: "https://waka-smk.netlify.app"
   */
  FRONTEND_URL: "https://waka-app-smk.pages.dev",

  /**
   * Durasi sesi login (dalam milidetik). Default: 8 jam.
   */
  SESSION_DURATION_MS: 8 * 60 * 60 * 1000,

  SHEET_NAMES: {
    GURU: "Master_Guru",
    KELAS: "Master_Kelas",
    JADWAL: "Master_Jadwal",
    ATP: "Master_ATP",
    JURNAL: "E_Jurnal",
    PERANGKAT: "Perangkat_Ajar",
    DUDI: "Master_DUDI",
    PKL: "Data_PKL",
    MONITORING: "Monitoring_PKL",
    SUPERVISI: "Data_Supervisi",
    ABSENSI: "Data_Absensi"
  },

  APP_INFO: {
    NAMA_SEKOLAH: "SMK Bisa Hebat",
    TAHUN_AJARAN: "2026/2027",
    SEMESTER: "Ganjil"
  }
};
