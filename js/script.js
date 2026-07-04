// ── DATA LAYER (localStorage) ──
function getData() {
    const raw = localStorage.getItem('sipusta_data');
    return raw ? JSON.parse(raw) : [];
}

function saveData(data) {
    localStorage.setItem('sipusta_data', JSON.stringify(data));
}

// ── HELPERS ──
function formatTanggal(dateStr) {
    if (!dateStr) return "-";
    const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const d = new Date(dateStr);
    return d.getDate() + ' ' + bulan[d.getMonth()] + ' ' + d.getFullYear();
}

// ── FORM HANDLING ──
function initForm() {
    const form = document.getElementById('formPengajuan');
    if (!form) return; // Hentikan jika bukan di halaman layanan.html

    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    let editMode = false;

    if (editId) {
        const data = getData();
        const itemToEdit = data.find(function(item) { return item.id == editId; });
        if (itemToEdit) {
            editMode = true;
            document.getElementById('nama').value = itemToEdit.nama || '';
            document.getElementById('buku').value = itemToEdit.buku || '';
            
            const prodiEl = document.getElementById('prodi');
            if (prodiEl && itemToEdit.prodi) prodiEl.value = itemToEdit.prodi;
            
            const layananEl = document.getElementById('layanan');
            if (layananEl && itemToEdit.layanan) layananEl.value = itemToEdit.layanan;
            
            document.getElementById('tanggal').value = itemToEdit.tanggal || '';
            document.getElementById('keterangan').value = itemToEdit.keterangan || '';
            
            const btnSubmit = form.querySelector('button[type="submit"]');
            if (btnSubmit) btnSubmit.innerHTML = '✏️ Simpan Perubahan';
        }
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault(); 
        
        const nama = document.getElementById('nama').value.trim();
        const buku = document.getElementById('buku').value;
        const prodi = document.getElementById('prodi').value;
        const layanan = document.getElementById('layanan').value;
        const tanggal = document.getElementById('tanggal').value;
        const keterangan = document.getElementById('keterangan').value.trim();
        
        const errorEl = document.getElementById('formError');
        errorEl.textContent = '';
        
        // Validasi isian kosong (buku dan keterangan opsional)
        if (!nama || !prodi || !layanan || !tanggal) {
            errorEl.textContent = '❌ Semua field wajib (kecuali Judul Buku & Keterangan) harus diisi!';
            return; 
        }
        
        const data = getData();
        
        if (editMode) {
            // Update mode
            for (let i = 0; i < data.length; i++) {
                if (data[i].id == editId) {
                    data[i].nama = nama;
                    data[i].buku = buku;
                    data[i].prodi = prodi;
                    data[i].layanan = layanan;
                    data[i].tanggal = tanggal;
                    data[i].keterangan = keterangan;
                    break;
                }
            }
        } else {
            // Create mode
            const item = {
                id: Date.now(), 
                nama: nama,
                buku: buku,
                prodi: prodi,
                layanan: layanan,
                tanggal: tanggal,
                keterangan: keterangan
            };
            data.push(item); 
        }
        
        saveData(data);
        
        form.reset();
        errorEl.textContent = '';
        alert(editMode ? '✅ Perubahan berhasil disimpan!' : '✅ Pengajuan berhasil disimpan!');
        window.location.href = 'riwayat.html'; 
    });
}

// ── TABEL RIWAYAT ──
function initRiwayat() {
    const tbody = document.getElementById('tableBody');
    const emptyState = document.getElementById('emptyState');
    const dataCount = document.getElementById('dataCount');
    const btnHapusSemua = document.getElementById('btnHapusSemua');
    
    if (!tbody) return; // Hentikan jika bukan di halaman riwayat.html

    if (btnHapusSemua) {
        btnHapusSemua.addEventListener('click', function () {
            if (confirm('Apakah Anda yakin ingin menghapus seluruh riwayat pengajuan?')) {
                saveData([]);  
                renderTable(); 
            }
        });
    }

    function renderTable() {
        const data = getData();
        
        if (dataCount) {
            dataCount.textContent = data.length + ' pengajuan';
        }
        
        if (data.length === 0) {
            tbody.innerHTML = ''; 
            if (emptyState) emptyState.style.display = 'block';
            if (btnHapusSemua) btnHapusSemua.style.display = 'none';
            return; 
        }
        
        if (emptyState) emptyState.style.display = 'none';
        if (btnHapusSemua) btnHapusSemua.style.display = 'inline-block';
        
        tbody.innerHTML = '';
        
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            const tr = document.createElement('tr'); 
            
            tr.innerHTML =
                '<td>' + (i + 1) + '</td>' +
                '<td>' + item.nama + '</td>' +
                '<td>' + (item.buku || '-') + '</td>' +
                '<td>' + item.layanan + '</td>' +
                '<td>' + formatTanggal(item.tanggal) + '</td>' +
                '<td>' +
                    '<button class="btn-edit" data-id="' + item.id + '">✏️ Edit</button> ' +
                    '<button class="btn-hapus" data-id="' + item.id + '">🗑 Hapus</button>' +
                '</td>';
                
            tbody.appendChild(tr); 
        }
        
        // Listener Update tombol EDIT
        const btnEdit = document.querySelectorAll('.btn-edit');
        btnEdit.forEach(function (btn) {
            btn.addEventListener('click', function () {
                const id = this.getAttribute('data-id'); 
                window.location.href = 'layanan.html?edit=' + id; 
            });
        });
        
        // Listener Update tombol HAPUS
        const btnHapus = document.querySelectorAll('.btn-hapus');
        btnHapus.forEach(function (btn) {
            btn.addEventListener('click', function () {
                const id = Number(this.getAttribute('data-id')); 
                if (confirm('Hapus pengajuan riwayat ini selamanya?')) {
                    let data = getData();
                    data = data.filter(function (item) {
                        return item.id !== id;
                    });
                    saveData(data); 
                    renderTable(); 
                }
            });
        });
    }

    renderTable();
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', function () {
    initForm();
    initRiwayat();
});