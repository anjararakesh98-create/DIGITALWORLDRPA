(() => {
  const SUPABASE_URL = "https://lvbesvjeiaxudhsajyuc.supabase.co";
  const SUPABASE_KEY = "sb_publishable_EhHpIAzaJC3y7MBkcv0wDQ_Vz8kXsnR";
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const notice = document.getElementById("notice");
  const catalog = document.getElementById("catalog");
  const serviceSelect = document.getElementById("service-select");
  const packageSelect = document.getElementById("package-select");
  const form = document.getElementById("order-form");
  let services = [];
  const money = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
  function selectPackage(serviceId, packageId) {
    serviceSelect.value = serviceId;
    populatePackages();
    packageSelect.value = packageId;
    document.getElementById("order").scrollIntoView({behavior:"smooth",block:"start"});
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
  }
  serviceSelect.addEventListener("change", populatePackages);
  function render() {
    catalog.innerHTML = "";
    serviceSelect.innerHTML = '<option value="">Choose a service</option>';
    services.forEach(service => {
      const opt = document.createElement("option"); opt.value = service.id; opt.textContent = service.name; serviceSelect.append(opt);
      const card = document.createElement("article"); card.className = "service";
      const heading = document.createElement("h3"); heading.textContent = service.name; card.append(heading);
      const desc = document.createElement("p"); desc.textContent = service.description || "A Digital World service for small and growing businesses."; card.append(desc);
      const price = document.createElement("div"); price.className = "price";
      price.innerHTML = service.pricing_type === "quote" ? 'Custom <small>· based on requirements</small>' : money(service.starting_price_inr || Math.min(...service.service_packages.map(p=>p.price_inr))) + ' <small>starting</small>';
      card.append(price);
      const list = document.createElement("div"); list.className = "packages";
      service.service_packages.filter(p=>p.is_active).forEach(pkg => {
        const row = document.createElement("div"); row.className = "package";
        const name = document.createElement("span"); name.textContent = pkg.name + (pkg.billing_period === "monthly" ? " · monthly" : "");
        const cost = document.createElement("strong"); cost.textContent = service.pricing_type === "quote" ? "Quote" : money(pkg.price_inr);
        row.append(name,cost);
        const button = document.createElement("button"); button.className = "choose"; button.type = "button"; button.textContent = "Choose";
        button.addEventListener("click",()=>selectPackage(service.id,pkg.id));
        row.append(button); list.append(row);
      });
      card.append(list); catalog.append(card);
    });
    notice.textContent = "Choose a service and package, then submit your project request. No automatic monthly deductions.";
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
  form.addEventListener("submit",async event=>{
    event.preventDefault();
    const button = document.getElementById("submit");
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());
    if(!payload.service_id || !payload.package_id) { notice.textContent="Please choose both a service and a package."; return; }
    button.disabled=true; button.textContent="Submitting…";
    try {
      const {error} = await client.from("orders").insert({
        customer_name:payload.customer_name.trim(),
        customer_email:payload.customer_email.trim(),
        customer_phone:payload.customer_phone.trim(),
        business_name:payload.business_name.trim() || null,
        service_id:payload.service_id,
        package_id:payload.package_id,
        requirements:payload.requirements.trim() || null
      });
      if(error) throw error;
      form.reset(); packageSelect.innerHTML='<option value="">Choose a package</option>'; packageSelect.disabled=true;
      notice.textContent="Your service request has been received. Digital World will contact you to confirm scope, timeline and secure payment details.";
      notice.scrollIntoView({behavior:"smooth",block:"center"});
    } catch(error) {
      notice.textContent="We could not submit your request. Please call +91 97124 24041 or email digitalworldrpa@gmail.com.";
      console.error("Order submission:",error);
    } finally { button.disabled=false; button.textContent="Submit service request"; }
  });
  init();
})();