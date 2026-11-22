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
 adminMsg.textContent="Loading…";
 const {data,error}=await db.from("orders").select("id,order_number,customer_name,customer_email,customer_phone,business_name,requirements,amount_due_inr,quoted_amount_inr,status,payment_status,created_at,payment_transactions(id,provider,amount_inr,status,utr_reference,upi_id,submitted_at,verified_at,verification_note)").order("created_at",{ascending:false}).limit(100);
 if(error){adminMsg.textContent="Could not load orders. Check admin database permissions.";return;}
 list.innerHTML="";
 if(!data?.length){list.textContent="No orders yet.";adminMsg.textContent="";return;}
 data.forEach(o=>{
 const pay=(o.payment_transactions||[]).sort((a,b)=>new Date(b.submitted_at||0)-new Date(a.submitted_at||0))[0];
 const card=document.createElement("article");card.className="order-card";
 card.innerHTML='<div class="order-title"><div><strong>'+esc(o.order_number||o.id)+'</strong><span>'+esc(new Date(o.created_at).toLocaleString("en-IN"))+'</span></div><b class="status">'+esc(o.payment_status)+'</b></div><div class="order-grid"><div><small>Customer</small><b>'+esc(o.customer_name)+'</b><span>'+esc(o.customer_phone)+' · '+esc(o.customer_email)+'</span></div><div><small>Amount due</small><b>'+esc(rupees(o.amount_due_inr??o.quoted_amount_inr))+'</b></div><div><small>Order status</small><b>'+esc(o.status)+'</b></div><div><small>Business</small><b>'+esc(o.business_name||"—")+'</b></div></div><p class="requirements">'+esc(o.requirements||"No additional requirements.")+'</p>';
 if(pay){card.innerHTML+='<div class="payment-details"><b>UPI payment · '+esc(pay.status)+'</b><span>UTR: '+esc(pay.utr_reference||"Not submitted")+'</span><span>Submitted: '+esc(pay.submitted_at?new Date(pay.submitted_at).toLocaleString("en-IN"):"—")+'</span><span>UPI ID: '+esc(pay.upi_id||"—")+'</span></div>';}
 if(pay&&pay.status==="pending_verification"&&o.payment_status!=="paid"){
 const note=document.createElement("input");note.placeholder="Optional verification note";note.className="verify-note";
 const actions=document.createElement("div");actions.className="verify-actions";
 const yes=document.createElement("button");yes.textContent="Confirm payment received";yes.addEventListener("click",()=>verify(o,pay,note.value));
 const no=document.createElement("button");no.textContent="Reject / not received";no.className="secondary";no.addEventListener("click",()=>reject(pay,note.value));
 actions.append(yes,no);card.append(note,actions);
 } else if(!pay){const noPay=document.createElement("p");noPay.className="muted";noPay.textContent="No UPI reference submitted.";card.append(noPay);}
 list.append(card);
 });
 adminMsg.textContent=data.length+" recent orders";
}
async function verify(order,pay,note){
 if(!confirm("Confirm only after independently seeing the matching credit in PhonePe / bank statement. Mark this order PAID?"))return;
 adminMsg.textContent="Saving verification…";
 const {error:e}=await db.from("payment_transactions").update({status:"verified",verified_at:new Date().toISOString(),verified_by:(await db.auth.getUser()).data.user.id,verification_note:note||null}).eq("id",pay.id).eq("status","pending_verification");
 if(e){adminMsg.textContent="Payment verification failed. Check admin permissions.";return;}
 const {error}=await db.from("orders").update({payment_status:"paid",status:"paid"}).eq("id",order.id).eq("payment_status","unpaid");
 if(error){adminMsg.textContent="Payment record verified, but order update failed. Contact support immediately.";return;}
 await load();
}
async function reject(pay,note){
 if(!confirm("Reject this UTR? This does not mark the order paid."))return;
 const {error}=await db.from("payment_transactions").update({status:"failed",verification_note:note||"Not matched in merchant account."}).eq("id",pay.id).eq("status","pending_verification");
 adminMsg.textContent=error?"Could not update payment. Check permissions.":"Reference marked as not verified.";
 if(!error)await load();
}
document.getElementById("login-form").addEventListener("submit",async e=>{e.preventDefault();msg.textContent="Signing in…";const f=new FormData(e.currentTarget);const {error}=await db.auth.signInWithPassword({email:f.get("email"),password:f.get("password")});if(error){msg.textContent="Sign in failed. Check credentials or admin access.";return;}await access();});
document.getElementById("signout").addEventListener("click",async()=>{await db.auth.signOut();await access();});
document.getElementById("refresh").addEventListener("click",load);
access();
})();