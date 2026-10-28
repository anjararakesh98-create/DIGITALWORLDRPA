(()=>{
 const ready=()=>window.supabase&&window.DW_SUPABASE_URL&&!window.DW_SUPABASE_URL.includes("PASTE_")&&window.DW_SUPABASE_ANON_KEY&&!window.DW_SUPABASE_ANON_KEY.includes("PASTE_");
 let sb=null, currentUser=null, currentProfile=null;
 if(ready()) sb=window.supabase.createClient(window.DW_SUPABASE_URL,window.DW_SUPABASE_ANON_KEY);
 const $=id=>document.getElementById(id), say=(id,msg)=>{const e=$(id);if(e)e.textContent=msg;};
 const on=(id,event,fn)=>{const e=$(id);if(e)e.addEventListener(event,fn);};
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 function setupWarning(){if(!ready()&&document.querySelector(".app-body")){const n=document.createElement("div");n.className="setup-banner";n.textContent="Setup required: add the Supabase Project URL and publishable key in js/supabase-config.js. Never put a service_role key or OAuth secret in browser code.";document.body.prepend(n);}}
 document.addEventListener("DOMContentLoaded",async()=>{
  setupWarning(); if(!sb)return;
  if($("google-login")) {
   on("google-login","click",async()=>{say("status","Opening Google sign-in…");const {error}=await sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:new URL("dashboard.html",location.href).href,queryParams:{prompt:"select_account"}}});if(error)say("status",error.message);});
   let signup=false;on("signup-toggle","click",()=>{signup=!signup;const b=$("email-form")?.querySelector('button[type="submit"]');if(b)b.textContent=signup?"Create account":"Sign in";say("status",signup?"Enter your email and choose a password. New accounts may require admin approval.":"");});
   on("email-form","submit",async e=>{e.preventDefault();const fd=new FormData(e.currentTarget),email=String(fd.get("email")),password=String(fd.get("password"));const btn=e.currentTarget.querySelector('button[type="submit"]');btn.disabled=true;try{const isSignup=btn.textContent==="Create account";const r=isSignup?await sb.auth.signUp({email,password,options:{emailRedirectTo:new URL("dashboard.html",location.href).href,data:{full_name:email.split("@")[0]}}}):await sb.auth.signInWithPassword({email,password});if(r.error)throw r.error;if(isSignup)say("status","Account created. Check your email if confirmation is enabled. Access may require admin approval.");else location.href="dashboard.html";}catch(err){say("status",err.message||"Sign-in failed.");}finally{btn.disabled=false;}});
  }
  if($("sign-out")) {
   const {data:{session}}=await sb.auth.getSession();if(!session){location.replace("sign-in.html");return;}
   currentUser=session.user;$("user-email").textContent=session.user.email||"Signed in";
   on("sign-out","click",async()=>{await sb.auth.signOut();location.href="sign-in.html";});
   const {data:profile,error:profileError}=await sb.from("profiles").select("id,role,approval_status,full_name").eq("id",session.user.id).maybeSingle();
   currentProfile=profile;
   if(profileError){say("access-warning","Could not load your profile. Check that the database migration was run and the profiles table allows your own profile to be read.");$("access-warning").classList.remove("hidden");}
   const approved=profile?.approval_status==="approved", admin=approved&&profile?.role==="super_admin";
   if(admin){$("admin-panel").classList.remove("hidden");loadBusinesses();loadVisitors();}
   else {$("customer-panel").classList.remove("hidden");$("customer-message").textContent=!approved?"Your account is awaiting admin approval. Contact Digital World to request access.":"Your account is approved. Your business workspace will appear when a business is assigned.";loadCustomerBusiness();}
   loadReviewBusinesses();
   on("business-form","submit",saveBusiness);on("make-review","click",makeReview);on("copy-review","click",copyReview);
  }
 });
 async function loadBusinesses(){
  const {data,error}=await sb.from("businesses").select("*").order("created_at",{ascending:false});
  if(error){say("business-status","Could not load businesses: "+error.message+" — run the provided Supabase migration SQL.");return;}
  const list=$("business-list");list.innerHTML="";
  (data||[]).forEach(b=>{const card=document.createElement("div");card.className="business-row";const title=document.createElement("strong");title.textContent=b.name;const desc=document.createElement("p");desc.textContent=[b.category,b.phone,b.city].filter(Boolean).join(" · ");const link=document.createElement("a");link.href="../portfolio-view.html?slug="+encodeURIComponent(b.slug);link.target="_blank";link.rel="noopener";link.textContent="Open public portfolio ↗";const toggle=document.createElement("button");toggle.className="small-btn";toggle.textContent=b.is_published?"Unpublish":"Publish";toggle.onclick=async()=>{const next=!b.is_published;const r=await sb.from("businesses").update({is_published:next}).eq("id",b.id);if(r.error){say("business-status",r.error.message);return;}const [pr,cr]=await Promise.all([sb.from("portfolios").update({is_published:next}).eq("business_id",b.id),sb.from("digital_cards").update({is_published:next}).eq("business_id",b.id)]);if(pr.error||cr.error)say("business-status","Business publication updated, but portfolio/card status needs checking: "+(pr.error?.message||cr.error?.message));loadBusinesses();};const del=document.createElement("button");del.className="small-btn danger";del.textContent="Delete";del.onclick=async()=>{if(confirm("Delete "+b.name+"? Related portfolio/card data may be restricted by foreign keys.")){const r=await sb.from("businesses").delete().eq("id",b.id);if(r.error)say("business-status",r.error.message);else loadBusinesses();}};card.append(title,desc,link,toggle,del);list.append(card);});
 }
 async function saveBusiness(e){
  e.preventDefault();const fd=new FormData(e.currentTarget);
  const name=String(fd.get("name")).trim(),slug=String(fd.get("slug")).trim().toLowerCase();
  const payload={owner_id:currentUser.id,name,slug,category:String(fd.get("category")||"").trim(),phone:String(fd.get("phone")||"").trim(),website:String(fd.get("website")||"").trim(),google_review_url:String(fd.get("google_review_url")||"").trim(),description:String(fd.get("description")||"").trim(),is_published:false};
  const {data,error}=await sb.from("businesses").insert(payload).select("id").single();
  if(error){say("business-status",error.message);return;}
  const businessId=data.id;
  const services=String(fd.get("services")||"").split(",").map(s=>s.trim()).filter(Boolean);
  const portfolio=await sb.from("portfolios").upsert({business_id:businessId,headline:name,about:payload.description,services,is_published:false},{onConflict:"business_id"});
  const card=await sb.from("digital_cards").upsert({business_id:businessId,person_name:name,designation:payload.category,phone:payload.phone,website:payload.website,address:"",theme:{}},{onConflict:"business_id"});
  if(portfolio.error||card.error)say("business-status","Business created. Portfolio/card setup partly failed: "+(portfolio.error?.message||card.error?.message));
  else say("business-status","Business created as unpublished. Portfolio and digital card records created. Publish when ready.");
  e.currentTarget.reset();loadBusinesses();loadReviewBusinesses();
 }
 async function loadCustomerBusiness(){
  if(!currentUser)return;
  const {data,error}=await sb.from("businesses").select("name,slug,is_published,category").eq("owner_id",currentUser.id);
  const box=$("customer-business");if(error||!data?.length)return;
  box.innerHTML="";data.forEach(b=>{const p=document.createElement("p");p.textContent=b.name+" · "+(b.is_published?"Published":"Not published");if(b.is_published){const a=document.createElement("a");a.href="../portfolio-view.html?slug="+encodeURIComponent(b.slug);a.textContent="Open portfolio";a.target="_blank";p.append(" — ",a);}box.append(p);});
 }
 async function loadReviewBusinesses(){
  const sel=$("review-business");if(!sel)return;const {data,error}=await sb.from("businesses").select("id,name,google_review_url").order("name");
  sel.innerHTML="";if(error){say("review-status","Could not load businesses: "+error.message);return;}
  (data||[]).forEach(b=>{const o=document.createElement("option");o.value=b.id;o.textContent=b.name;o.dataset.url=b.google_review_url||"";sel.append(o);});
 }
 async function makeReview(){
  const exp=$("review-experience").value.trim();if(!exp){say("review-status","Describe a real customer experience first.");return;}
  const sel=$("review-business"),businessId=sel?.value,name=sel?.selectedOptions[0]?.textContent||"the business";
  const draft=`I had a ${exp}. My experience with ${name} was ${exp.toLowerCase().replace(/[.!?]+$/,"")}.`;
  $("review-output").value=draft;
  if(businessId&&currentUser){const r=await sb.from("review_drafts").insert({business_id:businessId,created_by:currentUser.id,platform:"google",customer_name:"",experience_notes:exp,draft_text:draft,status:"draft"});if(r.error)say("review-status","Draft created in this browser; database save failed: "+r.error.message);else say("review-status","Draft saved. Edit it to reflect the real experience before posting. This is a template, not AI-generated content.");}
  else say("review-status","Draft created. Please edit it to reflect the real experience before posting.");
 }
 async function copyReview(){
  const text=$("review-output").value.trim();if(!text){say("review-status","Create or enter a review draft first.");return;}
  try{await navigator.clipboard.writeText(text);say("review-status","Copied. Google Reviews is opening; paste the draft and submit it yourself.");}catch(e){$("review-output").focus();$("review-output").select();say("review-status","Select and copy the draft, then continue to Google.");}
  const url=$("review-business")?.selectedOptions[0]?.dataset.url;if(url)window.open(url,"_blank","noopener");else say("review-status","Copy the draft manually. Add the business's real Google review URL to enable the Google button.");
 }
 async function loadVisitors(){
  const {data,error}=await sb.from("analytics_events").select("event_type,page_path,referrer,created_at").order("created_at",{ascending:false}).limit(500);
  if(error){$("visitor-summary").textContent="Visitor reports require the migration SQL and analytics table permissions.";return;}
  const rows=data||[],views=rows.filter(x=>x.event_type==="portfolio_view");
  $("visitor-summary").innerHTML=`<div class="stat"><strong>${rows.length}</strong><span>Recent tracked events</span></div><div class="stat"><strong>${views.length}</strong><span>Portfolio views</span></div>`;
  const by={};views.forEach(x=>{const m=(x.page_path||"").match(/[?&]slug=([^&]+)/);const slug=m?decodeURIComponent(m[1]):(x.page_path||"Portfolio");by[slug]=(by[slug]||0)+1;});
  const list=$("visitor-list");list.innerHTML="<h3>Portfolio views</h3>";Object.entries(by).sort((a,b)=>b[1]-a[1]).forEach(([slug,n])=>{const p=document.createElement("p");p.textContent=slug+": "+n+" views";list.append(p);});
 }
})();