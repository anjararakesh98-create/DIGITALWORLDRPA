(() => {
  const SUPABASE_URL = "https://lvbesvjeiaxudhsajyuc.supabase.co";
  const SUPABASE_KEY = "sb_publishable_EhHpIAzaJC3y7MBkcv0wDQ_Vz8kXsnR";
  const UPI_ID = "9712424041@ybl";
  const PAYEE = "ANJARA RAKESHBHAI PALJIBHAI";
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const notice = document.getElementById("notice");
  const catalog = document.getElementById("catalog");
  const serviceSelect = document.getElementById("service-select");
  const packageSelect = document.getElementById("package-select");
  const form = document.getElementById("order-form");
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
    document.getElementById("order").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function populatePackages() {
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
    catalog.innerHTML = ""; serviceSelect.innerHTML = '<option value="">Choose a service</option>';
    services.forEach(service => {
      const opt = document.createElement("option"); opt.value = service.id; opt.textContent = service.name; serviceSelect.append(opt);
      const card = document.createElement("article"); card.className = "service";
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
        const name = document.createElement("span"); name.textContent = pkg.name + (pkg.billing_period === "monthly" ? " · monthly" : "");
        title.append(name);
        if (pkg.slug === "standard") {
          const badge = document.createElement("span"); badge.className = "recommended-badge"; badge.textContent = "Recommended"; title.append(badge);
        }
        info.append(title);
        if (pkg.description) {
          const packageDesc = document.createElement("p"); packageDesc.className = "package-description"; packageDesc.textContent = pkg.description; info.append(packageDesc);
        }
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
    } catch(error) {
      notice.textContent = "The service catalogue could not load. Please contact Digital World on +91 97124 24041.";
      console.error("Service catalogue:",error);
    }
  }
  function showPayment(orderId, amount) {
    const panel = document.createElement("section"); panel.className = "payment-panel"; panel.id = "payment-panel";
    const heading = document.createElement("h2"); heading.textContent = "Complete your UPI payment"; panel.append(heading);
    const intro = document.createElement("p"); intro.textContent = "Scan this QR using PhonePe, Google Pay or another UPI app. Verify the payee name before paying."; panel.append(intro);
    const qr = document.createElement("img"); qr.alt = "UPI payment QR for Digital World order"; qr.width=240; qr.height=240; qr.loading="lazy";
    const upi = "upi://pay?pa="+encodeURIComponent(UPI_ID)+"&pn="+encodeURIComponent(PAYEE)+"&am="+encodeURIComponent(Number(amount).toFixed(2))+"&cu=INR&tn="+encodeURIComponent("Digital World "+orderId);
    qr.src = "https://api.qrserver.com/v1/create-qr-code/?size=240x240&data="+encodeURIComponent(upi);
    panel.append(qr);
    const payee = document.createElement("p"); payee.textContent = "Payee: "+PAYEE; panel.append(payee);
    const idrow = document.createElement("p"); idrow.textContent = "UPI ID: "+UPI_ID+" ";
    const copy = document.createElement("button"); copy.type="button"; copy.textContent="Copy UPI ID";
    copy.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(UPI_ID);copy.textContent="Copied";}catch{copy.textContent="Copy unavailable";}});
    idrow.append(copy); panel.append(idrow);
    const amountLine = document.createElement("p"); amountLine.textContent = "Amount: "+money(amount); panel.append(amountLine);
    const warning = document.createElement("p"); warning.className="payment-warning"; warning.textContent="After paying, enter the UTR / UPI transaction reference below. Your order remains unpaid until Digital World manually verifies the credit in its bank / PhonePe account."; panel.append(warning);
    const utrForm=document.createElement("form"); utrForm.className="utr-form";
    const label=document.createElement("label"); label.textContent="UPI UTR / Transaction reference";
    const input=document.createElement("input"); input.name="utr"; input.required=true; input.minLength=8; input.maxLength=64; input.autocomplete="off"; input.placeholder="Enter the UTR shown by your UPI app"; label.append(input);
    const submit=document.createElement("button"); submit.type="submit"; submit.textContent="Submit payment reference";
    utrForm.append(label,submit);
    const status=document.createElement("p"); status.setAttribute("role","status"); utrForm.append(status);
    utrForm.addEventListener("submit",async e=>{
      e.preventDefault(); submit.disabled=true; status.textContent="Submitting reference…";
      const utr=input.value.trim();
      try {
        const {error}=await client.from("payment_transactions").insert({order_id:orderId,provider:"phonepe_upi",amount_inr:amount,status:"pending_verification",currency:"INR",upi_id:UPI_ID,utr_reference:utr,submitted_at:new Date().toISOString()});
        if(error) throw error;
        trackEvent("payment_reference_submitted", {currency: "INR", value: Number(amount), payment_method: "upi"});
        status.textContent="Reference received. The order is still unpaid until Digital World verifies the payment.";
        input.disabled=true; submit.textContent="Reference submitted";
      } catch(err) { status.textContent="Could not submit. Check the UTR and contact +91 97124 24041."; console.error("UTR submission:",err); submit.disabled=false; }
    });
    panel.append(utrForm);
    document.getElementById("order").after(panel);
    panel.scrollIntoView({behavior:"smooth",block:"start"});
  }
  form.addEventListener("submit",async event=>{
    event.preventDefault();
    const button=document.getElementById("submit"); const data=new FormData(form); const payload=Object.fromEntries(data.entries());
    const service=services.find(s=>s.id===payload.service_id);
    const pkg=service?.service_packages.find(p=>p.id===payload.package_id && p.is_active);
    if(!service || !pkg){notice.textContent="Please choose a valid service and package.";return;}
    button.disabled=true; button.textContent="Submitting…";
    try {
      const orderId=crypto.randomUUID();
      const {error}=await client.from("orders").insert({id:orderId,customer_name:payload.customer_name.trim(),customer_email:payload.customer_email.trim(),customer_phone:payload.customer_phone.trim(),business_name:payload.business_name.trim()||null,service_id:payload.service_id,package_id:payload.package_id,requirements:payload.requirements.trim()||null});
      if(error) throw error;
      trackEvent("generate_lead", {currency: "INR", value: Number(pkg.price_inr || 0), service_name: service.name, package_name: pkg.name});
      form.reset(); packageSelect.innerHTML='<option value="">Choose a package</option>'; packageSelect.disabled=true;
      notice.textContent="Your order request has been received. Order reference: "+orderId+".";
      if(service.pricing_type==="quote" || pkg.price_inr==null || Number(pkg.price_inr)<=0) {
        notice.textContent += " This package requires a custom quote; Digital World will contact you before payment.";
      } else {
        showPayment(orderId,Math.round(Number(pkg.price_inr)));
      }
      notice.scrollIntoView({behavior:"smooth",block:"center"});
    } catch(error) {
      notice.textContent="We could not submit your request. Please call +91 97124 24041 or email digitalworldrpa@gmail.com.";
      console.error("Order submission:",error);
    } finally {button.disabled=false;button.textContent="Submit service request";}
  });
  init();
})();