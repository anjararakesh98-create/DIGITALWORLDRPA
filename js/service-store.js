(() => {
  const SUPABASE_URL = "https://lvbesvjeiaxudhsajyuc.supabase.co";
  const SUPABASE_KEY = "sb_publishable_EhHpIAzaJC3y7MBkcv0wDQ_Vz8kXsnR";
  const UPI_ID = "9712424041@ybl";
  const PAYEE = "ANJARA RAKESHBHAI PALJIBHAI";
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const notice = document.getElementById("notice");
  const catalog = document.getElementById("catalog");
  const featured = document.getElementById("featured-packages");
  const serviceSelect = document.getElementById("service-select");
  const packageSelect = document.getElementById("package-select");
  const form = document.getElementById("order-form");
  const paymentQr = document.getElementById("payment-qr");
  const paymentAmount = document.getElementById("payment-amount");
  const submitButton = document.getElementById("submit");
  const utrInput = document.getElementById("utr-reference");
  const referenceDetailsInput = document.getElementById("reference-details");
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
    serviceSelect.value = serviceId; populatePackages(); packageSelect.value = packageId;
    updateCheckout();\n    document.getElementById("order").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function updateCheckout() {\n    const service = services.find(s => s.id === serviceSelect.value);\n    const pkg = service?.service_packages.find(p => p.id === packageSelect.value && p.is_active);\n    const price = pkg && service?.pricing_type !== "quote" ? Number(pkg.price_inr) : 0;\n    if (price > 0) {\n      const upi = "upi://pay?pa="+encodeURIComponent(UPI_ID)+"&pn="+encodeURIComponent(PAYEE)+"&am="+encodeURIComponent(price.toFixed(2))+"&cu=INR&tn="+encodeURIComponent("Digital World "+(pkg.name||"Service"));\n      paymentQr.src = "https://api.qrserver.com/v1/create-qr-code/?size=210x210&data="+encodeURIComponent(upi);\n      paymentAmount.textContent = "Pay "+money(price);\n    } else { paymentQr.src = "images/payment-qr-placeholder.svg"; paymentAmount.textContent = pkg ? "Custom quote: payment after quote confirmation" : "Select a package to see the amount"; }\n    syncSubmitState();\n  }\n  function syncSubmitState() {\n    const service = services.find(s => s.id === serviceSelect.value);\n    const pkg = service?.service_packages.find(p => p.id === packageSelect.value && p.is_active);\n    const payable = !!pkg && service?.pricing_type !== "quote" && Number(pkg.price_inr) > 0;\n    submitButton.disabled = !(payable && form.checkValidity());\n  }\n  function populatePackages() {
    const service = services.find(s => s.id === serviceSelect.value);
    packageSelect.innerHTML = '<option value="">Choose a package</option>'; packageSelect.disabled = !service;
    (service?.service_packages || []).filter(p => p.is_active).forEach(p => {
      const option = document.createElement("option"); option.value = p.id;
      option.textContent = p.name + " — " + (service.pricing_type === "quote" ? "Custom quote" : money(p.price_inr) + (p.billing_period === "monthly" ? " / month" : ""));
      packageSelect.append(option);
    });
  }
  serviceSelect.addEventListener("change", populatePackages);
  function render() {
    catalog.innerHTML = ""; featured.innerHTML = "";
    serviceSelect.innerHTML = '<option value="">Choose a service</option>';
    services.forEach(service => {
      const opt = document.createElement("option"); opt.value = service.id; opt.textContent = service.name; serviceSelect.append(opt);
    });

    const social = services.find(s => s.slug === "social-media-management" || /social media management/i.test(s.name));
    if (social) {
      const heading = document.createElement("div"); heading.className = "featured-heading";
      heading.innerHTML = '<span class="eyebrow">MOST POPULAR SERVICE</span><h2>Social Media Management</h2><p>Choose the monthly plan that matches your business goals.</p>';
      featured.append(heading);
      const grid = document.createElement("div"); grid.className = "featured-grid";
      social.service_packages.filter(p=>p.is_active).forEach(pkg => {
        const card = document.createElement("article"); card.className = "featured-package" + (pkg.slug === "standard" ? " is-recommended" : "");
        const title = document.createElement("div"); title.className = "featured-title";
        const name = document.createElement("h3"); name.textContent = pkg.name; title.append(name);
        if (pkg.slug === "standard") {
          const badge = document.createElement("span"); badge.className = "recommended-badge"; badge.textContent = "Recommended"; title.append(badge);
        }
        card.append(title);
        const price = document.createElement("div"); price.className = "featured-price"; price.textContent = money(pkg.price_inr); 
        const period = document.createElement("span"); period.textContent = " / month"; price.append(period); card.append(price);
        const desc = document.createElement("p"); desc.className = "featured-description"; desc.textContent = pkg.description || "A social media package tailored to your monthly requirements."; card.append(desc);
        const button = document.createElement("button"); button.className = "choose"; button.type = "button"; button.textContent = "Choose package";
        button.addEventListener("click",()=>selectPackage(social.id,pkg.id)); card.append(button);
        grid.append(card);
      });
      featured.append(grid);
    }

    services.filter(s => s !== social).forEach(service => {
      const card = document.createElement("article"); card.className = "service service-compact";
      const heading = document.createElement("h3"); heading.textContent = service.name; card.append(heading);
      const desc = document.createElement("p"); desc.textContent = service.description || "A Digital World service for small and growing businesses."; card.append(desc);
      const price = document.createElement("div"); price.className = "price";
      const activePrices = service.service_packages.filter(p=>p.is_active && p.price_inr != null).map(p=>p.price_inr);
      price.textContent = service.pricing_type === "quote" ? "Custom quote" : money(service.starting_price_inr || Math.min(...activePrices)) + " starting";
      card.append(price);
      const list = document.createElement("div"); list.className = "packages";
      service.service_packages.filter(p=>p.is_active).forEach(pkg => {
        const row = document.createElement("div"); row.className = "package";
        const info = document.createElement("div"); info.className = "package-info";
        const title = document.createElement("div"); title.className = "package-title";
        const name = document.createElement("span"); name.textContent = pkg.name + (pkg.billing_period === "monthly" ? " · monthly" : ""); title.append(name);
        info.append(title);
        if (pkg.description) { const packageDesc = document.createElement("p"); packageDesc.className = "package-description"; packageDesc.textContent = pkg.description; info.append(packageDesc); }
        const cost = document.createElement("strong"); cost.textContent = service.pricing_type === "quote" ? "Quote" : money(pkg.price_inr);
        const button = document.createElement("button"); button.className = "choose"; button.type = "button"; button.textContent = "Choose";
        button.addEventListener("click",()=>selectPackage(service.id,pkg.id));
        row.append(info,cost,button); list.append(row);
      });
      card.append(list); catalog.append(card);
    });
    notice.textContent = "Choose a service and package, then submit your project request. Monthly renewals are manual; no automatic deductions.";
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
    } catch(error) {
      notice.textContent = "The service catalogue could not load. Please contact Digital World on +91 97124 24041.";
      console.error("Service catalogue:",error);
    }
  }
  form.addEventListener("submit",async event=>{
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data=new FormData(form); const payload=Object.fromEntries(data.entries());
    const service=services.find(s=>s.id===payload.service_id);
    const pkg=service?.service_packages.find(p=>p.id===payload.package_id && p.is_active);
    if(!service || !pkg){notice.textContent="Please choose a valid service and package.";return;}
    if(service.pricing_type==="quote" || !Number(pkg.price_inr) || Number(pkg.price_inr)<=0){
      notice.textContent="This package needs a confirmed custom quote before payment. Please contact Digital World first.";
      return;
    }
    submitButton.disabled=true; submitButton.textContent="Submitting order and payment reference…";
    try {
      const {data:result,error}=await client.rpc("submit_public_service_order",{
        p_customer_name:payload.customer_name.trim(),
        p_customer_email:payload.customer_email.trim(),
        p_customer_phone:payload.customer_phone.trim(),
        p_business_name:payload.business_name.trim()||null,
        p_service_id:payload.service_id,
        p_package_id:payload.package_id,
        p_requirements:payload.requirements.trim()||null,
        p_utr_reference:payload.utr_reference.trim(),
        p_reference_details:payload.reference_details.trim()
      });
      if(error) throw error;
      trackEvent("generate_lead", {currency:"INR",value:Number(result.amount_due_inr||0),service_name:service.name,package_name:pkg.name});
      trackEvent("payment_reference_submitted",{currency:"INR",value:Number(result.amount_due_inr||0),payment_method:"upi"});
      form.reset(); packageSelect.innerHTML='<option value="">Choose a package</option>'; packageSelect.disabled=true;
      paymentQr.src="images/payment-qr-placeholder.svg"; paymentAmount.textContent="Select a package to see the amount";
      notice.textContent="Your service request and UPI reference have been received. Order: "+result.order_number+". Payment status: pending manual verification.";
      notice.scrollIntoView({behavior:"smooth",block:"center"});
    } catch(error) {
      notice.textContent="We could not submit the order and payment reference together. Please check the UTR details or call +91 97124 24041.";
      console.error("Order / payment submission:",error);
    } finally {submitButton.textContent="Submit service request";syncSubmitState();}
  });
  init();
})();