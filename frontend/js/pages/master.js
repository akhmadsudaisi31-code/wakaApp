const MasterPage = {
  currentTable: 'Master_Guru',

  render: async (container) => {
    container.innerHTML = `
      <div class="page-header">
        <h2><i class="fa-solid fa-database"></i> Data Master</h2>
        <p>Kelola data inti sistem (hanya Waka & Kepsek).</p>
      </div>

      <div class="camera-mode-tabs">
        <button class="camera-mode-tab active" onclick="MasterPage.switchTab('Master_Guru', this)"><i class="fa-solid fa-chalkboard-user"></i> Data Guru</button>
        <button class="camera-mode-tab" onclick="MasterPage.switchTab('Master_Kelas', this)"><i class="fa-solid fa-users-rectangle"></i> Data Kelas</button>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title" id="table-title">Tabel Master_Guru</h3>
          <button class="btn btn-primary btn-sm" onclick="MasterPage.addRow()"><i class="fa-solid fa-plus"></i> Tambah Data</button>
        </div>
        <div id="master-content">
          <div class="skeleton skeleton-card"></div>
        </div>
      </div>
    `;

    await MasterPage.loadData();
  },

  switchTab: (tableName, btnEl) => {
    document.querySelectorAll('.camera-mode-tab').forEach(el => el.classList.remove('active'));
    btnEl.classList.add('active');
    MasterPage.currentTable = tableName;
    document.getElementById('table-title').innerText = `Tabel ${tableName}`;
    MasterPage.loadData();
  },

  loadData: async () => {
    const content = document.getElementById('master-content');
    content.innerHTML = `<div class="skeleton skeleton-card"></div>`;

    try {
      const res = await API.master.getTableData(MasterPage.currentTable);
      if (!res.success) throw new Error(res.message);

      if (res.data.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i class="fa-solid fa-database"></i>
            <p>Data kosong untuk ${MasterPage.currentTable}.</p>
          </div>
        `;
        return;
      }

      // Generate table headers based on columns (assuming first row is not headers in data, just values)
      // For Master_Guru: ID, Nama, Email, No WA
      let headers = MasterPage.currentTable === 'Master_Guru' 
        ? ['ID Guru', 'Nama', 'Email', 'No WhatsApp', 'Aksi']
        : ['ID Kelas', 'Nama Kelas', 'Wali Kelas', '-', 'Aksi'];

      let thHTML = headers.map(h => `<th>${h}</th>`).join('');
      let trHTML = res.data.map((row, idx) => `
        <tr>
          ${row.map(cell => `<td>${cell}</td>`).join('')}
          <td>
            <button class="btn btn-sm btn-ghost" onclick="MasterPage.editRow(${idx + 2})"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-sm btn-ghost" style="color:var(--danger)" onclick="MasterPage.deleteRow(${idx + 2})"><i class="fa-solid fa-trash"></i></button>
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
      `;
    } catch (err) {
      content.innerHTML = `
        <div class="alert alert-danger"><i class="fa-solid fa-triangle-exclamation"></i> Gagal memuat data: ${err.message}</div>
      `;
    }
  },

  addRow: () => {
    App.toast('info', 'Fitur tambah baris dalam pengembangan.');
  },

  editRow: (rowIndex) => {
    App.toast('info', `Edit baris ke-${rowIndex} dalam pengembangan.`);
  },

  deleteRow: async (rowIndex) => {
    if(!confirm('Hapus baris data ini?')) return;
    App.showLoading('Menghapus data...');
    try {
      const res = await API.master.deleteRow(MasterPage.currentTable, rowIndex);
      if (res.success) {
        App.toast('success', res.message);
        MasterPage.loadData();
      } else {
        App.toast('error', res.message);
      }
    } catch (err) {
      App.toast('error', err.message);
    } finally {
      App.hideLoading();
    }
  }
};
