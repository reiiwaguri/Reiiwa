const {createClient}=supabase;
const db=createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
const loginBox=document.getElementById("loginBox"), dashboard=document.getElementById("dashboard");
const editor=document.getElementById("editor"), form=document.getElementById("newsForm");
let currentUser=null, newsCache=[];

const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function localDateTime(v){const d=new Date(v||Date.now());d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16)}

async function isOwner(){
 const {data,error}=await db.from("profiles").select("role").eq("id",currentUser.id).maybeSingle();
 return !error && data?.role==="owner";
}
async function start(){
 const {data}=await db.auth.getSession();
 if(!data.session){showLogin();return}
 currentUser=data.session.user;
 if(!(await isOwner())){await db.auth.signOut();document.getElementById("loginMsg").textContent="Akun ini bukan owner.";showLogin();return}
 loginBox.hidden=true;dashboard.hidden=false;document.getElementById("logout").style.display="block";loadAdminNews();
}
function showLogin(){loginBox.hidden=false;dashboard.hidden=true;document.getElementById("logout").style.display="none"}

document.getElementById("loginForm").addEventListener("submit",async e=>{
 e.preventDefault();document.getElementById("loginMsg").textContent="Memeriksa...";
 const {error}=await db.auth.signInWithPassword({email:email.value,password:password.value});
 if(error){document.getElementById("loginMsg").textContent=error.message;return}
 start();
});
document.getElementById("logout").onclick=async()=>{await db.auth.signOut();location.reload()};

async function loadAdminNews(){
 const {data,error}=await db.from("news").select("*").order("published_at",{ascending:false});
 if(error){document.getElementById("adminNews").innerHTML=`<p class="error">${esc(error.message)}</p>`;return}
 newsCache=data||[];document.getElementById("countNews").textContent=newsCache.length;
 document.getElementById("adminNews").innerHTML=newsCache.length?newsCache.map(n=>`
 <div class="admin-item">
 ${n.image_url?`<img src="${esc(n.image_url)}" alt="">`:""}
 <div><h3>${esc(n.title)}</h3><small>${new Date(n.published_at).toLocaleString("id-ID")}</small></div>
 <div class="item-actions"><button data-edit="${n.id}">Edit</button><button class="danger" data-delete="${n.id}">Hapus</button></div>
 </div>`).join(""):"<p class='empty'>Belum ada berita.</p>";
 document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editNews(b.dataset.edit));
 document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteNews(b.dataset.delete));
}
function resetEditor(){form.reset();document.getElementById("newsId").value="";document.getElementById("publishedAt").value=localDateTime();document.getElementById("preview").hidden=true;document.getElementById("formMsg").textContent="";editor.hidden=false;document.getElementById("editorTitle").textContent="Berita Baru"}
document.getElementById("newBtn").onclick=resetEditor;
document.getElementById("cancelBtn").onclick=()=>editor.hidden=true;

function editNews(id){
 const n=newsCache.find(x=>x.id===id);if(!n)return;
 resetEditor();document.getElementById("editorTitle").textContent="Edit Berita";
 document.getElementById("newsId").value=n.id;document.getElementById("title").value=n.title;
 document.getElementById("excerpt").value=n.excerpt||"";document.getElementById("content").value=n.content||"";
 document.getElementById("publishedAt").value=localDateTime(n.published_at);
 if(n.image_url){const p=document.getElementById("preview");p.src=n.image_url;p.hidden=false}
 window.scrollTo({top:document.getElementById("editor").offsetTop-80,behavior:"smooth"});
}
async function deleteNews(id){
 if(!confirm("Hapus berita ini?"))return;
 const {error}=await db.from("news").delete().eq("id",id);
 if(error)alert(error.message);else loadAdminNews();
}
form.addEventListener("submit",async e=>{
 e.preventDefault();const msg=document.getElementById("formMsg");msg.textContent="Menyimpan...";
 const id=document.getElementById("newsId").value;let imageUrl=newsCache.find(n=>n.id===id)?.image_url||null;
 const file=document.getElementById("image").files[0];
 if(file){
   const ext=(file.name.split(".").pop()||"jpg").toLowerCase();
   const path=`${currentUser.id}/${crypto.randomUUID()}.${ext}`;
   const up=await db.storage.from("news-images").upload(path,file,{upsert:false});
   if(up.error){msg.textContent=up.error.message;return}
   imageUrl=db.storage.from("news-images").getPublicUrl(path).data.publicUrl;
 }
 const payload={title:document.getElementById("title").value.trim(),excerpt:document.getElementById("excerpt").value.trim(),content:document.getElementById("content").value.trim(),image_url:imageUrl,published_at:new Date(document.getElementById("publishedAt").value).toISOString()};
 const result=id?await db.from("news").update(payload).eq("id",id):await db.from("news").insert(payload);
 if(result.error){msg.textContent=result.error.message;return}
 editor.hidden=true;loadAdminNews();
});
start();
