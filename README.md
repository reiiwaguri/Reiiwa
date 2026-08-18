# Sisi Otaku CMS

Website anime dengan:
- Halaman publik
- Login owner via Supabase Auth
- Dashboard admin
- Upload gambar ke Supabase Storage
- CRUD berita
- Jadwal anime dari AniList
- Responsif untuk HP

## 1. Buat project Supabase
Buat project di Supabase, lalu buka SQL Editor dan jalankan `supabase.sql`.

## 2. Buat akun owner
Di Supabase: Authentication > Users > Add user.
Setelah user dibuat, masukkan UUID user ke tabel `profiles` sebagai role `owner`.
Contoh:
insert into public.profiles (id, role) values ('UUID_USER', 'owner');

## 3. Storage
SQL sudah membuat bucket `news-images` dan policy upload untuk owner.

## 4. Konfigurasi website
Edit `config.js`:
SUPABASE_URL = URL project Supabase
SUPABASE_ANON_KEY = anon/public key

Jangan masukkan service_role key ke website.

## 5. Jalankan
Bisa langsung dibuka sebagai website statis setelah di-host. Untuk local testing gunakan server lokal, bukan file://.

## 6. Deploy Vercel
Upload repository ini ke GitHub, lalu import repository ke Vercel.
Tidak membutuhkan build command karena website memakai HTML/CSS/JS.

## 7. Login
Buka `/admin/` atau tombol Admin di halaman utama.
Hanya akun yang ada di `profiles` dengan role `owner` yang bisa mengelola berita.

## Catatan
Jadwal publik diambil dari AniList GraphQL saat halaman jadwal dibuka. Data jadwal dapat berubah sesuai data AniList.
