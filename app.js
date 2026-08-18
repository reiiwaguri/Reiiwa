const { createClient } = supabase;
const db = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

const newsGrid = document.getElementById("newsGrid");

function esc(v="") {
  return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function fmtDate(v) {
  return new Date(v).toLocaleDateString("id-ID", {day:"numeric",month:"long",year:"numeric"});
}

async function loadNews() {
  newsGrid.innerHTML = '<div class="loading">Memuat berita...</div>';
  const { data, error } = await db.from("news").select("*").order("published_at",{ascending:false});
  if (error) {
    newsGrid.innerHTML = `<div class="error">${esc(error.message)}</div>`;
    return;
  }
  if (!data.length) {
    newsGrid.innerHTML = '<div class="empty">Belum ada berita.</div>';
    return;
  }
  newsGrid.innerHTML = data.map(n => `
    <article class="card">
      ${n.image_url ? `<img src="${esc(n.image_url)}" alt="${esc(n.title)}" loading="lazy">` : '<div class="no-image">SISI OTAKU</div>'}
      <div class="card-body">
        <small>${fmtDate(n.published_at)}</small>
        <h3>${esc(n.title)}</h3>
        <p>${esc(n.excerpt || "")}</p>
        <button class="read" data-id="${n.id}">Baca selengkapnya</button>
      </div>
    </article>
  `).join("");
  document.querySelectorAll(".read").forEach(b => b.addEventListener("click", async () => {
    const item = data.find(x => x.id === b.dataset.id);
    alert(`${item.title}\n\n${item.content || item.excerpt || "Tidak ada isi."}`);
  }));
}

async function loadSchedule() {
  const box = document.getElementById("scheduleGrid");
  box.innerHTML = '<div class="loading">Mengambil jadwal dari AniList...</div>';
  const start = Math.floor(Date.now()/1000);
  const end = start + 7*24*60*60;
  const query = `query { Page(perPage: 50) { airingSchedules(airingAt_greater:${start}, airingAt_lesser:${end}) { airingAt episode media { id title { romaji english native } coverImage { large } } } } }`;
  try {
    const r = await fetch("https://graphql.anilist.co", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({query})
    });
    const j = await r.json();
    const rows = j.data?.Page?.airingSchedules || [];
    if (!rows.length) { box.innerHTML='<div class="empty">Tidak ada jadwal dalam 7 hari berikutnya.</div>'; return; }
    box.innerHTML = rows.sort((a,b)=>a.airingAt-b.airingAt).map(x => {
      const d = new Date(x.airingAt*1000);
      const title = x.media.title.english || x.media.title.romaji || x.media.title.native;
      return `<div class="schedule-row">
        <img src="${esc(x.media.coverImage?.large || "")}" alt="">
        <div><b>${esc(title)}</b><small>Episode ${x.episode} · ${d.toLocaleString("id-ID",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</small></div>
      </div>`;
    }).join("");
  } catch(e) { box.innerHTML='<div class="error">Gagal mengambil jadwal. Coba lagi nanti.</div>'; }
}

document.getElementById("refreshNews").onclick = loadNews;
document.getElementById("loadSchedule").onclick = loadSchedule;
loadNews();
