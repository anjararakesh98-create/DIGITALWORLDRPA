(() => {
  const $ = (id) => document.getElementById(id);
  const say = (id, message, kind = "") => {
    const el = $(id); if (!el) return;
    el.textContent = message; el.classList.remove("error-text", "success-text");
    if (kind) el.classList.add(kind === "error" ? "error-text" : "success-text");
  };
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let sb = null, profile = null, businesses = [];
  const tableCandidates = { businesses: "businesses", portfolios: "portfolios", cards: "digital_cards", reviews: "review_drafts" };

  function showNotice(message, info = false) {
    const el = $("notice"); if (!el) return;
    el.textContent = message; el.classList.remove("hidden"); el.classList.toggle("info", info);
  }
  function go(view) {
    document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === `view-${view}`));
    document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === view));
    const label = ({overview:"Overview",businesses:"Businesses",portfolios:"Portfolios",cards:"Digital cards",reviews:"AI review assistant",analytics:"Website analytics",activity:"Recent activity"})[view] || "Overview";
    $("breadcrumb-current").textContent = label;
    $("page-title").textContent = ({overview:"Good to see you.",businesses:"Business management",portfolios:"Your portfolios",cards:"Digital visiting cards",reviews:"AI review assistant",analytics:"Website analytics",activity:"Recent activity"})[view] || label;
    $("page-subtitle").textContent = ({overview:"Your digital operations, all in one workspace.",businesses:"Add, organize and manage your client workspaces.",portfolios:"Keep client work and public projects organized.",cards:"Create shareable digital profiles for every business.",reviews:"Prepare helpful, professional responses to customer reviews.",analytics:"Understand visitor activity across your public website.",activity:"A clear view of changes across your workspace."})[view] || "";
    if (innerWidth < 920) $("sidebar").classList.remove("open");
  }
  document.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => go(b.dataset.view)));
  document.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => go(b.dataset.go)));
  $("open-analytics")?.addEventListener("click", () => go("analytics"));
  $("mobile-menu")?.addEventListener("click", () => $("sidebar").classList.toggle("open"));
  $("today-date").textContent = new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",year:"numeric"}).format(new Date());
  $("year").textContent = new Date().getFullYear();

  const modal = $("business-modal");
  ["add-business-top","add-business-page"].forEach(id => $(id)?.addEventListener("click", () => modal.showModal()));
  ["close-modal","cancel-modal"].forEach(id => $(id)?.addEventListener("click", () => modal.close()));

  async function countTable(table) {
    const { count, error } = await sb.from(table).select("*", {count:"exact", head:true});
    if (error) throw error;
    return count ?? 0;
  }
  function getBusinessName(row) {
    return row.business_name || row.name || row.title || row.company_name || "Unnamed business";
  }
  function getSlug(row) { return row.slug || row.public_slug || "—"; }
  function renderBusinesses(rows) {
    const body = rows.length ? rows.map(r => `<tr><td><div class="business-name"><span class="business-initial">${esc(getBusinessName(r).slice(0,2).toUpperCase())}</span>${esc(getBusinessName(r))}</div></td><td>${esc(r.category || "—")}</td><td>${esc(getSlug(r))}</td><td>${esc(r.phone || "—")}</td><td><span class="health-status">${esc(r.status || "Saved")}</span></td></tr>`).join("") : `<tr><td colspan="5"><div class="empty-state"><span class="empty-symbol">▣</span><b>No business records yet</b><p>Use “Add business” to create your first client workspace.</p></div></td></tr>`;
    const table = `<table class="data-table"><thead><tr><th>Business</th><th>Category</th><th>Public slug</th><th>Phone</th><th>Status</th></tr></thead><tbody>${body}</tbody></table>`;
    $("business-preview").innerHTML = table;
    $("business-list").innerHTML = table;
    $("nav-business-count").textContent = rows.length;
    $("stat-businesses").textContent = rows.length;
    $("review-business").innerHTML = `<option value="">Choose a business</option>` + rows.map(r => `<option value="${esc(r.id || "")}">${esc(getBusinessName(r))}</option>`).join("");
  }
  async function loadBusinesses() {
    const { data, error } = await sb.from("businesses").select("*").limit(100);
    if (error) throw error;
    businesses = data || [];
    renderBusinesses(businesses);
    $("health-db").textContent = "Database queries are working";
    $("health-db-status").textContent = "Connected";
  }
  async function loadCount(table, target) {
    try { $(target).textContent = await countTable(table); }
    catch (_) { $(target).textContent = "—"; }
  }
  $("business-search")?.addEventListener("input", e => {
    const q = e.target.value.toLowerCase().trim();
    const filtered = businesses.filter(r => JSON.stringify([getBusinessName(r), r.category, getSlug(r), r.phone]).join(" ").toLowerCase().includes(q));
    const body = filtered.length ? filtered.map(r => `<tr><td><div class="business-name"><span class="business-initial">${esc(getBusinessName(r).slice(0,2).toUpperCase())}</span>${esc(getBusinessName(r))}</div></td><td>${esc(r.category || "—")}</td><td>${esc(getSlug(r))}</td><td>${esc(r.phone || "—")}</td><td>${esc(r.status || "Saved")}</td></tr>`).join("") : `<tr><td colspan="5" class="muted-cell">No matching businesses.</td></tr>`;
    $("business-list").querySelector("tbody").innerHTML = body;
  });

  $("business-form")?.addEventListener("submit", async e => {
    e.preventDefault();
    if (!sb) return say("business-form-status","Supabase is not connected.","error");
    const form = e.currentTarget, fd = new FormData(form);
    const payload = {
      business_name: String(fd.get("business_name") || "").trim(),
      slug: String(fd.get("slug") || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g,"-").replace(/^-|-$/g,""),
      category: String(fd.get("category") || "").trim() || null,
      phone: String(fd.get("phone") || "").trim() || null,
      website: String(fd.get("website") || "").trim() || null,
      google_review_url: String(fd.get("google_review_url") || "").trim() || null,
      short_description: String(fd.get("short_description") || "").trim() || null,
      services: String(fd.get("services") || "").split(",").map(s=>s.trim()).filter(Boolean)
    };
    // Owner linkage is added only if the existing schema has a compatible owner field.
    const submit = form.querySelector('[type="submit"]'); submit.disabled = true;
    say("business-form-status","Saving business…");
    try {
      const { data: authData } = await sb.auth.getUser();
      payload.owner_id = authData?.user?.id;
      let result = await sb.from("businesses").insert(payload).select("*").single();
      if (result.error && /owner_id|column/i.test(result.error.message)) {
        delete payload.owner_id;
        result = await sb.from("businesses").insert(payload).select("*").single();
      }
      if (result.error) throw result.error;
      say("business-form-status","Business saved successfully.","success");
      form.reset();
      await loadBusinesses();
      await loadCount("portfolios","stat-portfolios");
      setTimeout(()=>modal.close(),700);
    } catch (err) {
      say("business-form-status",err.message || "Could not save business. Check the businesses table columns and RLS policies.","error");
    } finally { submit.disabled = false; }
  });

  $("draft-review")?.addEventListener("click", () => {
    const review = $("review-input").value.trim();
    if (!review) return say("review-status","Paste a customer review first.","error");
    const language = $("review-language").value, tone = $("review-tone").value;
    let draft = "";
    if (language === "Gujarati") draft = "તમારા મૂલ્યવાન પ્રતિસાદ બદલ ખૂબ ખૂબ આભાર. આપનો અનુભવ અમારા માટે મહત્વપૂર્ણ છે. અમે આપને વધુ સારી સેવા આપવા હંમેશા પ્રયત્નશીલ રહીશું.";
    else if (language === "Hindi") draft = "आपकी बहुमूल्य प्रतिक्रिया के लिए बहुत-बहुत धन्यवाद। आपका अनुभव हमारे लिए महत्वपूर्ण है। हम आपको बेहतर सेवा देने के लिए हमेशा प्रयासरत रहेंगे।";
    else draft = tone === "Short and polite" ? "Thank you for your feedback. We truly appreciate your support and look forward to serving you again." : tone === "Friendly" ? "Thank you so much for sharing your experience! We’re glad you took the time to leave feedback. Your support means a lot to our team, and we look forward to welcoming you again." : "Thank you for taking the time to share your feedback. We value your input and remain committed to providing a professional and positive experience. We appreciate your support.";
    $("review-output").value = draft;
    say("review-status","Draft prepared (starter template). Connect an AI provider for review-specific replies.","");
  });
  $("copy-review")?.addEventListener("click", async () => {
    const val = $("review-output").value;
    if (!val) return say("review-status","Prepare a draft first.","error");
    try { await navigator.clipboard.writeText(val); say("review-status","Copied to clipboard.","success"); }
    catch (_) { $("review-output").select(); say("review-status","Select and copy the text manually."); }
  });

  async function init() {
    const ready = window.supabase && window.DW_SUPABASE_URL && window.DW_SUPABASE_ANON_KEY;
    if (!ready) {
      showNotice("Supabase configuration is missing. Check ../js/supabase-config.js and keep all private service keys out of browser code.");
      say("health-auth","Supabase config not found","error"); say("health-auth-status","Not connected","error");
      $("user-email").textContent = "Not connected";
      return;
    }
    sb = window.supabase.createClient(window.DW_SUPABASE_URL, window.DW_SUPABASE_ANON_KEY);
    try {
      const {data:{session},error} = await sb.auth.getSession();
      if (error) throw error;
      if (!session) { location.replace("sign-in.html"); return; }
      $("user-email").textContent = session.user.email || "Signed in";
      $("avatar").textContent = (session.user.email || "DW").slice(0,2).toUpperCase();
      say("health-auth","Signed in as authorized user","success"); say("health-auth-status","Connected","success");
      const {data: prof, error: pErr} = await sb.from("profiles").select("id,role,approval_status,full_name").eq("id",session.user.id).maybeSingle();
      if (pErr) throw pErr;
      profile = prof;
      if (!prof || prof.approval_status !== "approved") {
        showNotice("Your account is not approved for this workspace yet. Ask the Digital World administrator to approve access.");
        document.querySelectorAll(".nav-item").forEach(b => b.disabled = true);
        return;
      }
      if (prof.role !== "super_admin") {
        showNotice("You are signed in. This starter dashboard currently exposes admin tools only to super_admin accounts.");
        document.querySelectorAll(".nav-item").forEach(b => b.disabled = true);
        return;
      }
      const welcomeName = (prof.full_name || "there").split(" ")[0];
      $("page-title").textContent = `Good to see you, ${welcomeName}.`;
      await loadBusinesses();
      await Promise.all([
        loadCount("portfolios","stat-portfolios"),
        loadCount("digital_cards","stat-cards"),
        loadCount("review_drafts","stat-reviews")
      ]);
    } catch (err) {
      showNotice("Dashboard connection issue: " + (err.message || "Please check your Supabase schema, RLS policies and configuration."));
      say("health-db","Could not verify database access","error"); say("health-db-status","Check setup","error");
    }
  }
  $("sign-out")?.addEventListener("click", async () => {
    if (sb) await sb.auth.signOut();
    location.href = "sign-in.html";
  });
  init();
})();