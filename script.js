document.addEventListener("DOMContentLoaded",()=>{
  const toggle=document.querySelector(".menu-toggle");
  const nav=document.querySelector(".main-nav");
  if(toggle&&nav){
    toggle.addEventListener("click",()=>{
      const open=toggle.getAttribute("aria-expanded")==="true";
      toggle.setAttribute("aria-expanded",String(!open));
      nav.classList.toggle("open",!open);
    });
    nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{
      nav.classList.remove("open");toggle.setAttribute("aria-expanded","false");
    }));
  }
  const year=document.getElementById("year");
  if(year) year.textContent=new Date().getFullYear();
  const form=document.getElementById("contact-form");
  if(form){
    form.addEventListener("submit",event=>{
      event.preventDefault();
      const data=new FormData(form);
      const name=String(data.get("name")||"").trim();
      const business=String(data.get("business")||"").trim();
      const service=String(data.get("service")||"").trim();
      const message=String(data.get("message")||"").trim();
      const text=`Hello Digital World, I'd like to discuss a project.%0AName: ${encodeURIComponent(name)}%0ABusiness: ${encodeURIComponent(business||"Not specified")}%0AService: ${encodeURIComponent(service)}%0ADetails: ${encodeURIComponent(message||"I'd like to discuss my requirements.")}`;
      window.location.href=`https://wa.me/917600124041?text=${text}`;
    });
  }
});