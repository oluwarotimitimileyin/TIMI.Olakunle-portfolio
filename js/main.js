(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav
  const toggle = $(".nav__toggle");
  const menu = $("#navMenu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    $$(".nav__link", menu).forEach((link) => {
      link.addEventListener("click", () => {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Reveal on scroll
  const revealEls = $$(".reveal");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("is-visible");
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => io.observe(el));

  // Contact "mailto" composer
  const contactForm = $("#contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(contactForm);
      const name = String(fd.get("name") || "").trim();
      const email = String(fd.get("email") || "").trim();
      const message = String(fd.get("message") || "").trim();

      const subject = encodeURIComponent(`Portfolio Inquiry — ${name || "Visitor"}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n`
      );

      window.location.href = `mailto:rotimikun@gmail.com?subject=${subject}&body=${body}`;
    });
  }

  // Data-driven Projects + Testimonials
  const projectsGrid = $("#projectsGrid");
  const testimonialsGrid = $("#testimonialsGrid");
  const searchInput = $("#projectSearch");
  const filterSelect = $("#projectFilter");

  let allProjects = [];

  async function safeFetchJson(path) {
    try {
      const res = await fetch(path, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`Failed to load ${path}:`, err);
      return null;
    }
  }

  function renderProjects(projects) {
    if (!projectsGrid) return;
    projectsGrid.innerHTML = "";

    if (!projects.length) {
      projectsGrid.innerHTML = `
        <div class="card projectCard">
          <h3 class="h3">No projects yet</h3>
          <p class="muted">Add items in <code>data/projects.json</code> and they will appear here automatically.</p>
        </div>
      `;
      return;
    }

    projects.forEach((p) => {
      const el = document.createElement("article");
      el.className = "card projectCard reveal is-visible";

      const badges = (p.tags || []).map((t) => `<span class="badge">${escapeHtml(t)}</span>`).join("");
      const kpis = (p.kpis || []).map((k) => `<span class="kpi">${escapeHtml(k)}</span>`).join("");

      const links = []
      if (p.demoUrl) links.push(`<a class="link" href="${escapeAttr(p.demoUrl)}" target="_blank" rel="noreferrer">Demo</a>`);
      if (p.repoUrl) links.push(`<a class="link" href="${escapeAttr(p.repoUrl)}" target="_blank" rel="noreferrer">Repo</a>`);
      if (p.caseStudyUrl) links.push(`<a class="link" href="${escapeAttr(p.caseStudyUrl)}" target="_blank" rel="noreferrer">Case Study</a>`);

      el.innerHTML = `
        <div class="projectTop">
          <div>
            <h3 class="h3">${escapeHtml(p.title || "Untitled Project")}</h3>
            <p class="muted">${escapeHtml(p.oneLiner || "")}</p>
            <div class="projectMeta">${badges}</div>
          </div>
          ${p.year ? `<span class="tag">${escapeHtml(String(p.year))}</span>` : ""}
        </div>

        ${p.context ? `<p class="muted"><strong style="color:rgba(245,239,227,.92)">Context:</strong> ${escapeHtml(p.context)}</p>` : ""}
        ${p.work ? `<p class="muted"><strong style="color:rgba(245,239,227,.92)">What I did:</strong> ${escapeHtml(p.work)}</p>` : ""}
        ${p.tools ? `<p class="muted"><strong style="color:rgba(245,239,227,.92)">Tools:</strong> ${escapeHtml(p.tools.join(", "))}</p>` : ""}

        ${kpis ? `<div class="kpis">${kpis}</div>` : ""}

        ${links.length ? `<div class="projectLinks">${links.join("")}</div>` : ""}
      `;
      projectsGrid.appendChild(el);
    });
  }

  function populateFilters(projects) {
    if (!filterSelect) return;
    const tags = new Set();
    projects.forEach((p) => (p.tags || []).forEach((t) => tags.add(t)));
    const sorted = Array.from(tags).sort((a, b) => a.localeCompare(b));
    sorted.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      filterSelect.appendChild(opt);
    });
  }

  function applyProjectControls() {
    let filtered = [...allProjects];

    const q = (searchInput?.value || "").trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((p) => {
        const blob = [
          p.title, p.oneLiner, p.context, p.work,
          (p.tools || []).join(" "),
          (p.tags || []).join(" "),
          (p.kpis || []).join(" "),
        ].join(" ").toLowerCase();
        return blob.includes(q);
      });
    }

    const tag = filterSelect?.value || "all";
    if (tag !== "all") {
      filtered = filtered.filter((p) => (p.tags || []).includes(tag));
    }

    renderProjects(filtered);
  }

  function renderTestimonials(items) {
    if (!testimonialsGrid) return;
    testimonialsGrid.innerHTML = "";

    if (!items || !items.length) {
      testimonialsGrid.innerHTML = `
        <div class="card">
          <h3 class="h3">Add your testimonials</h3>
          <p class="muted">Populate <code>data/testimonials.json</code> with quotes from clients/managers.</p>
        </div>
      `;
      return;
    }

    items.forEach((t) => {
      const el = document.createElement("article");
      el.className = "card reveal is-visible";
      el.innerHTML = `
        <div class="quote">“${escapeHtml(t.quote || "")}”</div>
        <div class="quoteBy">— ${escapeHtml(t.name || "Anonymous")}${t.role ? `, ${escapeHtml(t.role)}` : ""}</div>
      `;
      testimonialsGrid.appendChild(el);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
  }
  function escapeAttr(s) { return escapeHtml(s); }

  async function init() {
    const projects = await safeFetchJson("data/projects.json");
    if (projects && Array.isArray(projects)) {
      allProjects = projects;
      populateFilters(allProjects);
      renderProjects(allProjects);

      if (searchInput) searchInput.addEventListener("input", applyProjectControls);
      if (filterSelect) filterSelect.addEventListener("change", applyProjectControls);
    } else {
      renderProjects([]);
    }

    const testimonials = await safeFetchJson("data/testimonials.json");
    renderTestimonials(Array.isArray(testimonials) ? testimonials : []);
  }

  init();
})();
