/*=============================================================================
 * SiPusta - Core Logic
 * Menangani interaksi localStorage dan rendering UI untuk sistem perpustakaan.
=============================================================================== */

const STORAGE_KEY = 'sipusta_library_records';

// --- Storage Utilities ---
const fetchLibraryRecords = () => {
    const records = localStorage.getItem(STORAGE_KEY);
    return records ? JSON.parse(records) : [];
};

const storeLibraryRecords = (dataList) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataList));
};

const formatIndoDate = (dateString) => {
    if (!dateString) return "-";
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const dateObj = new Date(dateString);
    return `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
};

// --- Custom UI Notifications ---
const showToastNotification = (message) => {
    let toastEl = document.getElementById('sipustaToast');
    if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.id = 'sipustaToast';
        toastEl.className = 'sipusta-toast';
        document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = `<span>✅</span> <div>${message}</div>`;
    
    // Trigger animation
    setTimeout(() => toastEl.classList.add('show'), 10);
    
    // Hide after 3 seconds
    setTimeout(() => {
        toastEl.classList.remove('show');
    }, 3000);
};

const showConfirmationModal = (title, text, onConfirm) => {
    let overlay = document.getElementById('sipustaModalOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sipustaModalOverlay';
        overlay.className = 'sipusta-modal-overlay';
        overlay.innerHTML = `
            <div class="sipusta-modal">
                <h3 id="sipustaModalTitle"></h3>
                <p id="sipustaModalText"></p>
                <div class="sipusta-modal-actions form-actions" style="margin-top: 16px;">
                    <button id="sipustaModalCancel" class="btn btn-outline" style="padding: 10px 20px;">Batal</button>
                    <button id="sipustaModalConfirm" class="btn btn-primary" style="padding: 10px 20px; background: #ef4444; box-shadow: none;">Hapus</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    document.getElementById('sipustaModalTitle').textContent = title;
    document.getElementById('sipustaModalText').textContent = text;
    
    const btnCancel = document.getElementById('sipustaModalCancel');
    const btnConfirm = document.getElementById('sipustaModalConfirm');
    
    // Clean up previous listeners
    const newBtnConfirm = btnConfirm.cloneNode(true);
    const newBtnCancel = btnCancel.cloneNode(true);
    btnConfirm.parentNode.replaceChild(newBtnConfirm, btnConfirm);
    btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
    
    newBtnCancel.addEventListener('click', () => {
        overlay.classList.remove('active');
    });
    
    newBtnConfirm.addEventListener('click', () => {
        overlay.classList.remove('active');
        onConfirm();
    });
    
    overlay.classList.add('active');
};


// --- Form Submission Logic ---
const setupSubmissionForm = () => {
    const submissionForm = document.getElementById('formPengajuan');
    if (!submissionForm) return;

    const queryParams = new URLSearchParams(window.location.search);
    const activeEditId = queryParams.get('edit');
    let isEditing = false;

    if (activeEditId) {
        const records = fetchLibraryRecords();
        const targetRecord = records.find(r => r.id == activeEditId);
        
        if (targetRecord) {
            isEditing = true;
            document.getElementById('nama').value = targetRecord.nama || '';
            document.getElementById('buku').value = targetRecord.buku || '';
            
            const categorySelect = document.getElementById('prodi');
            if (categorySelect && targetRecord.prodi) categorySelect.value = targetRecord.prodi;
            
            const serviceSelect = document.getElementById('layanan');
            if (serviceSelect && targetRecord.layanan) serviceSelect.value = targetRecord.layanan;
            
            document.getElementById('tanggal').value = targetRecord.tanggal || '';
            document.getElementById('keterangan').value = targetRecord.keterangan || '';
            
            const submitButton = submissionForm.querySelector('button[type="submit"]');
            if (submitButton) submitButton.innerHTML = '✏️ Simpan Pembaruan';
        }
    }

    submissionForm.addEventListener('submit', (event) => {
        event.preventDefault(); 
        
        const payload = {
            nama: document.getElementById('nama').value.trim(),
            buku: document.getElementById('buku').value,
            prodi: document.getElementById('prodi').value,
            layanan: document.getElementById('layanan').value,
            tanggal: document.getElementById('tanggal').value,
            keterangan: document.getElementById('keterangan').value.trim()
        };
        
        const errorContainer = document.getElementById('formError');
        errorContainer.textContent = '';
        
        if (!payload.nama || !payload.prodi || !payload.layanan || !payload.tanggal) {
            errorContainer.textContent = '❌ Mohon lengkapi semua field yang diwajibkan!';
            return; 
        }
        
        let existingRecords = fetchLibraryRecords();
        
        if (isEditing) {
            existingRecords = existingRecords.map(record => 
                record.id == activeEditId ? { ...record, ...payload } : record
            );
        } else {
            existingRecords.push({
                id: Date.now(),
                ...payload
            });
        }
        
        storeLibraryRecords(existingRecords);
        submissionForm.reset();
        
        showToastNotification(isEditing ? 'Data berhasil diperbarui!' : 'Pengajuan berhasil dikirim!');
        
        // Delay redirect to allow toast to be seen briefly
        setTimeout(() => {
            window.location.href = 'riwayat.html';
        }, 1200);
    });
};

