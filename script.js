/* ===== EDIT THESE ===== */
const CONFIG = {
  cloudName:    "pwkemb7p",      // from your Cloudinary dashboard
  uploadPreset: "fyb_upload",   // unsigned preset (adds the pending tag)
  approvedTag:  "daudaibrahim",    // tag you add to approve a photo. Make it unusual.
  className:    "History and International Studies",
  details:      "FYB gallery, Northwest University, Kano",
  year:         "2026"
};
/* ====================== */

document.getElementById("title").textContent = CONFIG.className;
document.getElementById("sub").textContent = CONFIG.details;
document.getElementById("year").textContent = "Class of " + CONFIG.year;

const grid = document.getElementById("grid");
const empty = document.getElementById("empty");
const statusEl = document.getElementById("status");
let photos = [], current = 0;

const thumb = p => `https://res.cloudinary.com/${CONFIG.cloudName}/image/upload/f_auto,q_auto,w_600/v${p.version}/${p.public_id}`;
const full  = p => `https://res.cloudinary.com/${CONFIG.cloudName}/image/upload/f_auto,q_auto,w_1600/v${p.version}/${p.public_id}`;

async function loadGallery() {
  try {
    const r = await fetch(`https://res.cloudinary.com/${CONFIG.cloudName}/image/list/${CONFIG.approvedTag}.json?t=${Date.now()}`);
    if (!r.ok) throw new Error();
    photos = (await r.json()).resources.reverse();
  } catch { photos = []; }
  grid.innerHTML = "";
  empty.hidden = photos.length > 0;
  photos.forEach((p, i) => {
    const b = document.createElement("button");
    const img = document.createElement("img");
    img.src = thumb(p); img.loading = "lazy"; img.alt = "Class photo " + (i + 1);
    img.width = p.width; img.height = p.height;
    b.appendChild(img);
    b.onclick = () => openBox(i);
    grid.appendChild(b);
  });
}

/* shrink big phone photos before upload to save data */
function shrink(file, max = 2000) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = img.width * s; c.height = img.height * s;
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => res(b || file), "image/jpeg", 0.85);
    };
    img.onerror = () => res(file);
    img.src = URL.createObjectURL(file);
  });
}

document.getElementById("file").addEventListener("change", async e => {
  const files = [...e.target.files];
  let done = 0, failed = 0;
  for (const f of files) {
    statusEl.textContent = `Uploading ${done + failed + 1} of ${files.length}...`;
    try {
      const body = new FormData();
      body.append("file", await shrink(f));
      body.append("upload_preset", CONFIG.uploadPreset);
      const r = await fetch(`https://api.cloudinary.com/v1_1/${CONFIG.cloudName}/image/upload`, { method: "POST", body });
      if (!r.ok) throw new Error();
      done++;
    } catch { failed++; }
  }
  statusEl.textContent = failed
    ? `${done} uploaded, ${failed} failed. Check your connection and try again.`
    : `Done. ${done} photo${done > 1 ? "s" : ""} sent for approval.`;
  e.target.value = "";
});

/* lightbox */
const box = document.getElementById("lightbox"), big = document.getElementById("big");
function openBox(i){ current = i; big.src = full(photos[i]); box.hidden = false; }
function step(d){ current = (current + d + photos.length) % photos.length; big.src = full(photos[current]); }
document.getElementById("close").onclick = () => box.hidden = true;
document.getElementById("prev").onclick = () => step(-1);
document.getElementById("next").onclick = () => step(1);
box.addEventListener("click", e => { if (e.target === box) box.hidden = true; });
document.addEventListener("keydown", e => {
  if (box.hidden) return;
  if (e.key === "Escape") box.hidden = true;
  if (e.key === "ArrowLeft") step(-1);
  if (e.key === "ArrowRight") step(1);
});

loadGallery();
