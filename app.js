// GANTI DENGAN URL DAN KEY SUPABASE ANDA
const SUPABASE_URL = 'https://gsgovshbokckiqkfmrjy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZ292c2hib2tja2lxa2Ztcmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2ODA0NzIsImV4cCI6MjEwOTI1NjQ3Mn0.LCKyoh8CpfH_IcuAg2QgG1tJH755L8MBLLb2fF6er4c';
const ADMIN_EMAIL = 'admin@sekolah.com'; // Sesuaikan dengan email admin Anda

// PERBAIKAN: Menggunakan nama 'supabaseClient' agar tidak bentrok dengan library bawaan
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUser = null;

// Cek Sesi Login saat halaman dimuat
window.onload = async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        showDashboard();
    }
};

// Fungsi Login
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('hidden');
    } else {
        currentUser = data.user;
        showDashboard();
    }
}

// Fungsi Logout
async function logout() {
    await supabaseClient.auth.signOut();
    currentUser = null;
    window.location.reload();
}

// Manajemen Tampilan Berdasarkan Role
function showDashboard() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('navbar').classList.remove('hidden');
    document.getElementById('dashboardSection').classList.remove('hidden');
    document.getElementById('userEmail').textContent = currentUser.email;

    // Tampilkan panel admin jika email cocok
    if (currentUser.email === ADMIN_EMAIL) {
        document.getElementById('adminPanel').classList.remove('hidden');
        document.querySelectorAll('.admin-action').forEach(el => el.classList.remove('hidden'));
    }

    fetchStudents();
}

// Mengambil Data dari Supabase
async function fetchStudents() {
    const { data: students, error } = await supabaseClient.from('students').select('*').order('created_at', { ascending: false });
    
    if (error) return console.error('Error fetching data:', error);

    const tbody = document.getElementById('studentTableBody');
    tbody.innerHTML = '';

    students.forEach(student => {
        const isAdmin = currentUser.email === ADMIN_EMAIL;
        const actionButtons = isAdmin ? `
            <td class="p-3 border text-center">
                <button onclick="editStudent('${student.id}', '${student.nis}', '${student.nama}', '${student.kelas}')" class="text-blue-500 hover:underline mr-2">Edit</button>
                <button onclick="deleteStudent('${student.id}')" class="text-red-500 hover:underline">Hapus</button>
            </td>
        ` : '';

        const row = `
            <tr class="hover:bg-gray-50">
                <td class="p-3 border">${student.nis}</td>
                <td class="p-3 border">${student.nama}</td>
                <td class="p-3 border">${student.kelas}</td>
                ${actionButtons}
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// Tambah / Update Data
async function handleSaveData(e) {
    e.preventDefault();
    const id = document.getElementById('studentId').value;
    const nis = document.getElementById('nis').value;
    const nama = document.getElementById('nama').value;
    const kelas = document.getElementById('kelas').value;

    if (id) {
        // Mode Update
        await supabaseClient.from('students').update({ nis, nama, kelas }).eq('id', id);
    } else {
        // Mode Insert
        await supabaseClient.from('students').insert([{ nis, nama, kelas }]);
    }

    document.getElementById('studentForm').reset();
    document.getElementById('studentId').value = '';
    document.getElementById('formTitle').textContent = 'Tambah Data Siswa';
    fetchStudents();
}

// Isi Form untuk Edit
function editStudent(id, nis, nama, kelas) {
    document.getElementById('studentId').value = id;
    document.getElementById('nis').value = nis;
    document.getElementById('nama').value = nama;
    document.getElementById('kelas').value = kelas;
    document.getElementById('formTitle').textContent = 'Edit Data Siswa';
}

// Hapus Data
async function deleteStudent(id) {
    if(confirm('Yakin ingin menghapus data ini?')) {
        await supabaseClient.from('students').delete().eq('id', id);
        fetchStudents();
    }
}
