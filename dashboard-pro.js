(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
  const say = (id, msg, kind = "") => {
    const el = $(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("error-text", "success-text");
    if (kind) el.classList.add(kind === "error" ? "error-text" : "success-text");
  };

  let sb = null, user = null, profile = null;
  const businesses = [], portfolios = [], cards = [], reviews = [];

  // These field names match the Supabase schema shared in this conversation.
  const configs = {
    businesses: {
      table: "businesses", list: "business-list", search: "business-search",
      label: "Business", fields: ["name", "slug", "category", "description", "phone", "email", "website", "address", "google_review_url", "services"]
    },
    portfolios: {
      table: "portfolios", list: "portfolio-list", search: "portfolio-search",
      label: "Portfolio", fields: ["business_id", "headline", "about", "services", "gallery", "social_links", "seo_title", "seo_description", "is_published"]
    },
    cards: {
      table: "digital_cards", list: "card-list", search: "card-search",
      label: "Digital card", fields: ["business_id", "person_name", "designation", "phone", "whatsapp", "email", "website", "address", "photo_url", "theme", "is_published"]
    }
  };

  function notice(msg, info = false) {
    const n = $("notice");
    if (!n) return;
    n.textContent = msg;
    n.classList.remove("hidden");
    n.classList.toggle("info", info);
  }
  function go(v) {
    document.querySelectorAll(".view").forEach(x => x.classList.toggle("active", x.id === `view-${v}`));
    document.querySelectorAll(".nav-item").forEach(x => x.classList.toggle("active", x.dataset.view === v));
    const labels = {overview:"Overview",businesses:"Businesses",portfolios:"Portfolios",cards:"Digital cards",reviews:"AI review assistant",analytics:"Website analytics",activity:"Recent activity"};
    const titles = {overview:"Good to see you.",businesses:"Business management",portfolios:"Portfolio management",cards:"Digital visiting cards",reviews:"AI review assistant",analytics:"Website analytics",activity:"Recent activity"};
    const subs = {overview:"Your digital operations, all in one workspace.",businesses:"One business record, managed from one place.",portfolios:"Manage public portfolio items linked to each business.",cards:"Manage shareable digital profiles linked to businesses.",reviews:"Prepare helpful, professional responses to customer reviews.",analytics:"Understand visitor activity across your public website.",activity:"A clear view of changes across your workspace."};
    if ($("breadcrumb-current")) $("breadcrumb-current").textContent = labels[v] || "Overview";
    if ($("page-title")) $("page-title").textContent = titles[v] || labels[v];
    if ($("page-subtitle")) $("page-subtitle").textContent = subs[v] || "";
    if (innerWidth < 920 && $("sidebar")) $("sidebar").classList.remove("open");
  }

  document.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => go(b.dataset.view)));
  document.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => go(b.dataset.go)));
  if ($("open-analytics")) $("open-analytics").onclick = () => go("analytics");
  if ($("mobile-menu")) $("mobile-menu").onclick = () => $("sidebar")?.classList.toggle("open");
  if ($("today-date")) $("today-date").textContent = new Intl.DateTimeFormat("en-IN", {day:"numeric",month:"short",year:"numeric"}).format(new Date());
  if ($("year")) $("year").textContent = new Date().getFullYear();

  const businessModal = $("business-modal"), itemModal = $("item-modal");
  ["add-business-top", "add-business-page"].forEach(id => { if ($(id)) $(id).addEventListener("click", () => openBusiness()); });
  ["close-business-modal", "cancel-business-modal"].forEach(id => { if ($(id)) $(id).addEventListener("click", () => businessModal?.close()); });
  ["close-item-modal", "cancel-item-modal"].forEach(id => { if ($(id)) $(id).addEventListener("click", () => itemModal?.close()); });
  if ($("add-portfolio")) $("add-portfolio").onclick = () => openItem("portfolios");
  if ($("add-card")) $("add-card").onclick = () => openItem("cards");
  if ($("sign-out")) $("sign-out").onclick = async () => { if (sb) await sb.auth.signOut(); location.href = "sign-in.html"; };

  function nameOf(r) { return r.name || r.business_name || r.company_name || r.person_name || r.headline || "Unnamed"; }
  function slugOf(r) { return r.slug || r.public_slug || "—"; }
  function servicesText(value) {
    if (Array.isArray(value)) return value.join(", ");
    if (value && typeof value === "object") return Object.values(value).join(", ");
    return value || "";
  }
  function renderBusinessOptions() {
    const opts = '<option value="">Choose a business</option>' + businesses.map(b =>
      `<option value="${esc(b.id)}">${esc(nameOf(b))}</option>`).join("");
    if ($("review-business")) $("review-business").innerHTML = opts;
    if ($("item-business")) $("item-business").innerHTML = opts;
  }

  function tableHTML(type, data) {
    let heads, body;
    if (type === "businesses") {
      heads = ["Business", "Category", "Public slug", "Phone", "Status", "Manage"];
      body = data.map(r => `<tr>
        <td><div class="business-name"><span class="business-initial">${esc(nameOf(r).slice(0,2).toUpperCase())}</span>${esc(nameOf(r))}</div></td>
        <td>${esc(r.category || "—")}</td><td>${esc(slugOf(r))}</td><td>${esc(r.phone || "—")}</td>
        <td><span class="status-pill">${r.is_published === false ? "Draft" : "Saved"}</span></td>
        <td><div class="row-actions">
          <button class="mini-btn" data-action="view" data-type="businesses" data-id="${esc(r.id)}">View</button>
          <button class="mini-btn" data-action="edit" data-type="businesses" data-id="${esc(r.id)}">Edit</button>
          <button class="mini-btn danger" data-action="delete" data-type="businesses" data-id="${esc(r.id)}">Delete</button>
        </div></td></tr>`).join("");
    } else {
      heads = type === "portfolios" ? ["Portfolio item", "Business", "Services / about", "Manage"] : ["Digital card", "Business", "Contact", "Manage"];
      body = data.map(r => {
        const b = businesses.find(x => String(x.id) === String(r.business_id));
        const title = type === "portfolios" ? (r.headline || "Untitled portfolio") : (r.person_name || "Untitled card");
        const sub = type === "portfolios" ? (r.about || servicesText(r.services)) : [r.designation, r.phone, r.email].filter(Boolean).join(" · ");
        return `<tr><td><div class="business-name">${esc(title)}</div><small>${esc(sub)}</small></td>
          <td>${esc(b ? nameOf(b) : "Unlinked")}</td>
          <td>${esc(type === "portfolios" ? (r.seo_title || "—") : (r.website || "—"))}</td>
          <td><div class="row-actions">
            <button class="mini-btn" data-action="edit" data-type="${type}" data-id="${esc(r.id)}">Edit</button>
            <button class="mini-btn danger" data-action="delete" data-type="${type}" data-id="${esc(r.id)}">Delete</button>
          </div></td></tr>`;
      }).join("");
    }
    if (!body) body = `<tr><td colspan="${heads.length}"><div class="empty-state"><span class="empty-symbol">▣</span><b>No ${type === "businesses" ? "businesses" : type === "cards" ? "digital cards" : "portfolio items"} yet</b><p>Use the Add button to create the first record.</p></div></td></tr>`;
    return `<table class="data-table"><thead><tr>${heads.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table>`;
  }

  function paint() {
    if ($("business-preview")) $("business-preview").innerHTML = tableHTML("businesses", businesses.slice(0,5));
    if ($("business-list")) $("business-list").innerHTML = tableHTML("businesses", businesses);
    if ($("portfolio-list")) $("portfolio-list").innerHTML = tableHTML("portfolios", portfolios);
    if ($("card-list")) $("card-list").innerHTML = tableHTML("cards", cards);
    if ($("nav-business-count")) $("nav-business-count").textContent = businesses.length;
    if ($("stat-businesses")) $("stat-businesses").textContent = businesses.length;
    if ($("stat-portfolios")) $("stat-portfolios").textContent = portfolios.length;
    if ($("stat-cards")) $("stat-cards").textContent = cards.length;
    if ($("stat-reviews")) $("stat-reviews").textContent = reviews.length;
    renderBusinessOptions();
  }

  async function loadTable(type) {
    const {data, error} = await sb.from(configs[type].table).select("*").limit(250);
    if (error) throw error;
    const target = type === "businesses" ? businesses : type === "portfolios" ? portfolios : cards;
    target.splice(0, target.length, ...(data || []));
    paint();
  }

  function setFormValue(form, name, value) {
    const el = [...form.elements].find(x => x.name === name);
    if (!el || value == null) return;
    if (el.type === "checkbox") el.checked = Boolean(value);
    else if (el.tagName === "SELECT" && Array.isArray(value)) el.value = value[0] || "";
    else if (Array.isArray(value) || (value && typeof value === "object")) el.value = JSON.stringify(value);
    else el.value = value;
  }
  function openBusiness(row = null) {
    const form = $("business-form");
    if (!form || !businessModal) return;
    form.reset(); form.dataset.id = row?.id || "";
    if ($("business-modal-title")) $("business-modal-title").textContent = row ? "Edit business" : "Add a business";
    // UI form keeps its existing names; values are mapped to real DB columns.
    const map = {business_name:"name", name:"name", slug:"slug", public_slug:"slug", category:"category", phone:"phone", email:"email", website:"website", address:"address", google_review_url:"google_review_url", short_description:"description", description:"description", services:"services"};
    if (row) for (const el of form.elements) if (el.name && map[el.name]) setFormValue(form, el.name, row[map[el.name]]);
    say("business-form-status", "");
    businessModal.showModal();
  }
  function openItem(type, row = null) {
    if (!businesses.length) { notice("Add a business first, then create linked portfolio items or digital cards."); return; }
    const form = $("item-form");
    if (!form || !itemModal) return;
    form.reset(); form.dataset.type = type; form.dataset.id = row?.id || "";
    if ($("item-modal-title")) $("item-modal-title").textContent = (row ? "Edit " : "Add ") + (type === "cards" ? "digital card" : "portfolio item");
    renderBusinessOptions();
    if (row) {
      setFormValue(form, "business_id", row.business_id);
      if (type === "cards") {
        setFormValue(form, "title", row.person_name);
        setFormValue(form, "url", row.website);
        setFormValue(form, "description", row.designation);
        setFormValue(form, "person_name", row.person_name);
        setFormValue(form, "designation", row.designation);
        setFormValue(form, "phone", row.phone);
        setFormValue(form, "whatsapp", row.whatsapp);
        setFormValue(form, "email", row.email);
        setFormValue(form, "website", row.website);
        setFormValue(form, "address", row.address);
        setFormValue(form, "photo_url", row.photo_url);
        setFormValue(form, "theme", row.theme);
        setFormValue(form, "is_published", row.is_published);
      } else {
        setFormValue(form, "title", row.headline);
        setFormValue(form, "description", row.about);
        setFormValue(form, "headline", row.headline);
        setFormValue(form, "about", row.about);
        setFormValue(form, "services", row.services);
        setFormValue(form, "gallery", row.gallery);
        setFormValue(form, "social_links", row.social_links);
        setFormValue(form, "seo_title", row.seo_title);
        setFormValue(form, "seo_description", row.seo_description);
        setFormValue(form, "is_published", row.is_published);
      }
    }
    say("item-form-status", "");
    itemModal.showModal();
  }

  async function deleteRow(type, id) {
    if (!confirm("Delete this record? This action cannot be undone.")) return;
    const {error} = await sb.from(configs[type].table).delete().eq("id", id);
    if (error) { notice("Delete failed: " + error.message); return; }
    await loadTable(type);
    notice("Record deleted successfully.", true);
  }

  document.addEventListener("click", async e => {
    const b = e.target.closest("[data-action]");
    if (!b || !sb) return;
    const type = b.dataset.type, id = b.dataset.id;
    const arr = type === "businesses" ? businesses : type === "portfolios" ? portfolios : cards;
    const row = arr.find(r => String(r.id) === String(id));
    if (!row) return;
    if (b.dataset.action === "delete") return deleteRow(type, id);
    if (b.dataset.action === "edit") return type === "businesses" ? openBusiness(row) : openItem(type, row);
    if (b.dataset.action === "view" && type === "businesses") {
      const fields = [["Business name",nameOf(row)],["Category",row.category],["Phone",row.phone],["Email",row.email],["Website",row.website],["Google review URL",row.google_review_url],["Description",row.description],["Services",servicesText(row.services)],["Public slug",slugOf(row)]];
      if ($("detail-title")) $("detail-title").textContent = nameOf(row);
      if ($("detail-content")) $("detail-content").innerHTML = fields.map(([k,v]) => `<div class="detail-item"><small>${esc(k)}</small><b>${esc(v || "—")}</b></div>`).join("");
      $("detail-modal")?.showModal();
    }
  });

  function normalizeServices(v) {
    if (Array.isArray(v)) return v;
    const s = String(v ?? "").trim();
    if (!s) return [];
    try { const parsed = JSON.parse(s); if (Array.isArray(parsed)) return parsed; } catch (_) {}
    return s.split(",").map(x => x.trim()).filter(Boolean);
  }
  function getFormValue(fd, ...keys) {
    for (const key of keys) if (fd.has(key)) return fd.get(key);
    return null;
  }

  if ($("business-form")) $("business-form").addEventListener("submit", async e => {
    e.preventDefault();
    if (!sb) return;
    const form = e.currentTarget, fd = new FormData(form), id = form.dataset.id;
    const name = String(getFormValue(fd, "business_name", "name") || "").trim();
    const slug = String(getFormValue(fd, "slug", "public_slug") || name || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
    const payload = {
      name, slug,
      category: String(getFormValue(fd, "category") || "").trim() || null,
      phone: String(getFormValue(fd, "phone") || "").trim() || null,
      email: String(getFormValue(fd, "email") || "").trim() || null,
      website: String(getFormValue(fd, "website") || "").trim() || null,
      address: String(getFormValue(fd, "address") || "").trim() || null,
      google_review_url: String(getFormValue(fd, "google_review_url") || "").trim() || null,
      description: String(getFormValue(fd, "short_description", "description") || "").trim() || null,
      services: normalizeServices(getFormValue(fd, "services"))
    };
    if (!name) return say("business-form-status", "Business name is required.", "error");
    const btn = form.querySelector('[type="submit"]');
    if (btn) btn.disabled = true;
    say("business-form-status", "Saving…");
    try {
      let result;
      if (id) result = await sb.from("businesses").update(payload).eq("id", id).select().single();
      else {
        const {data:{user:u}} = await sb.auth.getUser();
        payload.owner_id = u?.id;
        result = await sb.from("businesses").insert(payload).select().single();
        if (result.error && /owner_id|column/i.test(result.error.message || "")) {
          delete payload.owner_id;
          result = await sb.from("businesses").insert(payload).select().single();
        }
      }
      if (result.error) throw result.error;
      await loadTable("businesses");
      say("business-form-status", "Saved successfully.", "success");
      setTimeout(() => businessModal?.close(), 500);
    } catch (err) {
      say("business-form-status", err.message || "Could not save. Check database columns and RLS.", "error");
    } finally { if (btn) btn.disabled = false; }
  });

  function jsonField(fd, key) {
    const raw = String(fd.get(key) || "").trim();
    if (!raw) return key === "services" || key === "gallery" || key === "social_links" ? [] : null;
    try { return JSON.parse(raw); } catch (_) {
      if (key === "services") return raw.split(",").map(x => x.trim()).filter(Boolean);
      return raw;
    }
  }

  if ($("item-form")) $("item-form").addEventListener("submit", async e => {
    e.preventDefault();
    if (!sb) return;
    const form = e.currentTarget, fd = new FormData(form), type = form.dataset.type, id = form.dataset.id;
    const businessId = String(fd.get("business_id") || "");
    if (!businessId) return say("item-form-status", "Choose a business first.", "error");
    let table, payload;
    if (type === "cards") {
      table = "digital_cards";
      payload = {
        business_id: businessId,
        person_name: String(getFormValue(fd, "person_name", "title") || "").trim() || null,
        designation: String(getFormValue(fd, "designation", "description") || "").trim() || null,
        phone: String(getFormValue(fd, "phone") || "").trim() || null,
        whatsapp: String(getFormValue(fd, "whatsapp") || "").trim() || null,
        email: String(getFormValue(fd, "email") || "").trim() || null,
        website: String(getFormValue(fd, "website", "url") || "").trim() || null,
        address: String(getFormValue(fd, "address") || "").trim() || null,
        photo_url: String(getFormValue(fd, "photo_url") || "").trim() || null,
        theme: jsonField(fd, "theme") || {},
        is_published: fd.has("is_published") ? ["true","on","1"].includes(String(fd.get("is_published")).toLowerCase()) : true
      };
    } else {
      table = "portfolios";
      payload = {
        business_id: businessId,
        headline: String(getFormValue(fd, "headline", "title") || "").trim() || null,
        about: String(getFormValue(fd, "about", "description") || "").trim() || null,
        services: jsonField(fd, "services"),
        gallery: jsonField(fd, "gallery"),
        social_links: jsonField(fd, "social_links"),
        seo_title: String(getFormValue(fd, "seo_title") || "").trim() || null,
        seo_description: String(getFormValue(fd, "seo_description") || "").trim() || null,
        is_published: fd.has("is_published") ? ["true","on","1"].includes(String(fd.get("is_published")).toLowerCase()) : false
      };
    }
    const btn = form.querySelector('[type="submit"]');
    if (btn) btn.disabled = true;
    say("item-form-status", "Saving…");
    try {
      const res = id ? await sb.from(table).update(payload).eq("id", id).select().single() : await sb.from(table).insert(payload).select().single();
      if (res.error) throw res.error;
      await loadTable(type);
      say("item-form-status", "Saved successfully.", "success");
      setTimeout(() => itemModal?.close(), 500);
    } catch (err) {
      say("item-form-status", err.message || "Could not save. Check the table columns and RLS policies.", "error");
    } finally { if (btn) btn.disabled = false; }
  });

  function wireSearch(type) {
    const el = $(configs[type].search);
    if (!el) return;
    el.addEventListener("input", e => {
      const q = e.target.value.toLowerCase();
      const arr = type === "businesses" ? businesses : type === "portfolios" ? portfolios : cards;
      const filtered = arr.filter(r => JSON.stringify(r).toLowerCase().includes(q));
      const list = $(configs[type].list);
      if (list) list.innerHTML = tableHTML(type, filtered);
    });
  }
  ["businesses", "portfolios", "cards"].forEach(wireSearch);

  if ($("draft-review")) $("draft-review").onclick = () => {
    const review = $("review-input")?.value.trim();
    if (!review) return say("review-status", "Paste a customer review first.", "error");
    const lang = $("review-language")?.value, tone = $("review-tone")?.value;
    let out;
    if (lang === "Gujarati") out = "તમારા મૂલ્યવાન પ્રતિસાદ બદલ ખૂબ ખૂબ આભાર. આપનો અનુભવ અમારા માટે મહત્વપૂર્ણ છે. અમે આપને વધુ સારી સેવા આપવા હંમેશા પ્રયત્નશીલ રહીશું.";
    else if (lang === "Hindi") out = "आपकी बहुमूल्य प्रतिक्रिया के लिए बहुत-बहुत धन्यवाद। आपका अनुभव हमारे लिए महत्वपूर्ण है। हम आपको बेहतर सेवा देने के लिए हमेशा प्रयासरत रहेंगे।";
    else out = tone === "Short and polite" ? "Thank you for your feedback. We truly appreciate your support and look forward to serving you again." :
      tone === "Friendly" ? "Thank you so much for sharing your experience! Your support means a lot to our team, and we look forward to welcoming you again." :
      "Thank you for taking the time to share your feedback. We value your input and remain committed to providing a professional and positive experience. We appreciate your support.";
    if ($("review-output")) $("review-output").value = out;
    say("review-status", "Template draft prepared. Connect an AI API for review-specific replies.");
  };
  if ($("copy-review")) $("copy-review").onclick = async () => {
    try { await navigator.clipboard.writeText($("review-output")?.value || ""); say("review-status", "Copied.", "success"); }
    catch (_) { say("review-status", "Select and copy the draft manually."); }
  };
  if ($("save-review")) $("save-review").onclick = async () => {
    if (!sb) return;
    const business = $("review-business")?.value, content = $("review-output")?.value.trim();
    if (!business || !content) return say("review-status", "Choose a business and prepare a draft first.", "error");
    const row = {business_id:business, review_text:$("review-input")?.value.trim() || "", draft_text:content, language:$("review-language")?.value || "English", tone:$("review-tone")?.value || "Professional"};
    const {error} = await sb.from("review_drafts").insert(row);
    if (error) say("review-status", "Save failed: " + error.message, "error");
    else { say("review-status", "Draft saved.", "success"); await loadReviews(); }
  };

  async function loadReviews() {
    const {data, error} = await sb.from("review_drafts").select("*").order("created_at", {ascending:false}).limit(20);
    if (error) {
      if ($("review-saved-list")) $("review-saved-list").innerHTML = '<p class="muted-label">Saved drafts are unavailable with the current schema or permissions.</p>';
      return;
    }
    reviews.splice(0, reviews.length, ...(data || []));
    if ($("stat-reviews")) $("stat-reviews").textContent = reviews.length;
    if ($("review-saved-list")) $("review-saved-list").innerHTML = reviews.map(r => {
      const b = businesses.find(x => String(x.id) === String(r.business_id));
      return `<div class="saved-item"><b>${esc(b ? nameOf(b) : "Business")} · ${esc(r.language || "")}</b><p>${esc(r.draft_text || r.response_text || "Saved draft")}</p></div>`;
    }).join("");
  }

  async function loadAnalytics() {
    if (!sb) return;
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await sb.from("analytics_events")
      .select("event_type,page_path,session_id,referrer,device_type,created_at")
      .gte("created_at", since).order("created_at", { ascending: false }).limit(5000);
    if (error) {
      if ($("visitor-total")) $("visitor-total").textContent = "Setup needed";
      if ($("analytics-popular-pages")) $("analytics-popular-pages").innerHTML = `<b>Analytics unavailable</b><p>${esc(error.message)}</p>`;
      return;
    }
    const rows = data || [];
    const pageViews = rows.filter(r => r.event_type === "page_view");
    const portfolioViews = rows.filter(r => r.event_type === "portfolio_view");
    const sessions = new Set(rows.map(r => r.session_id).filter(Boolean));
    const activeAfter = Date.now() - 5 * 60 * 1000;
    const active = new Set(rows.filter(r => r.session_id && new Date(r.created_at).getTime() >= activeAfter).map(r => r.session_id));
    const setText = (id, val) => { if ($(id)) $(id).textContent = String(val); };
    setText("analytics-unique", sessions.size);
    setText("analytics-online", active.size);
    setText("analytics-pageviews", pageViews.length);
    setText("analytics-portfolio-views", portfolioViews.length);
    setText("visitor-total", sessions.size.toLocaleString("en-IN"));
    setText("visitor-online", active.size.toLocaleString("en-IN"));

    const pageCounts = {};
    pageViews.forEach(r => { const path = r.page_path || "/"; pageCounts[path] = (pageCounts[path] || 0) + 1; });
    const popular = Object.entries(pageCounts).sort((a,b) => b[1]-a[1]).slice(0,10);
    if ($("analytics-popular-pages")) {
      $("analytics-popular-pages").innerHTML = popular.length
        ? `<div class="table-wrap"><table><thead><tr><th>Page</th><th>Views</th></tr></thead><tbody>${popular.map(([path,count])=>`<tr><td>${esc(path)}</td><td>${count}</td></tr>`).join("")}</tbody></table></div>`
        : '<div class="empty-state"><b>No page views yet</b><p>Visit the public website in a new tab to create a test event.</p></div>';
    }
    const sources = {};
    rows.forEach(r => {
      let source = "Direct / unknown";
      if (r.referrer) { try { source = new URL(r.referrer).hostname.replace(/^www\./, "") || source; } catch (_) {} }
      sources[source] = (sources[source] || 0) + 1;
    });
    const sortedSources = Object.entries(sources).sort((a,b)=>b[1]-a[1]).slice(0,8);
    if ($("analytics-sources")) {
      $("analytics-sources").innerHTML = sortedSources.length
        ? sortedSources.map(([source,count])=>`<p style="display:flex;justify-content:space-between;gap:16px"><span>${esc(source)}</span><b>${count}</b></p>`).join("")
        : '<div class="empty-state"><b>No source data yet</b><p>Referral sources appear after tracked visits.</p></div>';
    }
  }

  async function init() {
    if (!window.supabase || !window.DW_SUPABASE_URL || !window.DW_SUPABASE_ANON_KEY) {
      notice("Supabase configuration missing. Check ../js/supabase-config.js."); return;
    }
    sb = window.supabase.createClient(window.DW_SUPABASE_URL, window.DW_SUPABASE_ANON_KEY);
    try {
      const {data:{session}, error} = await sb.auth.getSession();
      if (error) throw error;
      if (!session) { location.replace("sign-in.html"); return; }
      user = session.user;
      if ($("user-email")) $("user-email").textContent = user.email || "Signed in";
      if ($("avatar")) $("avatar").textContent = (user.email || "DW").slice(0,2).toUpperCase();
      say("health-auth", "Signed in user detected", "success");
      say("health-auth-status", "Connected", "success");
      const {data:p, error:pe} = await sb.from("profiles").select("id,role,approval_status,full_name").eq("id", user.id).maybeSingle();
      if (pe) throw pe;
      profile = p;
      if (!p || p.approval_status !== "approved") { notice("Your account is awaiting administrator approval."); return; }
      if (p.role !== "super_admin") { notice("Admin tools are restricted to super_admin accounts."); return; }
      if (p.full_name && $("page-title")) $("page-title").textContent = `Good to see you, ${p.full_name.split(" ")[0]}.`;
      await loadTable("businesses");
      await loadTable("portfolios");
      await loadTable("cards");
      await loadReviews();
      await loadAnalytics();
      say("health-db", "Connected to workspace tables", "success");
      say("health-db-status", "Connected", "success");
    } catch (err) {
      notice("Dashboard/database error: " + (err.message || "Check Supabase table columns and RLS policies."));
      say("health-db-status", "Check setup", "error");
    }
  }

  init();
})();