(() => {
  const init = () => {
    if (document.querySelector(".dw-unified-header")) return;
    const path = location.pathname.split("/").pop() || "index.html";
    const items = [
      ["Home","index.html","home"],
      ["Smart Business Card","business-card.html","card"],
      ["Store","store.html","store"],
      ["Services","index.html#services","services"],
      ["Our Work","index.html#work","work"],
      ["About","index.html#about","about"],
      ["Contact","index.html#contact","contact"],
      ["Client Login","client-login.html","login"],
      ["Admin Login","admin.html","admin"]
    ];
    const active = path === "index.html" ? "home" :
      path === "business-card.html" || path === "create-account.html" ? "card" :
      path === "store.html" ? "store" :
      path === "client-login.html" || path === "client-dashboard.html" ? "login" :
      path === "admin.html" ? "admin" : "";
    const header = document.createElement("header");
    header.className = "dw-unified-header";
    header.innerHTML = '<div class="dw-unified-inner"><a class="dw-unified-logo" href="index.html" aria-label="Digital World Home"><img src="images/digital-world-logo.webp" alt="Digital World" width="180" height="105"></a><button class="dw-unified-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="dw-main-navigation"><span></span><span></span><span></span></button></div><div class="dw-unified-backdrop" hidden></div><nav id="dw-main-navigation" class="dw-unified-nav" aria-label="Main navigation" aria-hidden="true"><div class="dw-unified-nav-head"><strong>Menu</strong><button class="dw-unified-close" type="button" aria-label="Close menu">×</button></div><div class="dw-unified-links"></div></nav>';
    const links = header.querySelector(".dw-unified-links");
    items.forEach(([label, href, key]) => {
      const a = document.createElement("a");
      a.href = href;
      a.textContent = label;
      if (key === active) a.setAttribute("aria-current", "page");
      links.appendChild(a);
    });
    const toggle = header.querySelector(".dw-unified-toggle");
    const close = header.querySelector(".dw-unified-close");
    const nav = header.querySelector(".dw-unified-nav");
    const backdrop = header.querySelector(".dw-unified-backdrop");
    const setOpen = open => {
      header.classList.toggle("menu-open", open);
      nav.classList.toggle("is-open", open);
      nav.setAttribute("aria-hidden", String(!open && window.matchMedia("(max-width: 900px)").matches));
      backdrop.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.classList.toggle("dw-nav-open", open);
    };
    toggle.addEventListener("click", () => setOpen(!header.classList.contains("menu-open")));
    close.addEventListener("click", () => setOpen(false));
    backdrop.addEventListener("click", () => setOpen(false));
    links.addEventListener("click", event => { if (event.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", event => { if (event.key === "Escape") setOpen(false); });
    window.addEventListener("resize", () => {
      if (!window.matchMedia("(max-width: 900px)").matches) setOpen(false);
    });
    document.body.insertBefore(header, document.body.firstChild);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();