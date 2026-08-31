const DATA_URL = "./site-data.json";
const MANIFEST_URL = "./projects.json";

let DATA = null;
let lightboxItems = [];
let currentIndex = 0;
let scale = 1;
let translateX = 0;
let translateY = 0;
let dragging = false;
let startX = 0, startY = 0, baseX = 0, baseY = 0;
let pinchStartDistance = 0;
let pinchStartScale = 1;

const $ = (id) => document.getElementById(id);
const esc = (value="") => String(value).replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
}[c]));

// Safe helpers: never throw if an element is missing from the page.
// This keeps the rest of the site working even if one id is out of sync.
function setText(id, value){
  const el = $(id);
  if(!el){ console.warn(`[portfolio] Element #${id} not found in HTML — skipping.`); return; }
  el.textContent = value;
}
function setHTML(id, value){
  const el = $(id);
  if(!el){ console.warn(`[portfolio] Element #${id} not found in HTML — skipping.`); return; }
  el.innerHTML = value;
}
function setAttr(id, attr, value){
  const el = $(id);
  if(!el){ console.warn(`[portfolio] Element #${id} not found in HTML — skipping.`); return; }
  el[attr] = value;
}

function asset(path="") {
  // Keep relative assets working on Vercel/GitHub Pages even when names contain spaces.
  return encodeURI(String(path).replace(/^\.?\//, ""));
}

async function loadJSON(url){
  const res = await fetch(url, {cache:"no-store"});
  if(!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

async function init(){
  try{
    DATA = await loadJSON(DATA_URL);

    try{
      const manifest = await loadJSON(MANIFEST_URL);
      DATA.projects = manifest.projects || [];
      DATA.certificates = manifest.certificates || [];
    }catch(err){
      console.warn("Project manifest unavailable:", err);
      DATA.projects = DATA.projects || [];
      DATA.certificates = DATA.certificates || [];
    }

    const steps = [renderProfile, renderSkills, renderExperience, renderProjects, renderCertificates, renderDocuments, renderEducation, setupNavigation];
    for(const step of steps){
      try{ step(); }
      catch(stepErr){ console.error(`[portfolio] ${step.name} failed:`, stepErr); }
    }
  }catch(err){
    console.error(err);
    const empty = $("projectsEmpty");
    if(empty){
      empty.classList.remove("hidden");
      empty.textContent = "Portfolio data gagal dimuat. Pastikan site-data.json dan projects.json berada di folder utama.";
    }
  }

  try{ setupLightbox(); }catch(err){ console.error("[portfolio] setupLightbox failed:", err); }
  try{ setupMobileMenu(); }catch(err){ console.error("[portfolio] setupMobileMenu failed:", err); }
  try{ setupSidebarCollapse(); }catch(err){ console.error("[portfolio] setupSidebarCollapse failed:", err); }
}

function renderProfile(){
  const p = DATA.profile || {};
  setText("profileName", p.name || "");
  setText("profileHeadline", p.headline || "");
  setText("profileAbout", p.about || "");
  setText("aboutText", p.about || "");
  setText("university", p.university || "");
  setText("education", p.education || "");
  setText("educationPeriod", p.education_period ? `📅 ${p.education_period}` : "");
  setText("gpa", p.gpa || "");
  setText("thesis", p.thesis || "");

  if(p.whatsapp) setAttr("whatsappLink", "href", `https://wa.me/${String(p.whatsapp).replace(/\D/g,"")}`);
  if(p.email) setAttr("emailLink", "href", `mailto:${p.email}`);
  if(p.linkedin) setAttr("linkedinLink", "href", p.linkedin);
  if(p.github) setAttr("githubLink", "href", p.github);

  // Explicitly make profile image resilient.
  const profile = $("profileImage");
  if(profile){
    profile.src = asset("assets/profile.jpg");
    profile.addEventListener("error", () => {
      profile.style.display = "none";
      const fb = $("profileFallback");
      if(fb) fb.style.display = "grid";
    }, {once:true});
  }
}

function renderSkills(){
  setHTML("skills", (DATA.skills || []).map(s => `<span class="chip">${esc(s)}</span>`).join(""));
  setHTML("personalSkills", (DATA.personalSkills || []).map(s => `<span class="chip">${esc(s)}</span>`).join(""));
}

function renderExperience(){
  setHTML("experienceList", (DATA.experience || []).map(e => `
    <article class="timeline-item">
      <h3>${esc(e.role)}</h3>
      <div class="company">${esc(e.company)}</div>
      <div class="period">${esc(e.location)} · ${esc(e.period)}</div>
      <ul>${(e.description || []).map(d => `<li>${esc(d)}</li>`).join("")}</ul>
    </article>
  `).join(""));
}

function renderProjects(){
  const projects = DATA.projects || [];
  const grid = $("projectsGrid");
  const emptyEl = $("projectsEmpty");

  if(!projects.length){
    if(emptyEl) emptyEl.classList.remove("hidden");
    return;
  }

  if(emptyEl) emptyEl.classList.add("hidden");
  if(!grid) return;
  grid.innerHTML = projects.map((p) => {
    const images = p.images || [];
    const first = images[0] || "";
    const description = String(p.description || "").replace(/[*_`#]/g,"").trim();

    return `
      <article class="project-card">
        <div class="project-thumb" data-gallery='${encodeURIComponent(JSON.stringify(images))}' data-title="${esc(p.title || "Project")}">
          ${first
            ? `<img src="${asset(first)}" alt="${esc(p.title || "Project")}" loading="lazy"
                    onerror="this.closest('.project-thumb').innerHTML='<div class=&quot;empty-state&quot;>Image unavailable</div>'">`
            : `<div class="empty-state">No project image</div>`}
        </div>
        <div class="project-body">
          <div class="project-category">${esc(p.category || "Project")}</div>
          <h3>${esc(p.title || "Untitled Project")}</h3>
          <p>${esc(description.length > 180 ? description.slice(0,177)+"..." : description)}</p>
          <div class="card-actions">
            ${p.demo ? `<a class="mini-btn" href="${esc(p.demo)}" target="_blank" rel="noopener noreferrer">🔗 Live Demo</a>` : ""}
            ${p.github ? `<a class="mini-btn" href="${esc(p.github)}" target="_blank" rel="noopener noreferrer">💻 GitHub</a>` : ""}
            ${images.length ? `<button type="button" class="mini-btn open-gallery" data-images='${encodeURIComponent(JSON.stringify(images))}' data-title="${esc(p.title || "Project")}">🖼️ Gallery · ${images.length}</button>` : ""}
          </div>
        </div>
      </article>
    `;
  }).join("");

  document.querySelectorAll(".project-thumb[data-gallery]").forEach(el => {
    el.addEventListener("click", () => {
      const imgs = JSON.parse(decodeURIComponent(el.dataset.gallery));
      openLightbox(imgs, 0, el.dataset.title);
    });
  });

  document.querySelectorAll(".open-gallery").forEach(el => {
    el.addEventListener("click", () => {
      const imgs = JSON.parse(decodeURIComponent(el.dataset.images));
      openLightbox(imgs, 0, el.dataset.title);
    });
  });
}

function renderCertificates(){
  const certificates = DATA.certificates || [];
  if(!certificates.length) return;

  const emptyEl = $("certificatesEmpty");
  if(emptyEl) emptyEl.classList.add("hidden");
  setHTML("certificatesGrid", certificates.map((c, i) => {
    const src = typeof c === "string" ? c : c.src;
    const title = typeof c === "string" ? `Certificate ${i+1}` : (c.title || `Certificate ${i+1}`);
    return `
      <div class="gallery-thumb" data-cert-index="${i}">
        <img src="${asset(src)}" alt="${esc(title)}" loading="lazy"
             onerror="this.style.opacity='.25'">
      </div>`;
  }).join(""));

  document.querySelectorAll("[data-cert-index]").forEach(el => {
    el.addEventListener("click", () => {
      const imgs = certificates.map(c => typeof c === "string" ? c : c.src);
      openLightbox(imgs, Number(el.dataset.certIndex), "Certificates");
    });
  });
}

function renderDocuments(){
  const docs = [
    {title:"Curriculum Vitae", icon:"📄", description:"Professional experience, education, and technical skills.", path:"assets/cv.pdf", fileName:"Aditya_Nugroho_CV.pdf"},
    {title:"Bachelor's Degree Certificate", icon:"🎓", description:"Bachelor's degree certificate from Universitas Pamulang.", path:"assets/ijazah.pdf", fileName:"Aditya_Nugroho_Degree_Certificate.pdf"},
    {title:"Academic Transcript", icon:"📊", description:"Official academic transcript and course grades.", path:"assets/transkrip_nilai.pdf", fileName:"Aditya_Nugroho_Academic_Transcript.pdf"}
  ];

  setHTML("documentsGrid", docs.map(d => `
    <article class="document-card">
      <h3>${d.icon} ${esc(d.title)}</h3>
      <p>${esc(d.description)}</p>
      <div class="document-actions">
        <a href="${asset(d.path)}" target="_blank" rel="noopener noreferrer">👁️ Preview PDF</a>
        <a href="${asset(d.path)}" download="${esc(d.fileName)}">⬇️ Download</a>
      </div>
    </article>
  `).join(""));
}

function renderEducation(){}

function setupNavigation(){
  const links = [...document.querySelectorAll(".nav-link")];
  const sections = links.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`));
      }
    });
  }, {rootMargin:"-35% 0px -55% 0px", threshold:0});

  sections.forEach(s => observer.observe(s));
}

function setupSidebarCollapse(){
  const collapseBtn = $("sidebarCollapseBtn");
  const expandBtn = $("sidebarExpandBtn");
  const sidebar = $("sidebar");
  if(!sidebar) return;

  const collapse = () => {
    sidebar.classList.add("collapsed");
    document.body.classList.add("sidebar-collapsed");
    if(expandBtn) expandBtn.classList.remove("hidden");
  };
  const expand = () => {
    sidebar.classList.remove("collapsed");
    document.body.classList.remove("sidebar-collapsed");
    if(expandBtn) expandBtn.classList.add("hidden");
  };

  if(collapseBtn) collapseBtn.addEventListener("click", collapse);
  if(expandBtn) expandBtn.addEventListener("click", expand);
}

function setupMobileMenu(){
  const menu = $("mobileMenu");
  if(!menu) return;

  menu.addEventListener("click", () => {
    $("sidebar").classList.toggle("open");
    menu.setAttribute("aria-expanded", $("sidebar").classList.contains("open") ? "true" : "false");
  });

  document.querySelectorAll(".nav-link").forEach(a =>
    a.addEventListener("click", () => $("sidebar").classList.remove("open"))
  );
}

function setupLightbox(){
  $("lightboxClose").onclick = closeLightbox;
  $("zoomIn").onclick = () => setZoom(scale + .25);
  $("zoomOut").onclick = () => setZoom(scale - .25);
  $("zoomReset").onclick = resetTransform;
  $("lightboxPrev").onclick = () => showImage(currentIndex - 1);
  $("lightboxNext").onclick = () => showImage(currentIndex + 1);

  $("lightbox").addEventListener("click", e => {
    if(e.target === $("lightbox")) closeLightbox();
  });

  const stage = $("lightboxStage");
  stage.addEventListener("wheel", e => {
    e.preventDefault();
    setZoom(scale + (e.deltaY < 0 ? .18 : -.18));
  }, {passive:false});

  stage.addEventListener("dblclick", () => setZoom(scale > 1 ? 1 : 2));

  stage.addEventListener("pointerdown", e => {
    if(e.pointerType === "mouse" && e.button !== 0) return;
    dragging = true;
    stage.classList.add("dragging");
    startX = e.clientX; startY = e.clientY;
    baseX = translateX; baseY = translateY;
    stage.setPointerCapture?.(e.pointerId);
  });

  stage.addEventListener("pointermove", e => {
    if(!dragging) return;
    translateX = baseX + (e.clientX - startX);
    translateY = baseY + (e.clientY - startY);
    applyTransform();
  });

  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  stage.addEventListener("touchstart", e => {
    if(e.touches.length === 2){
      pinchStartDistance = distance(e.touches[0], e.touches[1]);
      pinchStartScale = scale;
    }
  }, {passive:false});

  stage.addEventListener("touchmove", e => {
    if(e.touches.length === 2 && pinchStartDistance){
      e.preventDefault();
      const d = distance(e.touches[0], e.touches[1]);
      setZoom(pinchStartScale * (d / pinchStartDistance));
    }
  }, {passive:false});

  document.addEventListener("keydown", e => {
    if($("lightbox").classList.contains("hidden")) return;
    if(e.key === "Escape") closeLightbox();
    if(e.key === "ArrowLeft") showImage(currentIndex - 1);
    if(e.key === "ArrowRight") showImage(currentIndex + 1);
    if(e.key === "+" || e.key === "=") setZoom(scale + .25);
    if(e.key === "-") setZoom(scale - .25);
  });
}

function endDrag(e){
  dragging = false;
  $("lightboxStage").classList.remove("dragging");
  try{$("lightboxStage").releasePointerCapture?.(e.pointerId)}catch(_){}
}

function distance(a,b){ return Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY); }

