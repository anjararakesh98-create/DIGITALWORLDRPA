(() => {
const URL="https://lvbesvjeiaxudhsajyuc.supabase.co", KEY="sb_publishable_EhHpIAzaJC3y7MBkcv0wDQ_Vz8kXsnR";
const db=window.supabase.createClient(URL,KEY), login=document.getElementById("login-panel"), dash=document.getElementById("dashboard");
const msg=document.getElementById("login-message"), adminMsg=document.getElementById("admin-message"), list=document.getElementById("orders-list");
let activeSection="clients";
let clientRows=[];
let orderRows=[];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const rupees=n=>n==null?"Quote required":new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
const ADMIN_EMAIL="anjararakesh98@gmail.com";

const passwordInput=document.getElementById("admin-password");
document.getElementById("show-admin-password").addEventListener("change",e=>{passwordInput.type=e.target.checked?"text":"password";});
document.getElementById("forgot-admin-password").addEventListener("click",async()=>{
 const email=document.querySelector('#login-form input[name="email"]').value.trim().toLowerCase();
 if(!email){msg.textContent="Enter your Admin email address first.";return;}
 msg.textContent="Sending password reset email…";
 const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
 msg.textContent=error?"Could not send reset email: "+error.message:"If this email is registered for Admin access, a password reset link has been sent.";
});
const resetForm=document.getElementById("admin-reset-form");
document.getElementById("cancel-admin-reset").addEventListener("click",()=>{resetForm.hidden=true;document.getElementById("login-form").hidden=false;});
resetForm.addEventListener("submit",async e=>{
 e.preventDefault();const password=new FormData(resetForm).get("new_password");
 if(String(password).length<8){msg.textContent="Use at least 8 characters.";return;}
 const {error}=await db.auth.updateUser({password:String(password)});
 if(error){msg.textContent="Password update failed: "+error.message;return;}
 await db.auth.signOut();resetForm.reset();resetForm.hidden=true;document.getElementById("login-form").hidden=false;msg.textContent="Password updated. Sign in with your new password.";
});
db.auth.onAuthStateChange((event)=>{
 if(event==="PASSWORD_RECOVERY"){
  login.hidden=false;dash.hidden=true;document.getElementById("login-form").hidden=true;resetForm.hidden=false;msg.textContent="Choose a new password for your Admin account.";
 }
});

async function access(){
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user){login.hidden=false;dash.hidden=true;return;}
 if(String(user.email||"").trim().toLowerCase()!==ADMIN_EMAIL){
  await db.auth.signOut();
  login.hidden=false;dash.hidden=true;
  msg.textContent="Access denied. This account is not authorised for the Admin Dashboard.";
  return;
 }
 const {data:profile,error:e}=await db.from("user_profiles").select("user_id,role").eq("user_id",user.id).maybeSingle();
 if(e||!profile||!["admin","super_admin"].includes(profile.role)){
  await db.auth.signOut();login.hidden=false;dash.hidden=true;
  msg.textContent="Admin account verification failed. Contact the site owner.";
  return;
 }
 login.hidden=true;dash.hidden=false;await showSection("clients");
}
async function load(){
 if(!document.getElementById("cards-panel").hidden){await loadCards();return;}
 adminMsg.textContent="Loading service orders…";
 const {data,error}=await db.from("orders").select("id,order_number,customer_name,customer_email,customer_phone,business_name,requirements,service_snapshot,amount_due_inr,quoted_amount_inr,status,payment_status,created_at,payment_transactions(id,provider,amount_inr,status,utr_reference,reference_details,upi_id,submitted_at,verified_at,verification_note),package_access_grants(id,access_status,granted_at)").order("created_at",{ascending:false}).limit(250);
 if(error){adminMsg.textContent="Could not load orders. Check admin database permissions.";return;}
 orderRows=data||[];
 renderOrders();
}
function renderOrders(){
 const list=document.getElementById("orders-list");list.innerHTML="";
 const q=(document.getElementById("order-search")?.value||"").trim().toLowerCase();
 const status=document.getElementById("order-status-filter")?.value||"all";
 const visibleOrders=orderRows.filter(o=>{
  const text=[o.order_number,o.customer_name,o.customer_email,o.customer_phone,o.business_name,o.service_snapshot?.service_name,o.service_snapshot?.package_name].join(" ").toLowerCase();
  const statusMatch=status==="all"||o.status===status;
  const sectionMatch=activeSection==="service-payments"?(o.payment_transactions||[]).length>0:activeSection==="payment-history"?((o.payment_transactions||[]).length>0||o.payment_status==="paid"):true;
  return statusMatch&&sectionMatch&&(!q||text.includes(q));
 });
 if(!visibleOrders.length){list.textContent=activeSection==="service-payments"?"No service payment records yet.":activeSection==="payment-history"?"No payment history yet.":"No matching service orders.";adminMsg.textContent="0 records shown";return;}
 visibleOrders.forEach(o=>{
  const pay=(o.payment_transactions||[]).sort((a,b)=>new Date(b.submitted_at||0)-new Date(a.submitted_at||0))[0];
  const card=document.createElement("article");card.className="order-card";
  card.innerHTML='<div class="order-title"><div><strong>'+esc(o.order_number||o.id)+'</strong><span>'+esc(new Date(o.created_at).toLocaleString("en-IN"))+'</span></div><b class="status">'+esc(o.status)+' · '+esc(o.payment_status)+'</b></div><div class="order-grid"><div><small>Customer</small><b>'+esc(o.customer_name)+'</b><span>'+esc(o.customer_phone)+' · '+esc(o.customer_email)+'</span></div><div><small>Service / package</small><b>'+esc((o.service_snapshot?.service_name||"Service")+" · "+(o.service_snapshot?.package_name||"Custom quote"))+'</b></div><div><small>Amount due</small><b>'+esc(rupees(o.amount_due_inr??o.quoted_amount_inr))+'</b></div><div><small>Business</small><b>'+esc(o.business_name||"—")+'</b></div></div><p class="requirements">'+esc(o.requirements||"No additional requirements.")+'</p>';
  if(o.package_access_grants?.length){const grant=o.package_access_grants[0];card.innerHTML+='<div class="payment-details"><b>Package access · '+esc(grant.access_status)+'</b><span>Granted: '+esc(new Date(grant.granted_at).toLocaleString("en-IN"))+'</span></div>';}
  if(pay){card.innerHTML+='<div class="payment-details"><b>Payment · '+esc(pay.status)+' · '+esc(rupees(pay.amount_inr))+'</b><span>Reference: '+esc(pay.utr_reference||"Not provided")+'</span><span>Submitted: '+esc(pay.submitted_at?new Date(pay.submitted_at).toLocaleString("en-IN"):"—")+'</span></div>';}
  const actions=document.createElement("div");actions.className="verify-actions admin-order-actions";
  const wa=document.createElement("a");wa.className="admin-action-link";wa.target="_blank";wa.rel="noopener";wa.href="https://wa.me/"+String(o.customer_phone||"").replace(/\D/g,"")+"?text="+encodeURIComponent("Hello "+o.customer_name+", regarding your Digital World order "+(o.order_number||"")+".");wa.textContent="WhatsApp customer";actions.append(wa);
  if(o.payment_status==="paid"&&["paid","in_progress","review"].includes(o.status)){
   const next=[{value:"in_progress",label:"Mark In Progress"},{value:"review",label:"Move to Review"},{value:"completed",label:"Mark Completed"}].filter(x=>x.value!==o.status);
   next.forEach(item=>{const b=document.createElement("button");b.type="button";b.className=item.value==="completed"?"":"secondary";b.textContent=item.label;b.addEventListener("click",()=>updateOrderStatus(o,item.value));actions.append(b);});
  }
  if(!["completed","cancelled","refunded"].includes(o.status)){const cancel=document.createElement("button");cancel.type="button";cancel.className="secondary";cancel.textContent="Cancel order";cancel.addEventListener("click",()=>updateOrderStatus(o,"cancelled"));actions.append(cancel);}
  card.append(actions);
  if(o.payment_status!=="paid"&&["awaiting_quote","quoted"].includes(o.status)){
   const quoteBox=document.createElement("div");quoteBox.className="payment-details";
   const quoteLabel=document.createElement("label");quoteLabel.textContent="Set / update quote (INR)";
   const quoteInput=document.createElement("input");quoteInput.type="number";quoteInput.min="1";quoteInput.step="1";quoteInput.required=true;quoteInput.placeholder="Enter final agreed amount";quoteInput.value=o.quoted_amount_inr??"";quoteLabel.append(quoteInput);
   const quoteButton=document.createElement("button");quoteButton.textContent="Save quote";
   quoteButton.addEventListener("click",async()=>{const amount=Number(quoteInput.value);if(!Number.isSafeInteger(amount)||amount<=0){adminMsg.textContent="Enter a valid whole-rupee amount.";return;}if(!confirm("Save quote of "+rupees(amount)+" for "+(o.order_number||o.id)+"?"))return;quoteButton.disabled=true;const {error}=await db.rpc("admin_set_order_quote",{p_order_id:o.id,p_amount_inr:amount,p_note:null});if(error){adminMsg.textContent="Could not save quote: "+error.message;quoteButton.disabled=false;return;}await load();});
   quoteBox.append(quoteLabel,quoteButton);card.append(quoteBox);
  }
  if(pay&&pay.status==="pending_verification"&&o.payment_status!=="paid"){
   const note=document.createElement("input");note.placeholder="Optional verification note";note.className="verify-note";
   const actions2=document.createElement("div");actions2.className="verify-actions";
   const yes=document.createElement("button");yes.textContent="Confirm payment received";yes.addEventListener("click",()=>verify(o,pay,note.value));
   const no=document.createElement("button");no.textContent="Reject / not received";no.className="secondary";no.addEventListener("click",()=>reject(pay,note.value));
   actions2.append(yes,no);card.append(note,actions2);
  }
  list.append(card);
 });
 const pending=orderRows.filter(o=>o.payment_status!=="paid"&&(o.payment_transactions||[]).some(p=>p.status==="pending_verification")).length;
 adminMsg.textContent=pending+" payment approvals pending · "+visibleOrders.length+" records shown";
}
async function updateOrderStatus(order,status){
 if(!confirm("Change order "+(order.order_number||order.id)+" to "+status.replaceAll("_"," ")+"?"))return;
 const {error}=await db.from("orders").update({status,updated_at:new Date().toISOString()}).eq("id",order.id);
 if(error){adminMsg.textContent="Order status update failed: "+error.message;return;}
 adminMsg.textContent="Order status updated.";await load();
}
async function verify(order,pay,note){
 if(!confirm("Confirm only after independently seeing the matching credit in PhonePe / bank statement. Mark this order PAID?"))return;
 adminMsg.textContent="Saving verification…";
 const {error}=await db.rpc("admin_verify_phonepe_payment",{p_payment_id:pay.id,p_note:note||null});
 if(error){adminMsg.textContent="Payment verification failed: "+error.message;return;}
 await load();
}
async function reject(pay,note){
 if(!confirm("Reject this UTR? This does not mark the order paid."))return;
 const {error}=await db.from("payment_transactions").update({status:"failed",verification_note:note||"Not matched in merchant account."}).eq("id",pay.id).eq("status","pending_verification");
 adminMsg.textContent=error?"Could not update payment. Check permissions.":"Reference marked as not verified.";
 if(!error)await load();
}
async function loadCards(){
 adminMsg.textContent="Loading business cards…";
 const {data,error}=await db.from("business_cards").select("id,slug,business_name,owner_name,contact_email,contact_mobile,plan_code,shipping_address,shipping_city,shipping_state,shipping_pincode,card_status,trial_ends_at,valid_until,created_at,business_card_payments(id,amount_inr,shipping_inr,utr_reference,reference_details,payment_status,created_at)").order("created_at",{ascending:false}).limit(200);
 if(error){adminMsg.textContent="Could not load business cards: "+error.message;return;}
 const cards=document.getElementById("cards-list");cards.innerHTML="";
 const filtered=(data||[]).filter(c=>{const p=(c.business_card_payments||[]).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0];const due=c.trial_ends_at&&new Date(c.trial_ends_at)<new Date()&&c.card_status!=="active";if(activeSection==="card-payments")return p&&p.payment_status==="pending_verification";if(activeSection==="active-cards")return c.card_status==="active";if(activeSection==="trial-cards")return c.card_status==="trial"&&!due;if(activeSection==="expired-cards")return ["expired","suspended"].includes(c.card_status)||due;if(activeSection==="nfc")return c.plan_code==="with-nfc";if(activeSection==="without-nfc")return c.plan_code==="without-nfc";return true;});
 filtered.forEach(c=>{
  const p=(c.business_card_payments||[]).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0];
  const el=document.createElement("article");el.className="order-card";
  const publicUrl=new URL("public-card.html?card="+encodeURIComponent(c.slug),location.href).href;
  el.innerHTML='<div class="order-title"><div><strong>'+esc(c.business_name)+'</strong><span>'+esc(c.owner_name)+' · '+esc(c.contact_email)+'</span></div><b class="status">'+esc(c.card_status)+'</b></div><div class="order-grid"><div><small>Mobile</small><b>'+esc(c.contact_mobile||"—")+'</b></div><div><small>Plan</small><b>'+esc(c.plan_code==="with-nfc"?"With NFC · ₹499 + ₹59 shipping":"Without NFC · ₹299")+'</b></div><div><small>Trial ends</small><b>'+esc(new Date(c.trial_ends_at).toLocaleDateString("en-IN"))+'</b></div><div><small>Valid until</small><b>'+esc(c.valid_until?new Date(c.valid_until).toLocaleDateString("en-IN"):"Not activated")+'</b></div></div><p><a href="'+esc(publicUrl)+'" target="_blank" rel="noopener">Open public card ↗</a></p>';
  if(p){el.innerHTML+='<div class="payment-details"><b>Payment · '+esc(p.payment_status)+' · ₹'+esc(p.amount_inr)+'</b><span>UTR: '+esc(p.utr_reference||"Not submitted")+'</span><span>'+esc(p.reference_details||"")+'</span></div>';}
   if(c.plan_code==="with-nfc"){const a={address:c.shipping_address,city:c.shipping_city,state:c.shipping_state,pincode:c.shipping_pincode};const delivery=document.createElement("div");delivery.className="payment-details";const label=document.createElement("b");label.textContent="NFC Delivery Address";const address=document.createElement("span");address.textContent=[a.address,a.city,a.state,a.pincode].filter(Boolean).join(", ")||"Not provided";delivery.append(label,address);el.append(delivery);}
  const actions=document.createElement("div");actions.className="verify-actions";
  if(p&&p.payment_status==="pending_verification"){const verify=document.createElement("button");verify.textContent="Verify payment & activate 5 years";verify.addEventListener("click",async()=>{if(!confirm("Confirm that the matching payment is visible in the bank/UPI account? This activates the card for 5 years."))return;verify.disabled=true;const {error}=await db.rpc("admin_verify_business_card_payment",{p_payment_id:p.id,p_note:null});if(error){adminMsg.textContent=error.message;verify.disabled=false;return;}await loadCards();});actions.append(verify);}
  if(c.card_status!=="suspended"){const suspend=document.createElement("button");suspend.className="secondary";suspend.textContent="Suspend";suspend.addEventListener("click",async()=>{if(!confirm("Suspend this business card?"))return;const {error}=await db.rpc("admin_set_business_card_status",{p_card_id:c.id,p_status:"suspended",p_note:null});adminMsg.textContent=error?error.message:"Card suspended.";if(!error)await loadCards();});actions.append(suspend);}

  el.append(actions);cards.append(el);
 });
 adminMsg.textContent=filtered.length+" business cards · "+(data||[]).length+" total";
}
async function loadStore(){
 const [{data:cards,error:cardError},{data:orders,error:orderError}] = await Promise.all([
  db.from("business_cards").select("id,plan_code,card_status"),
  db.from("orders").select("id,status,payment_status")
 ]);
 if(cardError||orderError){adminMsg.textContent="Could not load Store summary.";return;}
 const all=cards||[],os=orders||[];
 document.getElementById("store-summary").innerHTML='<div class="dw-admin-stat"><small>Digital Card Orders</small><b>'+all.length+'</b></div><div class="dw-admin-stat"><small>With NFC</small><b>'+all.filter(x=>x.plan_code==="with-nfc").length+'</b></div><div class="dw-admin-stat"><small>Without NFC</small><b>'+all.filter(x=>x.plan_code==="without-nfc").length+'</b></div><div class="dw-admin-stat"><small>Service Orders</small><b>'+os.length+'</b></div>';
 adminMsg.textContent="Store summary loaded";
}
async function loadCatalog(){
 adminMsg.textContent="Loading service catalogue…";
 const {data,error}=await db.from("services").select("id,name,slug,description,is_active,service_packages(id,name,price_inr,billing_period,is_active)").order("sort_order");
 if(error){adminMsg.textContent="Could not load service catalogue: "+error.message;return;}
 const box=document.getElementById("services-list");box.innerHTML="";
 (data||[]).forEach(service=>{
  const el=document.createElement("article");el.className="order-card";
  const head=document.createElement("div");head.className="order-title";head.innerHTML='<div><strong>'+esc(service.name)+'</strong><span>'+esc(service.slug)+'</span></div><b class="status">'+(service.is_active?"ACTIVE":"INACTIVE")+'</b>';el.append(head);
  const desc=document.createElement("p");desc.className="requirements";desc.textContent=service.description||"";el.append(desc);
  (service.service_packages||[]).forEach(pkg=>{
   const row=document.createElement("div");row.className="payment-details";
   const name=document.createElement("b");name.textContent=pkg.name+" · "+pkg.billing_period;
   const price=document.createElement("input");price.type="number";price.min="0";price.step="1";price.value=pkg.price_inr;price.setAttribute("aria-label","Package price in INR");
   const active=document.createElement("label");const check=document.createElement("input");check.type="checkbox";check.checked=pkg.is_active;active.append(check,document.createTextNode(" Active"));
   const save=document.createElement("button");save.textContent="Save package";save.addEventListener("click",async()=>{const amount=Number(price.value);if(!Number.isSafeInteger(amount)||amount<0){adminMsg.textContent="Enter a valid package price.";return;}save.disabled=true;const {error}=await db.from("service_packages").update({price_inr:amount,is_active:check.checked,updated_at:new Date().toISOString()}).eq("id",pkg.id);if(error){adminMsg.textContent="Could not update package: "+error.message;save.disabled=false;return;}adminMsg.textContent="Package updated.";await loadCatalog();});
   row.append(name,price,active,save);el.append(row);
  });
  const toggle=document.createElement("button");toggle.className="secondary";toggle.textContent=service.is_active?"Deactivate service":"Activate service";toggle.addEventListener("click",async()=>{const {error}=await db.from("services").update({is_active:!service.is_active,updated_at:new Date().toISOString()}).eq("id",service.id);if(error){adminMsg.textContent="Could not update service: "+error.message;return;}await loadCatalog();});
  el.append(toggle);box.append(el);
 });
 adminMsg.textContent=(data||[]).length+" services loaded";
}

