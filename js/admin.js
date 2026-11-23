(() => {
const URL="https://lvbesvjeiaxudhsajyuc.supabase.co", KEY="sb_publishable_EhHpIAzaJC3y7MBkcv0wDQ_Vz8kXsnR";
const db=window.supabase.createClient(URL,KEY), login=document.getElementById("login-panel"), dash=document.getElementById("dashboard");
const msg=document.getElementById("login-message"), adminMsg=document.getElementById("admin-message"), list=document.getElementById("orders-list");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const rupees=n=>n==null?"Quote required":new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
async function access(){
 const {data:{user},error}=await db.auth.getUser(); if(error||!user){login.hidden=false;dash.hidden=true;return;}
 const {data:profile,error:e}=await db.from("user_profiles").select("*").eq("user_id",user.id).maybeSingle();
 if(e||!profile||!["admin","super_admin"].includes(profile.role)){await db.auth.signOut();login.hidden=false;dash.hidden=true;msg.textContent="This account is not authorised. Admin role is required.";return;}
 login.hidden=true;dash.hidden=false;await load();
}
async function load(){
 if(!document.getElementById("cards-panel").hidden){await loadCards();return;}
 adminMsg.textContent="Loading…";
 const {data,error}=await db.from("orders").select("id,order_number,customer_name,customer_email,customer_phone,business_name,requirements,service_snapshot,amount_due_inr,quoted_amount_inr,status,payment_status,created_at,payment_transactions(id,provider,amount_inr,status,utr_reference,reference_details,upi_id,submitted_at,verified_at,verification_note),package_access_grants(id,access_status,granted_at)").order("created_at",{ascending:false}).limit(100);
 if(error){adminMsg.textContent="Could not load orders. Check admin database permissions.";return;}
 list.innerHTML="";
 if(!data?.length){list.textContent="No orders yet.";adminMsg.textContent="";return;}
 data.forEach(o=>{
 const pay=(o.payment_transactions||[]).sort((a,b)=>new Date(b.submitted_at||0)-new Date(a.submitted_at||0))[0];
 const card=document.createElement("article");card.className="order-card";
 card.innerHTML='<div class="order-title"><div><strong>'+esc(o.order_number||o.id)+'</strong><span>'+esc(new Date(o.created_at).toLocaleString("en-IN"))+'</span></div><b class="status">'+esc(o.payment_status)+'</b></div><div class="order-grid"><div><small>Customer</small><b>'+esc(o.customer_name)+'</b><span>'+esc(o.customer_phone)+' · '+esc(o.customer_email)+'</span></div><div><small>Service / package</small><b>'+esc((o.service_snapshot?.service_name||'Service')+' · '+(o.service_snapshot?.package_name||'Custom quote'))+'</b></div><div><small>Amount due</small><b>'+esc(rupees(o.amount_due_inr??o.quoted_amount_inr))+'</b></div><div><small>Order status</small><b>'+esc(o.status)+'</b></div><div><small>Business</small><b>'+esc(o.business_name||"—")+'</b></div></div><p class="requirements">'+esc(o.requirements||"No additional requirements.")+'</p>';
 if(o.package_access_grants?.length){const grant=o.package_access_grants[0];card.innerHTML+='<div class="payment-details"><b>Package access · '+esc(grant.access_status)+'</b><span>Granted: '+esc(new Date(grant.granted_at).toLocaleString("en-IN"))+'</span></div>'; }
 if(pay){card.innerHTML+='<div class="payment-details"><b>UPI payment · '+esc(pay.status)+' · '+esc(rupees(pay.amount_inr))+'</b><span>UTR: '+esc(pay.utr_reference||"Not submitted")+'</span><span>Reference details: '+esc(pay.reference_details||"—")+'</span><span>Submitted: '+esc(pay.submitted_at?new Date(pay.submitted_at).toLocaleString("en-IN"):"—")+'</span><span>UPI ID: '+esc(pay.upi_id||"—")+'</span></div>';}
 if(o.payment_status!=="paid"&&["awaiting_quote","quoted"].includes(o.status)){
 const quoteBox=document.createElement("div");quoteBox.className="payment-details";
 const quoteLabel=document.createElement("label");quoteLabel.textContent="Set / update quote (INR)";
 const quoteInput=document.createElement("input");quoteInput.type="number";quoteInput.min="1";quoteInput.step="1";quoteInput.required=true;quoteInput.placeholder="Enter final agreed amount";quoteInput.value=o.quoted_amount_inr??"";
 quoteLabel.append(quoteInput);
 const quoteButton=document.createElement("button");quoteButton.textContent="Save quote";
 quoteButton.addEventListener("click",async()=>{
  const amount=Number(quoteInput.value);
  if(!Number.isSafeInteger(amount)||amount<=0){adminMsg.textContent="Enter a valid whole-rupee amount.";return;}
  if(!confirm("Save quote of "+rupees(amount)+" for "+(o.order_number||o.id)+"? This does not mark the order paid."))return;
  quoteButton.disabled=true;adminMsg.textContent="Saving quote…";
  const {error}=await db.rpc("admin_set_order_quote",{p_order_id:o.id,p_amount_inr:amount,p_note:null});
  if(error){adminMsg.textContent="Could not save quote: "+error.message;quoteButton.disabled=false;return;}
  await load();
 });
 quoteBox.append(quoteLabel,quoteButton);
 if(o.amount_due_inr!=null){
  const copy=document.createElement("button");copy.className="secondary";copy.textContent="Copy quote & UPI instructions";
  copy.addEventListener("click",async()=>{
   const message="Digital World quote for order "+(o.order_number||o.id)+": "+rupees(o.amount_due_inr)+". Pay to UPI ID 9712424041@ybl (Payee: ANJARA RAKESHBHAI PALJIBHAI). After payment, WhatsApp the UTR / transaction reference with this order number. Work/payment confirmation happens only after our bank / PhonePe credit is manually verified.";
   try{await navigator.clipboard.writeText(message);adminMsg.textContent="Quote and UPI instructions copied. Send them to the customer yourself.";}catch{adminMsg.textContent=message;}
  });
  quoteBox.append(copy);
  const utrLabel=document.createElement("label");utrLabel.textContent="Customer UTR received by WhatsApp";
  const utrInput=document.createElement("input");utrInput.minLength=8;utrInput.maxLength=64;utrInput.placeholder="Enter exact UTR / transaction reference";utrLabel.append(utrInput);
  const record=document.createElement("button");record.textContent="Record customer UTR";
  record.addEventListener("click",async()=>{
   const utr=utrInput.value.trim();
   if(utr.length<8||utr.length>64){adminMsg.textContent="UTR must be 8–64 characters.";return;}
   if(!confirm("Record this customer-provided UTR as pending verification? It will NOT mark the order paid."))return;
   record.disabled=true;
   const {error}=await db.from("payment_transactions").insert({order_id:o.id,provider:"phonepe_upi",amount_inr:o.amount_due_inr,currency:"INR",status:"pending_verification",upi_id:"9712424041@ybl",utr_reference:utr,submitted_at:new Date().toISOString()});
   if(error){adminMsg.textContent="Could not record UTR: "+error.message;record.disabled=false;return;}
   await load();
  });
  quoteBox.append(utrLabel,record);
 }
 card.append(quoteBox);
 }
 if(pay&&pay.status==="pending_verification"&&o.payment_status!=="paid"){
 const note=document.createElement("input");note.placeholder="Optional verification note";note.className="verify-note";
 const actions=document.createElement("div");actions.className="verify-actions";
 const yes=document.createElement("button");yes.textContent="Confirm payment received";yes.addEventListener("click",()=>verify(o,pay,note.value));
 const no=document.createElement("button");no.textContent="Reject / not received";no.className="secondary";no.addEventListener("click",()=>reject(pay,note.value));
 actions.append(yes,no);card.append(note,actions);
 } else if(!pay){const noPay=document.createElement("p");noPay.className="muted";noPay.textContent="No UPI reference submitted.";card.append(noPay);}
 list.append(card);
 });
 const pending=data.filter(o=>o.payment_status!=="paid"&&(o.payment_transactions||[]).some(p=>p.status==="pending_verification")); adminMsg.textContent=pending.length+" payment approvals pending · "+data.length+" recent orders";
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
 const {data,error}=await db.from("business_cards").select("id,slug,business_name,owner_name,contact_email,contact_mobile,plan_code,card_status,trial_ends_at,valid_until,created_at,business_card_payments(id,amount_inr,shipping_inr,utr_reference,reference_details,payment_status,created_at)").order("created_at",{ascending:false}).limit(200);
 if(error){adminMsg.textContent="Could not load business cards: "+error.message;return;}
 const cards=document.getElementById("cards-list");cards.innerHTML="";
 (data||[]).forEach(c=>{
  const p=(c.business_card_payments||[]).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0];
  const el=document.createElement("article");el.className="order-card";
  const publicUrl=new URL("public-card.html?card="+encodeURIComponent(c.slug),location.href).href;
  el.innerHTML='<div class="order-title"><div><strong>'+esc(c.business_name)+'</strong><span>'+esc(c.owner_name)+' · '+esc(c.contact_email)+'</span></div><b class="status">'+esc(c.card_status)+'</b></div><div class="order-grid"><div><small>Mobile</small><b>'+esc(c.contact_mobile||"—")+'</b></div><div><small>Plan</small><b>'+esc(c.plan_code==="with-nfc"?"With NFC · ₹499 + ₹59 shipping":"Without NFC · ₹299")+'</b></div><div><small>Trial ends</small><b>'+esc(new Date(c.trial_ends_at).toLocaleDateString("en-IN"))+'</b></div><div><small>Valid until</small><b>'+esc(c.valid_until?new Date(c.valid_until).toLocaleDateString("en-IN"):"Not activated")+'</b></div></div><p><a href="'+esc(publicUrl)+'" target="_blank" rel="noopener">Open public card ↗</a></p>';
  if(p){el.innerHTML+='<div class="payment-details"><b>Payment · '+esc(p.payment_status)+' · ₹'+esc(p.amount_inr)+'</b><span>UTR: '+esc(p.utr_reference||"Not submitted")+'</span><span>'+esc(p.reference_details||"")+'</span></div>';}
  const actions=document.createElement("div");actions.className="verify-actions";
  if(p&&p.payment_status==="pending_verification"){const verify=document.createElement("button");verify.textContent="Verify payment & activate 5 years";verify.addEventListener("click",async()=>{if(!confirm("Confirm that the matching payment is visible in the bank/UPI account? This activates the card for 5 years."))return;verify.disabled=true;const {error}=await db.rpc("admin_verify_business_card_payment",{p_payment_id:p.id,p_note:null});if(error){adminMsg.textContent=error.message;verify.disabled=false;return;}await loadCards();});actions.append(verify);}
  if(c.card_status!=="suspended"){const suspend=document.createElement("button");suspend.className="secondary";suspend.textContent="Suspend";suspend.addEventListener("click",async()=>{if(!confirm("Suspend this business card?"))return;const {error}=await db.rpc("admin_set_business_card_status",{p_card_id:c.id,p_status:"suspended",p_note:null});adminMsg.textContent=error?error.message:"Card suspended.";if(!error)await loadCards();});actions.append(suspend);}

  el.append(actions);cards.append(el);
 });
 adminMsg.textContent=(data||[]).length+" business cards";
}
document.getElementById("show-orders").addEventListener("click",()=>{document.getElementById("orders-panel").hidden=false;document.getElementById("cards-panel").hidden=true;load();});
document.getElementById("show-cards").addEventListener("click",()=>{document.getElementById("orders-panel").hidden=true;document.getElementById("cards-panel").hidden=false;loadCards();});
document.getElementById("refresh").addEventListener("click",()=>document.getElementById("cards-panel").hidden?load():loadCards());
document.getElementById("login-form").addEventListener("submit",async e=>{e.preventDefault();msg.textContent="Signing in…";const f=new FormData(e.currentTarget);const {error}=await db.auth.signInWithPassword({email:f.get("email"),password:f.get("password")});if(error){msg.textContent="Sign in failed. Check credentials or admin access.";return;}await access();});
document.getElementById("signout").addEventListener("click",async()=>{await db.auth.signOut();await access();});

access();
})();