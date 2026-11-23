(() => {
  const SUPABASE_URL = "https://lvbesvjeiaxudhsajyuc.supabase.co";
  const SUPABASE_KEY = "sb_publishable_EhHpIAzaJC3y7MBkcv0wDQ_Vz8kXsnR";
  const WHATSAPP_NUMBER = "919712424041";
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const notice = document.getElementById("notice");
  const catalog = document.getElementById("catalog");
  const featured = document.getElementById("featured-packages");
  const serviceSelect = document.getElementById("service-select");
  const packageSelect = document.getElementById("package-select");
  const form = document.getElementById("order-form");
  const submitButton = document.getElementById("submit");
  let services = [];
  function trackEvent(name, params = {}) {
    if (typeof window.gtag === "function") window.gtag("event", name, params);
  }
  document.addEventListener("click", event => {
    const link = event.target.closest("a[href]");
    if (!link) return;
    const href = (link.getAttribute("href") || "").trim();
    let method = "";
    const lowerHref = href.toLowerCase();
    if (lowerHref.startsWith("https://wa.me/") || lowerHref.startsWith("http://wa.me/") || lowerHref.startsWith("https://www.wa.me/") || lowerHref.startsWith("https://whatsapp.com/") || lowerHref.startsWith("https://api.whatsapp.com/")) method = "whatsapp";
    else if (/^tel:/i.test(href)) method = "phone";
    else if (/^mailto:/i.test(href)) method = "email";
    if (method) trackEvent("contact_click", {contact_method: method, link_url: href});
  });
  const money = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
  function selectPackage(serviceId, packageId) {
    serviceSelect.value = serviceId;
    populatePackages();
    packageSelect.value = packageId;
    syncSubmitState();
    document.getElementById("order").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function syncSubmitState() {
    const service = services.find(s => s.id === serviceSelect.value);
    const pkg = service?.service_packages.find(p => p.id === packageSelect.value && p.is_active);
    submitButton.disabled = !(service && pkg && form.checkValidity());
  }
  function populatePackages() {
    const service = services.find(s => s.id === serviceSelect.value);
    packageSelect.innerHTML = '<option value="">Choose a package</option>';
    packageSelect.disabled = !service;
    (service?.service_packages || []).filter(p => p.is_active).forEach(p => {
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = p.name + " — " + (service.pricing_type === "quote" ? "Custom quote" : money(p.price_inr) + (p.billing_period === "monthly" ? " / month" : ""));
      packageSelect.append(option);
    });
    syncSubmitState();
  }
  serviceSelect.addEventListener("change", populatePackages);
  packageSelect.addEventListener("change", syncSubmitState);
  form.addEventListener("input", syncSubmitState);
  function render() {
    catalog.innerHTML = "";
    featured.innerHTML = "";
    serviceSelect.innerHTML = '<option value="">Choose a service</option>';
    services.forEach(service => {
      const opt = document.createElement("option");
      opt.value = service.id;
      opt.textContent = service.name;
      serviceSelect.append(opt);
    });
    const social = services.find(s => s.slug === "social-media-management" || /social media management/i.test(s.name));
    if (social) {
      const heading = document.createElement("div");
      heading.className = "featured-heading";
      heading.innerHTML = '<span class="eyebrow">MOST POPULAR SERVICE</span><h2>Social Media Management</h2><p>Choose the monthly plan that matches your business goals.</p>';
      featured.append(heading);
      const grid = document.createElement("div");
      grid.className = "featured-grid";
      social.service_packages.filter(p=>p.is_active).forEach(pkg => {
        const card = document.createElement("article"); card.className = "featured-package" + (pkg.slug === "standard" ? " is-recommended" : "");
        const title = document.createElement("div"); title.className = "featured-title";
        const name = document.createElement("h3"); name.textContent = pkg.name; title.append(name);
        if (pkg.slug === "standard") { const badge = document.createElement("span"); badge.className = "recommended-badge"; badge.textContent = "Recommended"; title.append(badge); }
        card.append(title);
        const price = document.createElement("div"); price.className = "featured-price"; price.textContent = money(pkg.price_inr);
        const period = document.createElement("span"); period.textContent = " / month"; price.append(period); card.append(price);
        const desc = document.createElement("p"); desc.className = "featured-description"; desc.textContent = pkg.description || "A social media package tailored to your monthly requirements."; card.append(desc);
        const button = document.createElement("button"); button.className = "choose"; button.type = "button"; button.textContent = "Choose package";
        button.addEventListener("click",()=>selectPackage(social.id,pkg.id)); card.append(button); grid.append(card);
      });
      featured.append(grid);
    }
    services.filter(s => s !== social).forEach(service => {
      const card = document.createElement("article"); card.className = "service service-compact";
      const heading = document.createElement("h3"); heading.textContent = service.name; card.append(heading);
      const desc = document.createElement("p"); desc.textContent = service.description || "A Digital World service for small and growing businesses."; card.append(desc);
      const price = document.createElement("div"); price.className = "price";
      const activePrices = service.service_packages.filter(p=>p.is_active && p.price_inr != null).map(p=>p.price_inr);
      price.textContent = service.pricing_type === "quote" ? "Custom quote" : money(service.starting_price_inr || Math.min(...activePrices));
      card.append(price);
      const list = document.createElement("div"); list.className = "packages";
      service.service_packages.filter(p=>p.is_active).forEach(pkg => {
        const row = document.createElement("div"); row.className = "package";
        const info = document.createElement("div"); info.className = "package-info";
        const title = document.createElement("div"); title.className = "package-title";
        const name = document.createElement("span"); name.textContent = pkg.name + (pkg.billing_period === "monthly" ? " · monthly" : ""); title.append(name); info.append(title);
        if (pkg.description) { const packageDesc = document.createElement("p"); packageDesc.className = "package-description"; packageDesc.textContent = pkg.description; info.append(packageDesc); }
        const cost = document.createElement("strong"); cost.textContent = service.pricing_type === "quote" ? "Quote" : money(pkg.price_inr);
        const button = document.createElement("button"); button.className = "choose"; button.type = "button"; button.textContent = "Choose";
        button.addEventListener("click",()=>selectPackage(service.id,pkg.id));
        row.append(info,cost,button); list.append(row);
      });
      card.append(list); catalog.append(card);
    });
    notice.textContent = "Choose a service and package, then send your enquiry directly to Digital World on WhatsApp.";
  }
  async function init() {
    try {
      const {data,error} = await client.from("services").select("id,slug,name,description,pricing_type,starting_price_inr,sort_order,service_packages(id,slug,name,description,price_inr,billing_period,features,sort_order,is_active)").eq("is_active",true).order("sort_order");
      if(error) throw error;
      services = (data || []).map(s=>({...s,service_packages:(s.service_packages||[]).sort((a,b)=>a.sort_order-b.sort_order)}));
      if(!services.length) throw new Error("No active services are currently published.");
      render();
      const requestedService = new URLSearchParams(window.location.search).get("service");
      if (requestedService) {
        const matchedService = services.find(item => item.slug === requestedService);
        if (matchedService) {
          serviceSelect.value = matchedService.id;
          populatePackages();
          const orderSection = document.getElementById("order");
          if (orderSection) setTimeout(() => orderSection.scrollIntoView({behavior:"smooth",block:"start"}), 120);
        }
      }
      syncSubmitState();
    } catch(error) {
      notice.textContent = "The service catalogue could not load. Please contact Digital World on +91 97124 24041.";
      console.error("Service catalogue:",error);
    }
  }
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());
    const service = services.find(s => s.id === payload.service_id);
    const pkg = service?.service_packages.find(p => p.id === payload.package_id && p.is_active);
    if (!service || !pkg) { notice.textContent = "Please choose a valid service and package."; return; }
    const priceText = service.pricing_type === "quote" ? "Custom quote required" : money(pkg.price_inr) + (pkg.billing_period === "monthly" ? " / month" : "");
    const message = [
      "NEW SERVICE ENQUIRY — DIGITAL WORLD",
      "",
      "Name: " + payload.customer_name.trim(),
      "Business: " + payload.business_name.trim(),
      "Mobile: " + payload.customer_phone.trim(),
      "Email: " + payload.customer_email.trim(),
      "Service: " + service.name,
      "Package: " + pkg.name,
      "Package Price: " + priceText,
      "Additional Details: " + (payload.requirements.trim() || "Not provided"),
      "",
      "Source: digitalworldrpa.in/store.html"
    ].join("\n");
    const whatsappUrl = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
    trackEvent("generate_lead", {currency:"INR",service_name:service.name,package_name:pkg.name});
    const opened = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    if (!opened) window.location.href = whatsappUrl;
    submitButton.textContent = "Opening WhatsApp…";
    notice.textContent = "Your enquiry details are ready in WhatsApp. Please press Send in WhatsApp to deliver them to Digital World.";
    notice.scrollIntoView({behavior:"smooth",block:"center"});
    submitButton.disabled = true;
  });
  init();
})();