/**
 * mock_api.js — Data Dummy untuk DEV_MODE
 * Digunakan saat CONFIG.DEV_MODE = true agar bisa testing UI tanpa GAS.
 */

const MockAPI = {

  auth: {
    verify: async () => ({
      success: true,
      user: {
        email: 'dev@smkbisahebat.sch.id',
        role: 'waka', // Ganti 'guru', 'waka', atau 'kepsek' untuk testing
        nama: 'Developer (Mock)',
        id_guru: 'DEV001'
      }
    }),
    loginWithGoogle: async (jwtToken) => ({
      success: true,
      sessionToken: 'mock-uuid-1234',
      user: {
        email: 'dev@smkbisahebat.sch.id',
        role: 'waka', // Ganti 'guru', 'waka', atau 'kepsek' untuk testing
        nama: 'Developer (Mock)',
        id_guru: 'DEV001'
      }
    })
  },

  dashboard: {
    getData: async (role = 'guru') => ({
      success: true,
      data: {
        role: role,
        guruStats: role === 'guru' || role === 'waka' ? {
          jurnalMasuk: 4,
          targetJurnal: 5,
          persen: 80
        } : null,
        globalStats: role === 'waka' || role === 'kepsek' ? {
          totalJurnalAll: 72,
          totalTargetAll: 90,
          persenAll: 80,
          kepatuhanRendah: [
            { nama: 'Joko Widodo, S.T', masuk: 1, target: 5, persen: 20, no_wa: '081111111111' },
            { nama: 'Dewi Lestari, S.Pd', masuk: 3, target: 5, persen: 60, no_wa: '' },
          ]
        } : null
      }
    })
  },

  jurnal: {
    getFormData: async () => ({
      success: true,
      data: {
        hari: 'Minggu',
        jadwalKu: [
          { id_kelas: 'XI-RPL-1', mapel: 'Pemrograman Web', jam_ke: 1, hari: 'Minggu' },
          { id_kelas: 'X-TKJ-2',  mapel: 'Jaringan Dasar',  jam_ke: 3, hari: 'Minggu' },
        ],
        jadwalSemua: [
          { id_kelas: 'XI-RPL-1', mapel: 'Pemrograman Web', jam_ke: 1, hari: 'Minggu' },
          { id_kelas: 'X-TKJ-2',  mapel: 'Jaringan Dasar',  jam_ke: 3, hari: 'Minggu' },
          { id_kelas: 'XII-MM-1', mapel: 'Desain Grafis',   jam_ke: 5, hari: 'Minggu' },
        ],
        atp: [
          { id_atp: 'ATP-PW-01', mapel: 'Pemrograman Web', deskripsi: 'Pengenalan HTML5 dan CSS3' },
          { id_atp: 'ATP-PW-02', mapel: 'Pemrograman Web', deskripsi: 'Membuat Layout Responsif' },
          { id_atp: 'ATP-PW-03', mapel: 'Pemrograman Web', deskripsi: 'JavaScript Dasar' },
          { id_atp: 'ATP-JD-01', mapel: 'Jaringan Dasar',  deskripsi: 'Model OSI dan TCP/IP' },
          { id_atp: 'ATP-JD-02', mapel: 'Jaringan Dasar',  deskripsi: 'Konfigurasi IP Address' },
        ]
      }
    }),
    submit: async (payload) => {
      await _delay(800);
      return { success: true, message: `[DEV] Jurnal untuk ${payload.id_kelas} berhasil disimpan! (mock)` };
    }
  },

  absen: {
    submit: async (payload) => {
      await _delay(1200);
      return { success: true, message: `[DEV] Absen ${payload.jenis} berhasil dicatat! (mock)` };
    }
  },

  jadwal: {
    getData: async () => ({
      success: true,
      data: {
        hari: 'Minggu',
        jadwalKu: [
          { id_guru: 'G001', id_kelas: 'XI-RPL-1', mapel: 'Pemrograman Web', hari: 'Senin', jam_ke: 1 },
          { id_guru: 'G001', id_kelas: 'X-TKJ-2',  mapel: 'Jaringan Dasar',  hari: 'Selasa', jam_ke: 3 },
          { id_guru: 'G001', id_kelas: 'XI-RPL-1', mapel: 'Pemrograman Web', hari: 'Rabu',   jam_ke: 2 },
          { id_guru: 'G001', id_kelas: 'XII-MM-1', mapel: 'Desain Grafis',   hari: 'Kamis',  jam_ke: 4 },
          { id_guru: 'G001', id_kelas: 'X-TKJ-2',  mapel: 'Jaringan Dasar',  hari: 'Jumat',  jam_ke: 1 },
        ],
        jadwalSemua: [
          { id_guru: 'G001', id_kelas: 'XI-RPL-1', mapel: 'Pemrograman Web', hari: 'Senin', jam_ke: 1 },
          { id_guru: 'G002', id_kelas: 'X-TKJ-1',  mapel: 'Matematika',      hari: 'Senin', jam_ke: 2 },
          { id_guru: 'G003', id_kelas: 'XII-AK-1', mapel: 'Akuntansi',       hari: 'Senin', jam_ke: 3 },
          { id_guru: 'G001', id_kelas: 'X-TKJ-2',  mapel: 'Jaringan Dasar',  hari: 'Selasa', jam_ke: 3 },
          { id_guru: 'G002', id_kelas: 'XI-RPL-2', mapel: 'Matematika',      hari: 'Rabu',   jam_ke: 1 },
        ]
      }
    })
  },

  perangkat: {
    getData: async () => ({
      success: true,
      role: 'waka',
      data: [
        { id_guru: 'G001', nama_guru: 'Budi Santoso, S.Pd', mapel: 'Pemrograman Web', jenis_dokumen: 'ATP',         status: 'Terverifikasi', link: 'https://drive.google.com', tgl: '2026-07-01', row_index: 2 },
        { id_guru: 'G001', nama_guru: 'Budi Santoso, S.Pd', mapel: 'Pemrograman Web', jenis_dokumen: 'Modul Ajar',  status: 'Sudah Kumpul',  link: 'https://drive.google.com', tgl: '2026-07-10', row_index: 3 },
        { id_guru: 'G002', nama_guru: 'Dewi Lestari, S.Pd', mapel: 'Matematika',      jenis_dokumen: 'ATP',         status: 'Belum Kumpul',  link: '',                         tgl: '-',          row_index: 4 },
        { id_guru: 'G002', nama_guru: 'Dewi Lestari, S.Pd', mapel: 'Matematika',      jenis_dokumen: 'Prota',       status: 'Belum Kumpul',  link: '',                         tgl: '-',          row_index: 5 },
        { id_guru: 'G003', nama_guru: 'Joko Widodo, S.T',   mapel: 'Jaringan Dasar',  jenis_dokumen: 'Modul Ajar',  status: 'Terverifikasi', link: 'https://drive.google.com', tgl: '2026-07-05', row_index: 6 },
      ]
    }),
    update: async (payload) => {
      await _delay(600);
      return { success: true, message: `[DEV] Status diperbarui! (mock)` };
    }
  },

  pkl: {
    getData: async () => ({
      success: true,
      data: [
        { id_siswa: 'S001', nama: 'Andi', industri: 'PT Tekno', tgl: '2026-07-15', kegiatan: 'Membuat API', status: 'Terverifikasi' },
        { id_siswa: 'S002', nama: 'Budi', industri: 'CV Web', tgl: '2026-07-15', kegiatan: 'Slice PSD ke HTML', status: 'Menunggu' }
      ]
    }),
    submit: async (payload) => {
      await _delay(600);
      return { success: true, message: '[DEV] Jurnal PKL tersimpan! (mock)' };
    }
  },

  supervisi: {
    getData: async () => ({
      success: true,
      data: [
        { id_guru: 'G001', nama: 'Budi Santoso', mapel: 'PemWeb', nilai: 85, tgl: '2026-07-10', catatan: 'Bagus, pertahankan' },
        { id_guru: 'G002', nama: 'Dewi Lestari', mapel: 'MTK', nilai: 0, tgl: '-', catatan: '-' }
      ]
    }),
    submit: async (payload) => {
      await _delay(600);
      return { success: true, message: '[DEV] Data supervisi tersimpan! (mock)' };
    }
  },

  master: {
    getTableData: async (tableName) => ({
      success: true,
      data: tableName === 'Master_Guru' ? [
        ['G001', 'Budi Santoso', 'dev.guru@smkbisahebat.sch.id', '08111'],
        ['W001', 'Siti Rahayu', 'dev.waka@smkbisahebat.sch.id', '08222']
      ] : []
    }),
    saveRow: async (payload) => {
      await _delay(500);
      return { success: true, message: '[DEV] Baris master disimpan! (mock)' };
    },
    deleteRow: async (payload) => {
      await _delay(500);
      return { success: true, message: '[DEV] Baris master dihapus! (mock)' };
    }
  },

  // Utility
  _delay: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

function _delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
