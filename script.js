const themeBtn=document.getElementById("themeBtn");
themeBtn.addEventListener("click",()=>{
  document.body.classList.toggle("light");
  themeBtn.textContent=document.body.classList.contains("light")?"☀":"☾";
});
document.querySelectorAll(".read-btn").forEach(btn=>{
  btn.addEventListener("click",()=>alert("Artikel lengkap bisa kamu sambungkan ke halaman berita nanti."));
});
if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}