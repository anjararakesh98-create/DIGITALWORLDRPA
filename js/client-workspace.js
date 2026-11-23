const db=window.supabase.createClient("https://lvbesvjeiaxudhsajyuc.supabase.co","sb_publishable_EhHpIAzaJC3y7MBkcv0wDQ_Vz8kXsnR");
const $=id=>document.getElementById(id);
let card;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function safeUrl(value){try{const u=new URL(String(value||"").trim());return ["https:","http:"].includes(u.protocol)?u.href:"";}catch{return "";}}
function showMessage(id,message,good=false){$(id).textContent=message;$(id).className="msg "+(good?"good":"");}
async function loadServiceOrders(userId){
 const {data,error}=await db.from("orders").select("order_number,service_snapshot,status,payment_status,amount_due_inr,created_at").eq("customer_user_id",userId).order("created_at",{ascending:false}).limit(50);
 const el=$("serviceOrders");el.replaceChildren();
 if(error){el.textContent="Could not load service orders.";return;}
 if(!data?.length){el.textContent="No service orders linked to this account yet.";return;}
 data.forEach(o=>{
  const article=document.createElement("article");article.className="tile";
  const title=document.createElement("b");title.textContent=o.order_number||"Order";article.append(title);
  const detail=document.createElement("p");detail.textContent=(o.service_snapshot?.service_name||"Digital World Service")+" · "+(o.service_snapshot?.package_name||"");article.append(detail);
  const status=document.createElement("small");status.textContent="Status: "+(o.status||"—")+" · Payment: "+(o.payment_status||"—");article.append(status);
  const amount=document.createElement("p");amount.textContent=o.amount_due_inr==null?"Quote pending":"₹"+o.amount_due_inr;article.append(amount);
  const date=document.createElement("small");date.textContent=o.created_at?new Date(o.created_at).toLocaleDateString("en-IN"):"";article.append(date);
  el.append(article);
 });
}
async function init(){
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user){location.href="client-login.html";return;}
 $("identity").textContent=user.email||"";
 const {data,error}=await db.from("business_cards").select("*").eq("user_id",user.id).maybeSingle();
 if(error){$("businessTitle").textContent="Unable to load profile";$("status").textContent="Please refresh or contact Digital World.";return;}
 if(!data){$("businessTitle").textContent="No business card found";$("status").textContent="Start from Create Your Business Card.";return;}
 card=data;await loadServiceOrders(user.id);
 $("businessTitle").textContent=data.business_name||"My Business Card";
 $("status").textContent="Card status: "+String(data.card_status||"pending").toUpperCase()+" · Trial ends "+(data.trial_ends_at?new Date(data.trial_ends_at).toLocaleDateString("en-IN"):"—");
 const url=new URL("public-card.html",location.href);url.searchParams.set("card",data.slug||"");$("publicLink").href=url.href;$("publicLink").textContent=url.href;
 const d=data.public_data||{};
 const values={business:data.business_name||"",owner:data.owner_name||"",mobile:data.contact_mobile||"",category:d.category||"",tagline:d.tagline||"",about:d.about||"",whatsapp:d.whatsapp||"",website:d.website||"",address:d.address||"",services:Array.isArray(d.services)?d.services.join("\n"):"",products:Array.isArray(d.products)?d.products.join("\n"):"",instagram:d.instagram||"",facebook:d.facebook||"",logo:d.logo||""};
 Object.entries(values).forEach(([id,value])=>$(id).value=value);
}
$("profile").addEventListener("submit",async e=>{
 e.preventDefault();if(!card)return;
 const website=safeUrl($("website").value),instagram=safeUrl($("instagram").value),facebook=safeUrl($("facebook").value),logo=safeUrl($("logo").value);
 for(const [id,value] of [["website",website],["instagram",instagram],["facebook",facebook],["logo",logo]]){if($(id).value.trim()&&!value){showMessage("saveMessage","Please enter valid HTTP or HTTPS URLs.");return;}}
 const d={...(card.public_data||{}),category:$("category").value.trim(),tagline:$("tagline").value.trim(),about:$("about").value.trim(),whatsapp:$("whatsapp").value.trim(),website,address:$("address").value.trim(),services:$("services").value.split("\n").map(x=>x.trim()).filter(Boolean).slice(0,30),products:$("products").value.split("\n").map(x=>x.trim()).filter(Boolean).slice(0,50),instagram,facebook,logo};
 const {error}=await db.from("business_cards").update({business_name:$("business").value.trim(),owner_name:$("owner").value.trim(),contact_mobile:$("mobile").value.trim(),public_data:d,updated_at:new Date().toISOString()}).eq("id",card.id);
 if(error){showMessage("saveMessage","Could not save profile. Please try again.");return;}
 showMessage("saveMessage","Profile saved successfully.",true);await init();
});
$("copy").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("publicLink").href);$("copy").textContent="Copied";}catch{$("copy").textContent="Copy not available";}});
$("cardPayment").addEventListener("submit",async e=>{
 e.preventDefault();if(!card)return;
 const plan=$("payPlan").value;if(!["without-nfc","with-nfc"].includes(plan)){showMessage("paymentMessage","Select a valid plan.");return;}
 const amount=plan==="with-nfc"?558:299;
 const button=e.submitter;if(button)button.disabled=true;
 const {error}=await db.from("business_card_payments").insert({card_id:card.id,user_id:card.user_id,plan_code:plan,amount_inr:amount,shipping_inr:plan==="with-nfc"?59:0,utr_reference:$("utr").value.trim(),reference_details:$("payDetails").value.trim(),payment_status:"pending_verification"});
 showMessage("paymentMessage",error?"Payment reference could not be submitted. Please check the details and try again.":"Payment reference submitted. Your card will be activated after manual verification.",!error);
 if(!error)e.currentTarget.reset();if(button)button.disabled=false;
});
$("logout").addEventListener("click",async()=>{await db.auth.signOut();location.href="client-login.html";});
init();