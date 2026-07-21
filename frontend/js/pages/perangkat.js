/**
 * perangkat.js — Halaman Perangkat Ajar
 */

const PerangkatPage = (() => {

  function render(container, user) {
    container.innerHTML = `
      <div class="page-header">
        <h2><i class="fa-solid fa-folder-open" style="font-size:1.4rem;"></i> Perangkat Ajar</h2>
        <p>Status kelengkapan dokumen perangkat ajar</p>
      </div>

      ${user.role === 'guru' ? `
        <div class="alert alert-info">
          <i class="fa-solid fa-circle-info"></i>
          <span>Klik tombol <strong>Upload Link</strong> untuk menambahkan link Google Drive dokumen Anda.</span>
        </div>
      ` : `
        <div class="alert alert-info">
          <i class="fa-solid fa-circle-info"></i>
          <span>Klik <strong>Verifikasi</strong> untuk mengubah status dokumen guru.</span>
        </div>
      `}

      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <i class="fa-solid fa-list-check"></i> Daftar Perangkat Ajar
          </div>
          <button class="btn btn-ghost" onclick="PerangkatPage._loadData()" style="font-size:0.8rem;">
            <i class="fa-solid fa-rotate-right"></i> Refresh
          </button>
        </div>

        <div id="perangkat-loading">
          <div class="skeleton skeleton-card"></div>
          <div class="skeleton skeleton-card"></div>
        </div>

        <div id="perangkat-content" style="display:none;">
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  ${user.role !== 'guru' ? '<th>Guru</th>' : ''}
                  <th>Mapel</th>
                  <th>Jenis Dokumen</th>
                  <th>Status</th>
                  <th>Terakhir Update</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody id="perangkat-table-body">
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Upload Link Modal -->
      <div id="upload-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:9000; align-items:center; justify-content:center; padding:20px;">
        <div class="card" style="max-width:420px; width:100%; margin:0; animation:slideUpFade 0.3s ease;">
          <div class="card-header">
            <div class="card-title"><i class="fa-solid fa-link"></i> Upload Link Dokumen</div>
            <button class="btn btn-ghost btn-icon" onclick="PerangkatPage._closeModal()"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="form-group">
            <label class="form-label" for="modal-link-input">Link Google Drive <span class="required">*</span></label>
            <input type="url" id="modal-link-input" class="form-control" placeholder="https://drive.google.com/...">
          </div>
          <input type="hidden" id="modal-row-index">
          <div style="display:flex; gap:10px; margin-top:8px;">
            <button class="btn btn-ghost btn-full" onclick="PerangkatPage._closeModal()">Batal</button>
            <button class="btn btn-primary btn-full" onclick="PerangkatPage._submitUpload()">
              <i class="fa-solid fa-cloud-arrow-up"></i> Simpan Link
            </button>
          </div>
        </div>
      </div>
    `;

    _loadData(user);
  }

  let _userData = null;

  async function _loadData(user) {
    if (user) _userData = user;
    document.getElementById('perangkat-loading').style.display = 'block';
    document.getElementById('perangkat-content').style.display = 'none';

    try {
      const res = await API.perangkat.getData();
      if (!res.success) throw new Error(res.message);

      document.getElementById('perangkat-loading').style.display = 'none';
      document.getElementById('perangkat-content').style.display = 'block';
      _renderTable(res.data, res.role);

    } catch (err) {
      document.getElementById('perangkat-loading').innerHTML = `
        <div class="alert alert-danger">
          <i class="fa-solid fa-circle-exclamation"></i>
          <span>Gagal memuat data: ${err.message}</span>
        </div>
      `;
    }
  }

  function _renderTable(rows, role) {
    const tbody = document.getElementById('perangkat-table-body');

    if (!rows || rows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state">
              <i class="fa-solid fa-folder-open"></i>
              <p>Belum ada data perangkat ajar.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = rows.map(row => {
      const statusBadge = _getStatusBadge(row.status);
      const linkBtn = row.link
        ? `<a href="${row.link}" target="_blank" rel="noopener" class="btn btn-ghost" style="font-size:0.78rem; padding:4px 8px;"><i class="fa-solid fa-external-link"></i> Buka</a>`
        : '<span style="color:var(--text-muted); font-size:0.82rem;">Belum ada link</span>';

      let actionBtn = '';
      if (role === 'guru' && (row.status === 'Belum Kumpul' || row.status === 'Sudah Kumpul')) {
        actionBtn = `<button class="btn btn-outline" style="font-size:0.78rem; padding:5px 10px;" onclick="PerangkatPage._openUploadModal(${row.row_index})"><i class="fa-solid fa-cloud-arrow-up"></i> Upload Link</button>`;
      } else if (role !== 'guru') {
        if (row.status === 'Sudah Kumpul') {
          actionBtn = `<button class="btn btn-success" style="font-size:0.78rem; padding:5px 10px;" onclick="PerangkatPage._verify(${row.row_index}, 'Terverifikasi')"><i class="fa-solid fa-check"></i> Verifikasi</button>`;
        } else if (row.status === 'Terverifikasi') {
          actionBtn = `<button class="btn btn-ghost" style="font-size:0.78rem; padding:5px 10px;" onclick="PerangkatPage._verify(${row.row_index}, 'Revisi')"><i class="fa-solid fa-rotate-left"></i> Revisi</button>`;
        }
      }

      return `
        <tr>
          ${role !== 'guru' ? `<td><strong>${row.nama_guru || row.id_guru}</strong></td>` : ''}
          <td>${row.mapel}</td>
          <td>${row.jenis_dokumen}</td>
          <td>${statusBadge} ${linkBtn}</td>
          <td style="font-size:0.82rem; color:var(--text-muted);">${row.tgl || '-'}</td>
          <td>${actionBtn}</td>
        </tr>
      `;
    }).join('');
  }

  function _getStatusBadge(status) {
    const map = {
      'Belum Kumpul':  'badge-danger',
      'Sudah Kumpul':  'badge-warning',
      'Terverifikasi': 'badge-success',
      'Revisi':        'badge-danger',
    };
    return `<span class="badge ${map[status] || 'badge-muted'}">${status}</span>`;
  }

  function _openUploadModal(rowIndex) {
    document.getElementById('modal-row-index').value = rowIndex;
    document.getElementById('modal-link-input').value = '';
    const modal = document.getElementById('upload-modal');
    modal.style.display = 'flex';
  }

  function _closeModal() {
    document.getElementById('upload-modal').style.display = 'none';
  }

  async function _submitUpload() {
    const link = document.getElementById('modal-link-input').value.trim();
    const rowIndex = parseInt(document.getElementById('modal-row-index').value);

    if (!link) { toast('warning', 'Masukkan link Google Drive terlebih dahulu!'); return; }
    if (!link.startsWith('http')) { toast('warning', 'Link harus dimulai dengan http atau https.'); return; }

    try {
      const res = await API.perangkat.update({ row_index: rowIndex, link, action: 'upload' });
      if (res.success) {
        toast('success', 'Link dokumen berhasil disimpan!');
        _closeModal();
        _loadData();
      } else {
        toast('error', `Gagal: ${res.message}`);
      }
    } catch (err) {
      toast('error', err.message);
    }
  }

  async function _verify(rowIndex, newStatus) {
    if (!confirm(`Ubah status menjadi "${newStatus}"?`)) return;
    try {
      const res = await API.perangkat.update({ row_index: rowIndex, new_status: newStatus, action: 'verify' });
      if (res.success) {
        toast('success', `Status diubah menjadi "${newStatus}"!`);
        _loadData();
      } else {
        toast('error', `Gagal: ${res.message}`);
      }
    } catch (err) {
      toast('error', err.message);
    }
  }

  function destroy() {}

  return { render, destroy, _loadData, _openUploadModal, _closeModal, _submitUpload, _verify };
})();
