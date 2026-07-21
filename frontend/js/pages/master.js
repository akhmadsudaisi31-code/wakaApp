/**
 * master.js — Halaman Data Master (CRUD Lengkap)
 *
 * Tabel yang dikelola:
 * - Master_Guru   : id_guru, nama, email, role, mapel_diampu, status_aktif
 * - Master_Kelas  : id_kelas, tingkat, jurusan, wali_kelas
 * - Master_Jadwal : id_jadwal, id_guru, id_kelas, mapel, hari, jam_ke, tahun_ajaran, semester
 * - Master_ATP    : id_atp, mapel, kelas_tingkat, urutan, deskripsi_materi
 *
 * Format response backend: { success, headers: [...], rows: [{rowIndex, rowData:[...]}] }
 */

const MasterPage = (() => {

  let _currentTable = 'Master_Guru';
  let _headers      = [];
  let _rows         = [];

  // Definisi tabel: label tab, nama sheet, kolom dengan tipe input
  const TABLE_CONFIG = {
    Master_Guru: {
      label: 'Data Guru',
      icon : 'fa-solid fa-chalkboard-user',
      cols : [
        { key: 'id_guru',       label: 'ID Guru',        type: 'text',     required: true,  placeholder: 'G001' },
        { key: 'nama',          label: 'Nama Lengkap',   type: 'text',     required: true,  placeholder: 'Budi Santoso, S.Pd' },
        { key: 'email',         label: 'Email Gmail',    type: 'email',    required: true,  placeholder: 'guru@gmail.com' },
        { key: 'role',          label: 'Role',           type: 'select',   required: true,  options: ['guru','waka','kepsek'] },
        { key: 'mapel_diampu',  label: 'Mapel Diampu',   type: 'text',     required: false, placeholder: 'Matematika, Fisika' },
        { key: 'status_aktif',  label: 'Status Aktif',   type: 'select',   required: true,  options: ['TRUE','FALSE'] },
      ]
    },
    Master_Kelas: {
      label: 'Data Kelas',
      icon : 'fa-solid fa-users-rectangle',
      cols : [
        { key: 'id_kelas',   label: 'ID Kelas',  type: 'text',   required: true,  placeholder: 'X-TKJ-1' },
        { key: 'tingkat',    label: 'Tingkat',   type: 'select', required: true,  options: ['X','XI','XII'] },
        { key: 'jurusan',    label: 'Jurusan',   type: 'text',   required: true,  placeholder: 'TKJ / RPL / MM' },
        { key: 'wali_kelas', label: 'Wali Kelas',type: 'text',   required: false, placeholder: 'G001' },
      ]
    },
    Master_Jadwal: {
      label: 'Jadwal Mengajar',
      icon : 'fa-regular fa-calendar-check',
      cols : [
        { key: 'id_jadwal',    label: 'ID Jadwal',     type: 'text',   required: true,  placeholder: 'JDW-G001-X-TKJ-1-Senin-1' },
        { key: 'id_guru',      label: 'ID Guru',       type: 'text',   required: true,  placeholder: 'G001' },
        { key: 'id_kelas',     label: 'Kelas',         type: 'text',   required: true,  placeholder: 'X-TKJ-1' },
        { key: 'mapel',        label: 'Mata Pelajaran',type: 'text',   required: true,  placeholder: 'Jaringan Dasar' },
        { key: 'hari',         label: 'Hari',          type: 'select', required: true,  options: ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'] },
        { key: 'jam_ke',       label: 'Jam Ke',        type: 'number', required: true,  placeholder: '1' },
        { key: 'tahun_ajaran', label: 'Tahun Ajaran',  type: 'text',   required: true,  placeholder: '2026/2027' },
        { key: 'semester',     label: 'Semester',      type: 'select', required: true,  options: ['Ganjil','Genap'] },
      ]
    },
    Master_ATP: {
      label: 'Alur Tujuan Pembelajaran',
      icon : 'fa-solid fa-list-check',
      cols : [
        { key: 'id_atp',           label: 'ID ATP',         type: 'text',   required: true,  placeholder: 'ATP-MTK-01' },
        { key: 'mapel',            label: 'Mata Pelajaran', type: 'text',   required: true,  placeholder: 'Matematika' },
        { key: 'kelas_tingkat',    label: 'Tingkat',        type: 'select', required: true,  options: ['X','XI','XII'] },
        { key: 'urutan',           label: 'Urutan',         type: 'number', required: true,  placeholder: '1' },
        { key: 'deskripsi_materi', label: 'Deskripsi Materi', type: 'text', required: true,  placeholder: 'Pengenalan Aljabar Linear' },
      ]
    },
    Master_Lokasi: {
      label: 'Lokasi Absen GPS',
      icon : 'fa-solid fa-map-location-dot',
      cols : [
        { key: 'id_lokasi',   label: 'ID Lokasi', type: 'text',   required: true,  placeholder: 'LOK-01' },
        { key: 'nama_lokasi', label: 'Nama Lokasi',type: 'text',  required: true,  placeholder: 'Sekolah Induk' },
        { key: 'latitude',    label: 'Latitude',  type: 'number', required: true,  placeholder: '-7.03195' },
        { key: 'longitude',   label: 'Longitude', type: 'number', required: true,  placeholder: '112.74836' },
        { key: 'radius',      label: 'Radius (m)',type: 'number', required: true,  placeholder: '100' },
      ]
    },
  };

  // ============================================================
  // RENDER HALAMAN
  // ============================================================
  function render(container, user) {
    const tabs = Object.entries(TABLE_CONFIG).map(([key, cfg]) => `
      <button class="camera-mode-tab ${key === _currentTable ? 'active' : ''}"
        id="tab-${key}"
        onclick="MasterPage.switchTab('${key}')">
        <i class="${cfg.icon}"></i> ${cfg.label}
      </button>
    `).join('');

    container.innerHTML = `
      <div class="page-header">
        <h2><i class="fa-solid fa-database"></i> Data Master</h2>
        <p>Kelola data inti sistem — Guru, Kelas, Jadwal, dan ATP.</p>
      </div>

      <!-- Tab Selector -->
      <div class="camera-mode-tabs" style="flex-wrap:wrap; gap:6px;">
        ${tabs}
      </div>

      <!-- Tabel + Tombol Tambah -->
      <div class="card">
        <div class="card-header">
          <div class="card-title" id="master-table-title">
            <i class="fa-solid fa-table"></i> ${TABLE_CONFIG[_currentTable].label}
          </div>
          <button class="btn btn-primary btn-sm" id="btn-tambah-master" onclick="MasterPage.openForm(null)">
            <i class="fa-solid fa-plus"></i> Tambah
          </button>
        </div>
        <div id="master-content">
          <div class="skeleton skeleton-card"></div>
          <div class="skeleton skeleton-card"></div>
        </div>
      </div>

      <!-- Modal Form Tambah/Edit -->
      <div id="master-modal" style="display:none; position:fixed; inset:0; z-index:8000;
        background:rgba(0,0,0,0.5); backdrop-filter:blur(2px);
        align-items:center; justify-content:center; padding:16px;">
        <div style="background:var(--white); border-radius:10px; width:100%; max-width:480px;
          max-height:90vh; overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,0.3);">
          <div style="display:flex;justify-content:space-between;align-items:center;
            padding:16px 20px; border-bottom:1px solid var(--border);">
            <h3 id="modal-title" style="font-size:0.95rem;font-weight:700;"></h3>
            <button onclick="MasterPage.closeForm()"
              style="border:none;background:none;cursor:pointer;font-size:16px;color:var(--text-muted);">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div id="modal-form-body" style="padding:20px;"></div>
          <div style="padding:0 20px 20px; display:flex; gap:8px;">
            <button class="btn btn-primary" onclick="MasterPage.saveForm()">
              <i class="fa-solid fa-floppy-disk"></i> Simpan
            </button>
            <button class="btn btn-outline" onclick="MasterPage.closeForm()">Batal</button>
          </div>
        </div>
      </div>
    `;

    loadData();
  }

  // ============================================================
  // SWITCH TAB
  // ============================================================
  function switchTab(tableName) {
    _currentTable = tableName;
    document.querySelectorAll('.camera-mode-tab').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tableName}`)?.classList.add('active');
    const title = document.getElementById('master-table-title');
    if (title) title.innerHTML = `<i class="${TABLE_CONFIG[tableName].icon}"></i> ${TABLE_CONFIG[tableName].label}`;
    loadData();
  }

  // ============================================================
  // LOAD DATA
  // ============================================================
  async function loadData() {
    const content = document.getElementById('master-content');
    if (!content) return;
    content.innerHTML = `<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>`;

    try {
      const res = await API.master.getTableData(_currentTable);
      if (!res.success) throw new Error(res.message);

      // Backend mengembalikan { headers, rows:[{rowIndex, rowData}] }
      _headers = res.headers || [];
      _rows    = res.rows    || [];

      if (_rows.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i class="fa-solid fa-database"></i>
            <p>Belum ada data di tabel <strong>${_currentTable}</strong>.</p>
            <p style="font-size:0.8rem;color:var(--green);margin-top:4px;">
              Klik tombol <strong>Tambah</strong> untuk menambah data pertama.
            </p>
          </div>`;
        return;
      }

      // Render tabel dengan header dinamis dari backend
      const thHTML = [..._headers, 'Aksi'].map(h =>
        `<th>${h}</th>`
      ).join('');

      const trHTML = _rows.map(row => `
        <tr>
          ${row.rowData.map(cell => `<td>${cell ?? ''}</td>`).join('')}
          <td style="white-space:nowrap;">
            <button class="btn btn-sm btn-ghost" title="Edit"
              onclick="MasterPage.openForm(${row.rowIndex})">
              <i class="fa-solid fa-pen" style="color:var(--info);"></i>
            </button>
            <button class="btn btn-sm btn-ghost" title="Hapus"
              onclick="MasterPage.deleteRow(${row.rowIndex})">
              <i class="fa-solid fa-trash" style="color:var(--danger);"></i>
            </button>
          </td>
        </tr>
      `).join('');

      content.innerHTML = `
        <div class="table-wrap">
          <table class="table">
            <thead><tr>${thHTML}</tr></thead>
            <tbody>${trHTML}</tbody>
          </table>
        </div>
        <p style="font-size:0.75rem;color:var(--text-muted);margin-top:8px;padding:0 4px;">
          Total: ${_rows.length} baris data
        </p>
      `;

    } catch (err) {
      content.innerHTML = `
        <div class="alert alert-danger">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>Gagal memuat data: ${err.message}</span>
        </div>`;
    }
  }

  // ============================================================
  // OPEN FORM MODAL (null = tambah baru, rowIndex = edit)
  // ============================================================
  function openForm(rowIndex) {
    const modal  = document.getElementById('master-modal');
    const title  = document.getElementById('modal-title');
    const body   = document.getElementById('modal-form-body');
    const cols   = TABLE_CONFIG[_currentTable]?.cols || [];

    // Cari data existing jika edit
    let existingData = null;
    if (rowIndex !== null) {
      const row = _rows.find(r => r.rowIndex === rowIndex);
      existingData = row?.rowData || null;
    }

    title.textContent = rowIndex === null
      ? `Tambah — ${TABLE_CONFIG[_currentTable].label}`
      : `Edit — ${TABLE_CONFIG[_currentTable].label}`;

    // Render input fields
    body.innerHTML = cols.map((col, i) => {
      const val = existingData ? (existingData[i] ?? '') : '';
      let inputEl = '';

      if (col.type === 'select') {
        const opts = col.options.map(o =>
          `<option value="${o}" ${String(val) === String(o) ? 'selected' : ''}>${o}</option>`
        ).join('');
        inputEl = `<select class="form-control" id="mf-${col.key}">${opts}</select>`;
      } else {
        inputEl = `<input type="${col.type}" class="form-control" id="mf-${col.key}"
          value="${val}" placeholder="${col.placeholder || ''}"
          ${col.required ? 'required' : ''}>`;
      }

      return `
        <div class="form-group">
          <label class="form-label">
            ${col.label} ${col.required ? '<span class="required">*</span>' : ''}
          </label>
          ${inputEl}
        </div>
      `;
    }).join('');

    // Simpan rowIndex di modal untuk dipakai saat save
    modal.dataset.rowIndex = rowIndex ?? '';
    modal.style.display    = 'flex';
  }

  function closeForm() {
    const modal = document.getElementById('master-modal');
    if (modal) modal.style.display = 'none';
  }

  // ============================================================
  // SAVE FORM
  // ============================================================
  async function saveForm() {
    const modal    = document.getElementById('master-modal');
    const rowIndex = modal.dataset.rowIndex === '' ? 0 : parseInt(modal.dataset.rowIndex);
    const cols     = TABLE_CONFIG[_currentTable]?.cols || [];

    // Kumpulkan nilai dari form
    const rowArray = cols.map(col => {
      const el = document.getElementById(`mf-${col.key}`);
      return el ? el.value.trim() : '';
    });

    // Validasi required fields
    const missing = cols.filter((col, i) => col.required && !rowArray[i]);
    if (missing.length > 0) {
      App.toast('warning', `Field wajib belum diisi: ${missing.map(c => c.label).join(', ')}`);
      return;
    }

    App.showLoading('Menyimpan data...');
    try {
      const res = await API.master.saveRow(_currentTable, rowIndex, rowArray);
      if (res.success) {
        App.toast('success', rowIndex === 0 ? 'Data berhasil ditambahkan!' : 'Data berhasil diupdate!');
        closeForm();
        loadData();
      } else {
        App.toast('error', res.message || 'Gagal menyimpan data.');
      }
    } catch (err) {
      App.toast('error', err.message);
    } finally {
      App.hideLoading();
    }
  }

  // ============================================================
  // DELETE ROW
  // ============================================================
  async function deleteRow(rowIndex) {
    if (!confirm('Hapus baris data ini? Tindakan tidak dapat dibatalkan.')) return;
    App.showLoading('Menghapus data...');
    try {
      const res = await API.master.deleteRow(_currentTable, rowIndex);
      if (res.success) {
        App.toast('success', 'Data berhasil dihapus.');
        loadData();
      } else {
        App.toast('error', res.message || 'Gagal menghapus.');
      }
    } catch (err) {
      App.toast('error', err.message);
    } finally {
      App.hideLoading();
    }
  }

  function destroy() {
    closeForm();
  }

  return { render, destroy, switchTab, openForm, closeForm, saveForm, deleteRow };

})();
