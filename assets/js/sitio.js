/* Navegación común, índice de la página, tema claro/oscuro y menú móvil. */
(function () {
  "use strict";

  var NAV = [
    { group: "Proyecto" },
    { href: "index.html", t: "Inicio" },
    { group: "Datos" },
    { href: "adquisicion.html", t: "Adquisición de imágenes", n: "01" },
    { href: "etiquetado.html", t: "Etiquetado de máscaras", n: "02" },
    { href: "terreno.html", t: "Información del terreno", n: "03" },
    { group: "Modelos" },
    { href: "modelos.html", t: "Redes de segmentación", n: "04" },
    { href: "entrenamiento.html", t: "Protocolo de entrenamiento", n: "05" },
    { href: "evaluacion.html", t: "Predicción y evaluación", n: "06" },
    { group: "Seguimiento" },
    { href: "estado.html", t: "Estado y hoja de ruta", n: "07" },
    { href: "glosario.html", t: "Glosario" }
  ];

  var here = location.pathname.split("/").pop() || "index.html";
  if (here.indexOf(".") === -1) here = "index.html";

  /* ---------- Barra lateral ---------- */
  var side = document.getElementById("sidebar");
  if (side) {
    var html = "";
    var open = false;
    NAV.forEach(function (it) {
      if (it.group) {
        if (open) html += "</ul>";
        html += '<div class="nav-group">' + it.group + "</div><ul>";
        open = true;
        return;
      }
      var cur = it.href === here ? ' aria-current="page"' : "";
      html += '<li><a href="' + it.href + '"' + cur + ">" +
        '<span class="num">' + (it.n || "") + "</span>" + it.t + "</a></li>";
    });
    if (open) html += "</ul>";
    side.innerHTML = html;
  }

  /* ---------- Anterior / siguiente ---------- */
  var pages = NAV.filter(function (x) { return x.href; });
  var idx = pages.findIndex(function (x) { return x.href === here; });
  var pager = document.getElementById("pager");
  if (pager && idx > -1) {
    var p = pages[idx - 1], n = pages[idx + 1], h = "";
    if (p) h += '<a class="prev" href="' + p.href + '"><small>Anterior</small><span>← ' + p.t + "</span></a>";
    if (n) h += '<a class="next" href="' + n.href + '"><small>Siguiente</small><span>' + n.t + " →</span></a>";
    pager.innerHTML = h;
  }

  /* ---------- Índice de la página (h2) ---------- */
  var toc = document.getElementById("toc");
  var heads = Array.prototype.slice.call(document.querySelectorAll(".content h2"));
  if (toc && heads.length > 1) {
    var list = '<h2>En esta página</h2><ul>';
    heads.forEach(function (hd, i) {
      if (!hd.id) {
        hd.id = "s" + (i + 1) + "-" + hd.textContent.toLowerCase()
          .normalize("NFD").replace(/[̀-ͯ]/g, "")
          .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
      }
      list += '<li><a href="#' + hd.id + '">' + hd.textContent + "</a></li>";
    });
    toc.innerHTML = list + "</ul>";

    if ("IntersectionObserver" in window) {
      var links = toc.querySelectorAll("a");
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            links.forEach(function (a) {
              a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id);
            });
          }
        });
      }, { rootMargin: "-70px 0px -70% 0px" });
      heads.forEach(function (hd) { obs.observe(hd); });
    }
  }

  /* ---------- Tema ---------- */
  var root = document.documentElement;
  var btnTheme = document.getElementById("theme-btn");
  function paintIcon() {
    if (!btnTheme) return;
    var dark = root.getAttribute("data-theme") === "dark";
    btnTheme.setAttribute("aria-label", dark ? "Usar tema claro" : "Usar tema oscuro");
    btnTheme.innerHTML = dark
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
  }
  paintIcon();
  if (btnTheme) {
    btnTheme.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("tema", next); } catch (e) { /* sin almacenamiento */ }
      paintIcon();
    });
  }

  /* ---------- Menú móvil ---------- */
  var btnMenu = document.getElementById("menu-btn");
  if (btnMenu) {
    btnMenu.addEventListener("click", function () {
      var openNow = document.body.classList.toggle("nav-open");
      btnMenu.setAttribute("aria-expanded", openNow ? "true" : "false");
    });
    document.addEventListener("click", function (e) {
      if (document.body.classList.contains("nav-open") && !e.target.closest(".sidebar") && !e.target.closest("#menu-btn")) {
        document.body.classList.remove("nav-open");
        btnMenu.setAttribute("aria-expanded", "false");
      }
    });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