function openLightbox(images, index=0, title=""){
  if(!images?.length) return;
  lightboxItems = images;
  currentIndex = index;
  $("lightbox").classList.remove("hidden");
  $("lightbox").setAttribute("aria-hidden","false");
  document.body.classList.add("modal-open");
  showImage(currentIndex, title);
}

function closeLightbox(){
  $("lightbox").classList.add("hidden");
  $("lightbox").setAttribute("aria-hidden","true");
  document.body.classList.remove("modal-open");
  resetTransform();
}

function showImage(index, title=""){
  if(index < 0 || index >= lightboxItems.length) return;
  currentIndex = index;
  const src = typeof lightboxItems[index] === "string" ? lightboxItems[index] : lightboxItems[index].src;
  $("lightboxImage").src = asset(src);
  $("lightboxImage").alt = title || `Image ${index+1}`;
  $("lightboxCounter").textContent = `${index+1} / ${lightboxItems.length}`;
  $("lightboxPrev").disabled = index === 0;
  $("lightboxNext").disabled = index === lightboxItems.length - 1;
  resetTransform();
}

function setZoom(value){
  scale = Math.max(1, Math.min(5, value));
  if(scale === 1){translateX=0;translateY=0}
  applyTransform();
}
function resetTransform(){scale=1;translateX=0;translateY=0;applyTransform()}
function applyTransform(){ $("lightboxImage").style.transform = `translate(${translateX}px,${translateY}px) scale(${scale})`; }

init();