async function loadLeads(){
 adminMsg.textContent="Loading client enquiries…";
 const {data,error}=await db.from("business_card_leads").select("id,card_id,name,phone,email,message,source,created_at").order("created_at",{ascending:false}).limit(200);
 if(error){adminMsg.textContent="Could not load client enquiries: "+error.message;return;}
 const box=document.getElementById("leads-list");box.innerHTML="";
 (data||[]).forEach(x=>{const el=document.createElement("article");el.className="order-card";el.innerHTML='<div class="order-title"><div><strong>'+esc(x.name)+'</strong><span>'+esc(new Date(x.created_at).toLocaleString("en-IN"))+'</span></div><b class="status">'+esc(x.source||"Website")+'</b></div><div class="order-grid"><div><small>Phone</small><b>'+esc(x.phone||"—")+'</b></div><div><small>Email</small><b>'+esc(x.email||"—")+'</b></div></div><p class="requirements">'+esc(x.message||"No message")+'</p>';box.append(el);});
 adminMsg.textContent=(data||[]).length+" enquiries";
}
async function loadAudit(){
 adminMsg.textContent="Loading admin audit history…";
 const {data,error}=await db.from("admin_audit_logs").select("id,actor_user_id,action,entity_type,entity_id,details,created_at").order("created_at",{ascending:false}).limit(200);
 if(error){adminMsg.textContent="Could not load audit history: "+error.message;return;}
 const box=document.getElementById("audit-list");box.innerHTML="";
 (data||[]).forEach(x=>{const el=document.createElement("article");el.className="order-card";const details=typeof x.details==="string"?x.details:JSON.stringify(x.details||{});el.innerHTML='<div class="order-title"><div><strong>'+esc(x.action)+'</strong><span>'+esc(new Date(x.created_at).toLocaleString("en-IN"))+'</span></div><b class="status">'+esc(x.entity_type||"Record")+'</b></div><div class="order-grid"><div><small>Actor ID</small><b>'+esc(x.actor_user_id||"—")+'</b></div><div><small>Entity ID</small><b>'+esc(x.entity_id||"—")+'</b></div></div><p class="requirements">'+esc(details)+'</p>';box.append(el);});
 adminMsg.textContent=(data||[]).length+" audit events";
}


