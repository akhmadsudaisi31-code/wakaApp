/**
 * dashboard.js — Halaman Dashboard & Beranda
 */

const DashboardPage = (() => {

  function render(container, user) {
    container.innerHTML = `
      <div class="page-header">
        <h2>Selamat Datang, ${user.nama.split(' ')[0]}! 👋</h2>
        <p>${_getRoleLabel(user.role)} — ${CONFIG.NAMA_SEKOLAH}</p>
      </div>

      <!-- Stat Cards Skeleton -->
      <div class="stats-grid" id="stats-grid">
        ${[1,2,3,4].map(() => `<div class="skeleton skeleton-card" style="height:120px;"></div>`).join('')}
      </div>

      ${user.role === 'waka' || user.role === 'kepsek' ? `
      <!-- Tabel Kepatuhan -->
      <div class="card" id="compliance-card" style="display:none;">
        <div class="card-header">
          <div class="card-title">
            <i class="fa-solid fa-chart-bar"></i> Kepatuhan E-Jurnal (7 Hari Terakhir)
          </div>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Nama Guru</th>
                <th>Masuk / Target</th>
                <th>Persentase</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody id="compliance-table-body">
              <tr><td colspan="5" style="text-align:center; padding:20px;">Memuat data...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}

      <!-- Quick Actions -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <i class="fa-solid fa-bolt"></i> Aksi Cepat
          </div>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px,1fr)); gap:12px;">
          ${_getQuickActions(user.role)}
        </div>
      </div>
    `;

    _loadData(user);
  }

  async function _loadData(user) {
    try {
      const res = await API.dashboard.getData();
      if (!res.success) throw new Error(res.message);

      const data = res.data;
      _renderStats(data, user);
      if ((user.role === 'waka' || user.role === 'kepsek') && data.globalStats) {
        _renderComplianceTable(data.globalStats);
        document.getElementById('compliance-card').style.display = 'block';
      }

    } catch (err) {
      document.getElementById('stats-grid').innerHTML = `
        <div class="alert alert-danger" style="grid-column:1/-1;">
          <i class="fa-solid fa-circle-exclamation"></i>
          <span>Gagal memuat data dashboard: ${err.message}</span>
        </div>
      `;
    }
  }

  function _renderStats(data, user) {
    const statsGrid = document.getElementById('stats-grid');
    const { guruStats, globalStats, role } = data;

    let cards = [];

    // Hari & Tanggal
    cards.push({ type: 'primary', icon: 'fa-calendar-day', value: _getDayName(), label: new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' }) });

    if (guruStats) {
      const pClass = guruStats.persen >= 80 ? 'success' : guruStats.persen >= 50 ? 'warning' : 'danger';
      cards.push({ type: pClass, icon: 'fa-book-open', value: `${guruStats.persen}%`, label: `Jurnal Saya (${guruStats.jurnalMasuk}/${guruStats.targetJurnal} minggu ini)` });
    }

    if (globalStats) {
      const pClass = globalStats.persenAll >= 80 ? 'success' : globalStats.persenAll >= 50 ? 'warning' : 'danger';
      cards.push({ type: pClass, icon: 'fa-users', value: `${globalStats.persenAll}%`, label: `Kepatuhan Sekolah (${globalStats.totalJurnalAll}/${globalStats.totalTargetAll})` });
      cards.push({ type: globalStats.kepatuhanRendah.length === 0 ? 'success' : 'danger', icon: 'fa-triangle-exclamation', value: globalStats.kepatuhanRendah.length, label: 'Guru Kepatuhan < 80%' });
    }

    if (cards.length === 0) {
      cards.push({ type: 'success', icon: 'fa-circle-check', value: '✓', label: 'Sistem berjalan normal' });
    }

    statsGrid.innerHTML = cards.map(c => `
      <div class="stat-card ${c.type}">
        <div class="stat-icon"><i class="fa-solid ${c.icon}"></i></div>
        <div class="stat-value">${c.value}</div>
        <div class="stat-label">${c.label}</div>
      </div>
    `).join('');

    // Progress bar untuk jurnal guru
    if (guruStats) {
      const pClass = guruStats.persen >= 80 ? 'success' : guruStats.persen >= 50 ? 'warning' : 'danger';
      const statCards = statsGrid.querySelectorAll('.stat-card');
      if (statCards[1]) {
        statCards[1].innerHTML += `
          <div class="progress-wrap">
            <div class="progress-bar">
              <div class="progress-fill ${pClass}" style="width:${Math.min(guruStats.persen,100)}%"></div>
            </div>
          </div>
        `;
      }
    }
  }

  function _renderComplianceTable(globalStats) {
    const tbody = document.getElementById('compliance-table-body');
    const { kepatuhanRendah } = globalStats;

    if (kepatuhanRendah.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <i class="fa-solid fa-circle-check" style="color:var(--success);"></i>
              <p>Semua guru memiliki kepatuhan ≥ 80% 👍</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = kepatuhanRendah.map(row => {
      const pClass = row.persen >= 50 ? 'warning' : 'danger';
      let waBtn = '';
      if (row.no_wa) {
        let noWa = String(row.no_wa).replace(/[^0-9]/g, '');
        if (noWa.startsWith('0')) noWa = '62' + noWa.substring(1);
        const msg = `Halo Bapak/Ibu ${row.nama}, mohon segera mengisi E-Jurnal untuk minggu ini. Terima kasih.`;
        waBtn = `<a class="btn-wa" href="https://wa.me/${noWa}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> Chat WA</a>`;
      }
      return `
        <tr>
          <td>
            <strong>${row.nama}</strong><br>
            ${waBtn}
          </td>
          <td>${row.masuk} / ${row.target}</td>
          <td>
            <div class="progress-wrap" style="margin:0;">
              <div class="progress-label">
                <span></span><span style="color:var(--${pClass}); font-weight:700;">${row.persen}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill ${pClass}" style="width:${row.persen}%"></div>
              </div>
            </div>
          </td>
          <td><span class="badge badge-${pClass}">Perhatian</span></td>
          <td><span class="badge badge-muted">Detail</span></td>
        </tr>
      `;
    }).join('');
  }

  function _getQuickActions(role) {
    const actions = [];
    if (role === 'guru' || role === 'waka') {
      actions.push({ page: 'absen',   icon: 'fa-camera-retro', label: 'Absen Sekarang', color: 'var(--success)' });
      actions.push({ page: 'jurnal',  icon: 'fa-book-open',    label: 'Isi E-Jurnal',  color: 'var(--primary)' });
      actions.push({ page: 'jadwal',  icon: 'fa-calendar-day', label: 'Lihat Jadwal',  color: 'var(--info)'    });
    }
    actions.push({ page: 'perangkat', icon: 'fa-folder-open',  label: 'Perangkat Ajar', color: 'var(--warning)' });

    return actions.map(a => `
      <button class="btn btn-ghost" onclick="App.navigateTo('${a.page}')" style="flex-direction:column; padding:16px; border:1.5px solid var(--border); border-radius:var(--radius-lg); height:auto; gap:8px; transition:all 0.2s;" onmouseover="this.style.borderColor='${a.color}';this.style.background='${a.color}11';" onmouseout="this.style.borderColor='var(--border)';this.style.background='transparent';">
        <i class="fa-solid ${a.icon}" style="font-size:1.5rem; color:${a.color};"></i>
        <span style="font-size:0.8rem; color:var(--text-secondary);">${a.label}</span>
      </button>
    `).join('');
  }

  function _getRoleLabel(role) {
    return { guru: 'Guru', waka: 'Waka Kurikulum', kepsek: 'Kepala Sekolah' }[role] || role;
  }

  function _getDayName() {
    return new Date().toLocaleDateString('id-ID', { weekday: 'long' });
  }

  function destroy() {}

  return { render, destroy };
})();
