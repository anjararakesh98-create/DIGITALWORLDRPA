const db=window.supabase.createClient("https://lvbesvjeiaxudhsajyuc.supabase.co","sb_publishable_EhHpIAzaJC3y7MBkcv0wDQ_Vz8kXsnR");
const slug=new URLSearchParams(location.search).get("card");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function safeUrl(value,allowImage=false){
 try{
  const u=new URL(String(value||"").trim());
  const allowed=allowImage?["https:"]:["https:","http:"];
  return allowed.includes(u.protocol)?u.href:"";
 }catch{return "";}
}
async function load(){
 const el=document.getElementById("card");
 if(!slug||slug.length>120){el.textContent="Business card not found.";return;}
 const {data,error}=await db.from("public_business_cards").select("*").eq("slug",slug).maybeSingle();
 if(error||!data){el.textContent="This business card is unavailable.";return;}
 const d=data.public_data||{},logo=safeUrl(d.logo,true),website=safeUrl(d.website),wa=String(d.whatsapp||"").replace(/\D/g,"");
 const details=[["Category",d.category],["Address",d.address],["Website",website?'<a href="'+esc(website)+'" target="_blank" rel="noopener noreferrer">'+esc(website)+'</a>':""],["WhatsApp",wa?esc(d.whatsapp):""]].filter(x=>x[1]);
 el.innerHTML=(logo?'<img src="'+esc(logo)+'" alt="'+esc(data.business_name)+' logo" style="max-width:120px;max-height:90px;object-fit:contain">':"")+
 '<div class="brand">Digital World</div><h1>'+esc(data.business_name)+'</h1><h3>'+esc(data.owner_name)+'</h3><p>'+esc(d.tagline||"")+'</p><p>'+esc(d.about||"")+'</p><div class="grid">'+details.map(x=>'<div class="tile"><b>'+esc(x[0])+'</b>'+x[1]+'</div>').join("")+'</div>'+
 ["services","products"].filter(k=>Array.isArray(d[k])&&d[k].length).map(k=>'<section class="section"><h2>'+(k==="services"?"Services":"Products & Pricing")+'</h2><ul>'+d[k].map(x=>"<li>"+esc(x)+"</li>").join("")+"</ul></section>").join("")+
 '<div class="row section">'+(wa?'<a class="btn" href="https://wa.me/'+esc(wa)+'" target="_blank" rel="noopener noreferrer">WhatsApp</a>':"")+(website?'<a class="btn secondary" href="'+esc(website)+'" target="_blank" rel="noopener noreferrer">Website</a>':"")+'</div>';
 document.title=data.business_name+" | Digital World";
}
load();