async function loadAdminUsers(){
 adminMsg.textContent="Loading authorised admin accounts…";
 const {data,error}=await db.from("user_profiles").select("user_id,full_name,role,created_at").in("role",["admin","super_admin"]).order("created_at",{ascending:false});
 if(error){adminMsg.textContent="Could not load admin users: "+error.message;return;}
 const box=document.getElementById("admin-users-list");box.innerHTML="";
 (data||[]).forEach(x=>{const el=document.createElement("article");el.className="order-card";el.innerHTML='<div class="order-title"><div><strong>'+esc(x.full_name||"Admin account")+'</strong><span>'+esc(x.user_id)+'</span></div><b class="status">'+esc(x.role)+'</b></div><small>Created: '+esc(x.created_at?new Date(x.created_at).toLocaleString("en-IN"):"—")+'</small>';box.append(el);});
 adminMsg.textContent=(data||[]).length+" authorised admin accounts · Read-only";
}

async function showSection(section){
 activeSection=section;
 document.querySelectorAll(".dw-admin-sidebar [data-section]").forEach(b=>b.classList.toggle("active",b.dataset.section===section));
 const ids=["clients-panel","cards-panel","orders-panel","store-panel","services-panel","nfc-panel","leads-panel","audit-panel","admin-users-panel"];ids.forEach(id=>{const el=document.getElementById(id);if(el)el.hidden=true;});
 const title=document.getElementById("section-title");const titles={"clients":"Client Dashboard / Overview","all-clients":"All Clients","store-orders":"Store Orders / Purchasing","cards":"Business Card Management","card-payments":"Business Card Payments","active-cards":"Active Cards","trial-cards":"Trial / Pending Cards","expired-cards":"Expired / Suspended Cards","store":"Store Management","orders":"Store Orders / Purchasing & Service Orders","nfc":"NFC Business Cards","without-nfc":"Without NFC Business Cards","services":"Services","service-payments":"Service Payments","payment-history":"Payment History","leads":"Client Leads & Enquiries","audit":"Admin Audit History","admin-users":"Admin Users"};
 title.textContent=titles[section]||"Admin Dashboard";
 if(section==="admin-users"){document.getElementById("admin-users-panel").hidden=false;await loadAdminUsers();return;}
 if(section==="leads"||section==="audit"){const panel=document.getElementById(section+"-panel");panel.hidden=false;if(section==="leads")await loadLeads();else await loadAudit();return;}
 if(section==="clients"||section==="all-clients"){document.getElementById("clients-panel").hidden=false;await loadClients(section==="clients");return;}
 if(["store","services"].includes(section)){document.getElementById(section+"-panel").hidden=false;if(section==="store")await loadStore();else await loadCatalog();return;}
 if(section==="nfc"){document.getElementById("cards-panel").hidden=false;await loadCards();return;}
 if(["cards","card-payments","active-cards","trial-cards","expired-cards","without-nfc"].includes(section)){document.getElementById("cards-panel").hidden=false;await loadCards();return;}
 document.getElementById("orders-panel").hidden=false;await load();
}
async function loadClients(showOverview=true){
 adminMsg.textContent="Loading client portfolio…";
 const {data,error}=await db.from("business_cards").select("id,slug,business_name,owner_name,contact_email,contact_mobile,plan_code,card_status,trial_ends_at,valid_until,created_at").order("created_at",{ascending:false}).limit(500);
 if(error){adminMsg.textContent="Could not load clients: "+error.message;return;}
 clientRows=data||[];
 const now=Date.now();
 const active=clientRows.filter(x=>x.card_status==="active").length;
 const trial=clientRows.filter(x=>x.card_status==="trial"&&new Date(x.trial_ends_at).getTime()>now).length;
 const pending=clientRows.filter(x=>x.card_status==="pending_payment").length;
 const suspended=clientRows.filter(x=>x.card_status==="suspended").length;
 const expired=clientRows.filter(x=>x.card_status==="expired"||(x.trial_ends_at&&new Date(x.trial_ends_at).getTime()<=now&&x.card_status!=="active")).length;
 document.getElementById("client-summary").innerHTML=showOverview?'<div class="dw-admin-stat"><small>Total Clients</small><b>'+clientRows.length+'</b></div><div class="dw-admin-stat"><small>Active Cards</small><b>'+active+'</b></div><div class="dw-admin-stat"><small>Free Trial</small><b>'+trial+'</b></div><div class="dw-admin-stat"><small>Payment Pending</small><b>'+pending+'</b></div><div class="dw-admin-stat"><small>Suspended</small><b>'+suspended+'</b></div><div class="dw-admin-stat"><small>Expired</small><b>'+expired+'</b></div>':"";
 renderClients();
}
function renderClients(){
 const box=document.getElementById("clients-list");box.innerHTML="";
 const q=(document.getElementById("client-search")?.value||"").trim().toLowerCase();
 const status=document.getElementById("client-status-filter")?.value||"all";
 const rows=clientRows.filter(c=>(status==="all"||c.card_status===status)&&(!q||[c.business_name,c.owner_name,c.contact_email,c.contact_mobile,c.slug].join(" ").toLowerCase().includes(q)));
 if(!rows.length){box.textContent="No matching client accounts.";adminMsg.textContent="0 clients shown";return;}
 rows.forEach(c=>{
  const el=document.createElement("article");el.className="order-card";
  const publicUrl=new URL("public-card.html?card="+encodeURIComponent(c.slug),location.href).href;
  el.innerHTML='<div class="order-title"><div><strong>'+esc(c.business_name)+'</strong><span>'+esc(c.owner_name)+' · '+esc(c.contact_email)+'</span></div><b class="status">'+esc(c.card_status)+'</b></div><div class="order-grid"><div><small>Mobile</small><b>'+esc(c.contact_mobile||"—")+'</b></div><div><small>Plan</small><b>'+esc(c.plan_code==="with-nfc"?"With NFC · ₹499 + ₹59 shipping":"Without NFC · ₹299")+'</b></div><div><small>Trial ends</small><b>'+esc(c.trial_ends_at?new Date(c.trial_ends_at).toLocaleDateString("en-IN"):"—")+'</b></div><div><small>Valid until</small><b>'+esc(c.valid_until?new Date(c.valid_until).toLocaleDateString("en-IN"):"Not activated")+'</b></div></div>';
  const actions=document.createElement("div");actions.className="verify-actions";
  const open=document.createElement("a");open.className="admin-action-link";open.href=publicUrl;open.target="_blank";open.rel="noopener";open.textContent="Open public card";actions.append(open);
  if(c.contact_mobile){const wa=document.createElement("a");wa.className="admin-action-link";wa.href="https://wa.me/"+c.contact_mobile.replace(/\D/g,"");wa.target="_blank";wa.rel="noopener";wa.textContent="WhatsApp client";actions.append(wa);}
  if(c.card_status!=="suspended"&&c.card_status!=="expired"){const suspend=document.createElement("button");suspend.type="button";suspend.className="secondary";suspend.textContent="Suspend card";suspend.addEventListener("click",async()=>{if(!confirm("Suspend "+c.business_name+"'s card?"))return;suspend.disabled=true;const {error}=await db.rpc("admin_set_business_card_status",{p_card_id:c.id,p_status:"suspended",p_note:"Admin dashboard action"});if(error){adminMsg.textContent="Could not suspend card: "+error.message;suspend.disabled=false;return;}await loadClients(activeSection==="clients");});actions.append(suspend);}
  if(c.card_status==="suspended"){const restore=document.createElement("button");restore.type="button";restore.textContent="Restore card";restore.addEventListener("click",async()=>{const now=new Date(),trialEnd=new Date(c.trial_ends_at),validUntil=c.valid_until?new Date(c.valid_until):null;const next=validUntil&&validUntil>now?"active":trialEnd>now?"trial":"expired";if(!confirm("Restore "+c.business_name+"'s card to "+next+"?"))return;restore.disabled=true;const {error}=await db.from("business_cards").update({card_status:next,updated_at:now.toISOString()}).eq("id",c.id);if(error){adminMsg.textContent="Could not restore card: "+error.message;restore.disabled=false;return;}await loadClients(activeSection==="clients");});actions.append(restore);}
  el.append(actions);box.append(el);
 });
 adminMsg.textContent=rows.length+" of "+clientRows.length+" client accounts";
}
document.querySelectorAll(".dw-admin-sidebar [data-section]").forEach(b=>b.addEventListener("click",()=>showSection(b.dataset.section)));
document.getElementById("refresh").addEventListener("click",()=>showSection(activeSection));
document.getElementById("client-search").addEventListener("input",renderClients);
document.getElementById("client-status-filter").addEventListener("change",renderClients);
document.getElementById("order-search").addEventListener("input",renderOrders);
document.getElementById("order-status-filter").addEventListener("change",renderOrders);
document.getElementById("login-form").addEventListener("submit",async e=>{e.preventDefault();msg.textContent="Signing in…";const f=new FormData(e.currentTarget);const {error}=await db.auth.signInWithPassword({email:f.get("email"),password:f.get("password")});if(error){msg.textContent="Sign in failed. Check credentials or admin access.";return;}await access();});
document.getElementById("signout").addEventListener("click",async()=>{await db.auth.signOut();await access();});

if(!location.hash.includes("type=recovery"))access();
})();