// --- History Table Logic ---
const setupHistoryTable = () => {
    const tableBody = document.getElementById('tableBody');
    const noDataView = document.getElementById('emptyState');
    const counterText = document.getElementById('dataCount');
    const clearAllBtn = document.getElementById('btnHapusSemua');
    
    if (!tableBody) return;

    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            showConfirmationModal(
                'Hapus Semua Riwayat?', 
                'Tindakan ini akan menghapus seluruh data pengajuan Anda secara permanen.', 
                () => {
                    storeLibraryRecords([]);  
                    populateTableUI(); 
                    showToastNotification('Seluruh riwayat berhasil dihapus.');
                }
            );
        });
    }

    const populateTableUI = () => {
        const records = fetchLibraryRecords();
        
        if (counterText) {
            counterText.textContent = `${records.length} pengajuan ditemukan`;
        }
        
        if (records.length === 0) {
            tableBody.innerHTML = ''; 
            if (noDataView) noDataView.style.display = 'block';
            if (clearAllBtn) clearAllBtn.style.display = 'none';
            return; 
        }
        
        if (noDataView) noDataView.style.display = 'none';
        if (clearAllBtn) clearAllBtn.style.display = 'inline-block';
        
        tableBody.innerHTML = '';
        
        records.forEach((record, index) => {
            const tableRow = document.createElement('tr'); 
            
            tableRow.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${record.nama}</strong></td>
                <td>${record.buku || '-'}</td>
                <td><span style="background: #ede0d4; padding: 4px 8px; border-radius: 4px; font-size: 0.85em; font-weight: bold; color: #7f4f24;">${record.layanan}</span></td>
                <td>${formatIndoDate(record.tanggal)}</td>
                <td>
                    <button class="btn-edit-record" data-id="${record.id}">Edit</button>
                    <button class="btn-delete-record" data-id="${record.id}">Hapus</button>
                </td>
            `;
            tableBody.appendChild(tableRow); 
        });
        
        attachTableActionListeners();
    };

    const attachTableActionListeners = () => {
        document.querySelectorAll('.btn-edit-record').forEach(btn => {
            btn.addEventListener('click', function () {
                const targetId = this.getAttribute('data-id'); 
                window.location.href = `layanan.html?edit=${targetId}`; 
            });
        });
        
        document.querySelectorAll('.btn-delete-record').forEach(btn => {
            btn.addEventListener('click', function () {
                const targetId = Number(this.getAttribute('data-id')); 
                showConfirmationModal(
                    'Hapus Pengajuan?',
                    'Apakah Anda yakin ingin menghapus data pengajuan ini?',
                    () => {
                        let records = fetchLibraryRecords();
                        records = records.filter(r => r.id !== targetId);
                        storeLibraryRecords(records); 
                        populateTableUI(); 
                        showToastNotification('Data pengajuan dihapus.');
                    }
                );
            });
        });
    };

    populateTableUI();
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    setupSubmissionForm();
    setupHistoryTable();
});