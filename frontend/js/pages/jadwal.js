/**
 * jadwal.js — Halaman Jadwal Mengajar
 * Fitur: Tampilan jadwal per hari + Form tambah/edit jadwal (Waka only)
 */

const JadwalPage = (() => {

  const HARI_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  let _user = null;
  let _data = null;

  function render(container, user) {
    _user = user;
    container.innerHTML = `
      <div class="page-header">
        <h2><i class="fa-regular fa-calendar-check" style="font-size:1.4rem;"></i> Jadwal Mengajar</h2>
        <p>Jadwal mengajar aktif tahun ajaran ini</p>
      </div>

      ${user.role !== 'guru' ? `
      <!-- Form Tambah Jadwal (Waka/Kepsek) -->
      <div class="card" id="form-jadwal-card">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-plus-circle"></i> Tambah / Edit Jadwal</div>
          <button class="btn btn-ghost btn-sm" onclick="JadwalPage._toggleForm()" id="btn-toggle-form">
            <i class="fa-solid fa-chevron-down"></i>
          </button>
        </div>
        <div id="form-jadwal-body" style="display:none;">
          <div class="form-group">
            <label class="form-label">ID Guru <span class="required">*</span></label>
            <input type="text" class="form-control" id="fj-id-guru" placeholder="Contoh: G001">
          </div>
          <div class="form-row" style="grid-template-columns:1fr 1fr;">
            <div class="form-group">
              <label class="form-label">Kelas <span class="required">*</span></label>
              <input type="text" class="form-control" id="fj-kelas" placeholder="Contoh: XI-RPL-1">
            </div>
            <div class="form-group">
              <label class="form-label">Mata Pelajaran <span class="required">*</span></label>
              <input type="text" class="form-control" id="fj-mapel" placeholder="Contoh: Pemrograman Web">
            </div>
          </div>
          <div class="form-row" style="grid-template-columns:1fr 1fr;">
            <div class="form-group">
              <label class="form-label">Hari <span class="required">*</span></label>
              <select class="form-control" id="fj-hari">
                ${HARI_ORDER.map(h => `<option value="${h}">${h}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Jam Ke <span class="required">*</span></label>
              <select class="form-control" id="fj-jam">
                ${[1,2,3,4,5,6,7,8,9,10].map(n => `<option value="${n}">Jam ${n}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row" style="grid-template-columns:1fr 1fr;">
            <div class="form-group">
              <label class="form-label">Tahun Ajaran</label>
              <input type="text" class="form-control" id="fj-tahun" placeholder="Contoh: 2026/2027" value="2026/2027">
            </div>
            <div class="form-group">
              <label class="form-label">Semester</label>
              <select class="form-control" id="fj-semester">
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>
          </div>
          <div style="display:flex; gap:8px; margin-top:4px;">
            <button class="btn btn-primary" onclick="JadwalPage._submitJadwal()">
              <i class="fa-solid fa-floppy-disk"></i> Simpan Jadwal
            </button>
            <button class="btn btn-outline" onclick="JadwalPage._resetForm()">
              <i class="fa-solid fa-xmark"></i> Batal
            </button>
          </div>
          <div id="fj-status" style="margin-top:12px;"></div>
        </div>
      </div>
      ` : ''}

      <div id="jadwal-loading">
        ${[1,2,3].map(() => `<div class="skeleton skeleton-card"></div>`).join('')}
      </div>
      <div id="jadwal-content" style="display:none;"></div>
    `;

    _loadData(user);
  }

  async function _loadData(user) {
    try {
      const res = await API.jadwal.getData();
      if (!res.success) throw new Error(res.message);
      _data = res.data;

      document.getElementById('jadwal-loading').style.display = 'none';
      document.getElementById('jadwal-content').style.display = 'block';
      _renderJadwal(res.data, user);

    } catch (err) {
      document.getElementById('jadwal-loading').innerHTML = `
        <div class="alert alert-danger">
          <i class="fa-solid fa-circle-exclamation"></i>
          <span>Gagal memuat jadwal: ${err.message}</span>
        </div>
      `;
    }
  }

  function _renderJadwal(data, user) {
    const container = document.getElementById('jadwal-content');
    const { jadwalKu = [], jadwalSemua = [], hari: hariIni } = data;
    const jadwalToShow = user.role === 'guru' ? jadwalKu : jadwalSemua;

    if (jadwalToShow.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="empty-state">
            <i class="fa-regular fa-calendar-xmark"></i>
            <p>Tidak ada jadwal mengajar yang ditemukan.</p>
            ${user.role !== 'guru' ? '<p style="font-size:0.8rem;color:var(--green);">Gunakan form di atas untuk menambah jadwal.</p>' : ''}
          </div>
        </div>
      `;
      return;
    }

    // Group by hari
    const byHari = {};
    jadwalToShow.forEach(j => {
      if (!byHari[j.hari]) byHari[j.hari] = [];
      byHari[j.hari].push(j);
    });

    container.innerHTML = HARI_ORDER.filter(h => byHari[h]).map(hari => {
      const isToday = hari === hariIni;
      return `
        <div class="card" style="${isToday ? 'border-color:var(--green); border-width:2px;' : ''}">
          <div class="card-header">
            <div class="card-title">
              <i class="fa-solid fa-calendar-day"></i> ${hari}
            </div>
            ${isToday ? '<span class="badge badge-primary">Hari Ini</span>' : ''}
          </div>
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Jam</th>
                  <th>Kelas</th>
                  <th>Mata Pelajaran</th>
                  ${user.role !== 'guru' ? '<th>Guru</th>' : ''}
                  ${user.role !== 'guru' ? '<th>Aksi</th>' : ''}
                </tr>
              </thead>
              <tbody>
                ${byHari[hari].sort((a,b) => a.jam_ke - b.jam_ke).map((j, idx) => `
                  <tr>
                    <td><span class="badge badge-primary">Jam ${j.jam_ke}</span></td>
                    <td><strong>${j.id_kelas}</strong></td>
                    <td>${j.mapel}</td>
                    ${user.role !== 'guru' ? `<td>${j.id_guru || '-'}</td>` : ''}
                    ${user.role !== 'guru' ? `
                    <td>
                      <button class="btn btn-sm btn-ghost" title="Edit" onclick="JadwalPage._editJadwal('${j.hari}', ${idx})">
                        <i class="fa-solid fa-pen" style="color:var(--info);"></i>
                      </button>
                    </td>` : ''}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }).join('');
  }

  // === FORM TOGGLE ===
  function _toggleForm() {
    const body = document.getElementById('form-jadwal-body');
    const btn  = document.getElementById('btn-toggle-form');
    const open = body.style.display === 'none';
    body.style.display = open ? 'block' : 'none';
    btn.innerHTML = open
      ? '<i class="fa-solid fa-chevron-up"></i>'
      : '<i class="fa-solid fa-chevron-down"></i>';
  }

  function _resetForm() {
    ['fj-id-guru','fj-kelas','fj-mapel'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const status = document.getElementById('fj-status');
    if (status) status.innerHTML = '';
  }

  // === ISI FORM untuk Edit ===
  function _editJadwal(hari, idx) {
    if (!_data) return;
    const list = _user.role === 'guru' ? _data.jadwalKu : _data.jadwalSemua;
    const byHari = {};
    list.forEach(j => {
      if (!byHari[j.hari]) byHari[j.hari] = [];
      byHari[j.hari].push(j);
    });
    const j = (byHari[hari] || []).sort((a,b) => a.jam_ke - b.jam_ke)[idx];
    if (!j) return;

    document.getElementById('fj-id-guru').value = j.id_guru || '';
    document.getElementById('fj-kelas').value   = j.id_kelas || '';
    document.getElementById('fj-mapel').value   = j.mapel || '';
    document.getElementById('fj-hari').value    = j.hari || 'Senin';
    document.getElementById('fj-jam').value     = j.jam_ke || 1;

    // Buka form jika tertutup
    const body = document.getElementById('form-jadwal-body');
    if (body && body.style.display === 'none') _toggleForm();

    document.getElementById('fj-id-guru').focus();
    App.toast('info', 'Data dimuat ke form. Edit lalu simpan.');
  }

  // === SUBMIT JADWAL ===
  async function _submitJadwal() {
    const idGuru = document.getElementById('fj-id-guru').value.trim();
    const kelas  = document.getElementById('fj-kelas').value.trim();
    const mapel  = document.getElementById('fj-mapel').value.trim();
    const hari   = document.getElementById('fj-hari').value;
    const jam    = parseInt(document.getElementById('fj-jam').value);
    const tahun  = document.getElementById('fj-tahun').value.trim() || '2026/2027';
    const smt    = document.getElementById('fj-semester').value;

    const status = document.getElementById('fj-status');

    if (!idGuru || !kelas || !mapel) {
      status.innerHTML = `<div class="alert alert-warning"><i class="fa-solid fa-triangle-exclamation"></i> ID Guru, Kelas, dan Mata Pelajaran wajib diisi.</div>`;
      return;
    }

    const payload = {
      id_jadwal    : `JDW-${idGuru}-${kelas}-${hari}-${jam}`,
      id_guru      : idGuru,
      id_kelas     : kelas,
      mapel        : mapel,
      hari         : hari,
      jam_ke       : jam,
      tahun_ajaran : tahun,
      semester     : smt
    };

    status.innerHTML = `<div class="alert alert-info"><i class="fa-solid fa-spinner fa-spin"></i> Menyimpan jadwal...</div>`;

    try {
      const res = await API.jadwal.save(payload);
      if (res.success) {
        status.innerHTML = `<div class="alert alert-success"><i class="fa-solid fa-circle-check"></i> Jadwal berhasil disimpan!</div>`;
        App.toast('success', 'Jadwal disimpan!');
        _resetForm();
        _loadData(_user); // Refresh tabel
      } else {
        status.innerHTML = `<div class="alert alert-danger"><i class="fa-solid fa-circle-exclamation"></i> ${res.message}</div>`;
      }
    } catch (err) {
      status.innerHTML = `<div class="alert alert-danger"><i class="fa-solid fa-circle-exclamation"></i> ${err.message}</div>`;
    }
  }

  function destroy() {}

  return { render, destroy, _toggleForm, _resetForm, _editJadwal, _submitJadwal };
})();
