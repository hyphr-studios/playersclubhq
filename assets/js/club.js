/* PLAYER'S CLUB™ — club.js */
(function () {
  "use strict";

  /* menu */
  var burger = document.querySelector(".nav__burger");
  var menu = document.querySelector(".menu");
  if (burger && menu) {
    burger.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      document.body.classList.toggle("menu-locked", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        menu.classList.remove("open");
        document.body.classList.remove("menu-locked");
      }
    });
  }

  /* reveal on scroll */
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  document.querySelectorAll(".rv").forEach(function (el) { io.observe(el); });

  /* ticker: duplicate track for seamless loop */
  document.querySelectorAll(".ticker__track").forEach(function (t) {
    t.innerHTML += t.innerHTML;
  });

  /* photo drop-in: if a real photo exists it covers the art plate */
  document.querySelectorAll("img.plate__photo,[data-photo]").forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) { img.remove(); return; }
    img.addEventListener("error", function () { img.remove(); });
  });

  /* vault gate */
  var gate = document.getElementById("gate");
  if (gate) {
    var KEY = (gate.getAttribute("data-key") || "FONTAINE").toUpperCase();
    var vault = document.getElementById("vault-inner");
    var unlock = function () {
      gate.style.transition = "opacity .8s ease, visibility .8s";
      gate.style.opacity = "0";
      gate.style.visibility = "hidden";
      if (vault) vault.removeAttribute("hidden");
      document.body.style.overflow = "";
    };
    if (sessionStorage.getItem("pc-vault") === "open") {
      gate.remove();
      if (vault) vault.removeAttribute("hidden");
    } else {
      document.body.style.overflow = "hidden";
      gate.querySelector("form").addEventListener("submit", function (e) {
        e.preventDefault();
        var keyInput = gate.querySelector("input[name=key]") || gate.querySelector("input");
        var emailInput = gate.querySelector("input[name=email]");
        var v = keyInput.value.trim().toUpperCase();
        if (v === KEY) {
          sessionStorage.setItem("pc-vault", "open");
          if (emailInput && emailInput.value) sessionStorage.setItem("pc-member", emailInput.value.trim().toLowerCase());
          unlock();
        } else {
          gate.classList.remove("deny");
          void gate.offsetWidth;
          gate.classList.add("deny");
          keyInput.value = "";
        }
      });
    }
  }

  /* after dark — the back room. Vault membership required, then 21+ confirm */
  var adgate = document.getElementById("adgate");
  if (adgate) {
    var adInner = document.getElementById("ad-inner");
    if (sessionStorage.getItem("pc-vault") !== "open") {
      location.replace("../");
    } else if (sessionStorage.getItem("pc-ad") === "open") {
      adgate.remove();
      if (adInner) adInner.removeAttribute("hidden");
    } else {
      document.body.style.overflow = "hidden";
      adgate.querySelector("[data-ad-yes]").addEventListener("click", function () {
        sessionStorage.setItem("pc-ad", "open");
        adgate.style.transition = "opacity .8s ease, visibility .8s";
        adgate.style.opacity = "0";
        adgate.style.visibility = "hidden";
        if (adInner) adInner.removeAttribute("hidden");
        document.body.style.overflow = "";
      });
    }
  }

  /* editable content — JSON overrides the static markup when it loads.
     Edit content/issues.json and content/vault.json; never touch the HTML. */
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  };

  var issuesMount = document.querySelector("[data-content='issues']");
  if (issuesMount) {
    fetch(issuesMount.getAttribute("data-src")).then(function (r) { return r.json(); }).then(function (data) {
      if (!data.editions || !data.editions.length) return;
      issuesMount.innerHTML = data.editions.map(function (e) {
        var inner =
          '<div class="edition__wash ' + esc(e.wash || "art-noir") + '"></div>' +
          '<div class="edition__in">' +
          '<span class="edition__num' + (e.open ? " chrome-text" : "") + '">' + esc(e.num) + "</span>" +
          '<div class="edition__body">' +
          '<span class="season"' + (e.open ? "" : ' style="color:var(--faint)"') + ">" + esc(e.season) + "</span>" +
          "<h2>" + esc(e.title) + "</h2>" +
          '<span class="lux">' + esc(e.sub) + "</span></div>" +
          '<div class="edition__side">' +
          (e.open
            ? '<span class="state">' + esc(e.state) + '</span><span class="btn">Open <span class="arr">→</span></span>'
            : '<span class="stamp">' + esc(e.state) + "</span>") +
          "</div></div>";
        return e.open && e.href
          ? '<a class="edition rv in" href="' + esc(e.href) + '">' + inner + "</a>"
          : '<div class="edition edition--embargo rv in" aria-disabled="true">' + inner + "</div>";
      }).join("");
    }).catch(function () {});
  }

  var vaultMount = document.querySelector("[data-content='vault']");
  if (vaultMount) {
    fetch(vaultMount.getAttribute("data-src")).then(function (r) { return r.json(); }).then(function (data) {
      var tagClass = function (c) {
        return "vset__tag" + (c.hot ? " vset__tag--hot" : "") + (c.locked || c.tag === "21+" ? " vset__tag--red" : "");
      };
      var setCard = function (c, wide) {
        var art = c.image
          ? '<div class="vset__art"><img src="' + esc(c.image) + '" alt="" loading="lazy"></div>'
          : '<div class="vset__art ' + esc(c.wash || "art-noir") + '"></div>';
        var cls = "vset" + (wide ? " vset--wide" : "") + (c.locked ? " vset--locked" : "") + (c.href ? " vset--door" : "");
        var inner = art +
          (c.no ? '<span class="vset__no">' + esc(c.no) + "</span>" : "") +
          (c.tag ? '<span class="' + tagClass(c) + '">' + esc(c.tag) + "</span>" : "") +
          '<div class="vset__body"><span class="vset__t">' + esc(c.t) + '</span><span class="vset__s">' + esc(c.s) + "</span></div>";
        return c.href
          ? '<a class="' + cls + '" href="' + esc(c.href) + '">' + inner + "</a>"
          : '<article class="' + cls + '">' + inner + "</article>";
      };
      var html = "";
      var ft = data.featured;
      if (ft) {
        html += '<header class="billboard">' +
          (ft.image
            ? '<div class="billboard__art"><img src="' + esc(ft.image) + '" alt=""></div>'
            : '<div class="billboard__art ' + esc(ft.wash || "art-noir") + '"></div>') +
          '<div class="billboard__fade"></div>' +
          '<div class="billboard__body">' +
          '<span class="eyebrow eyebrow--gold rv in">' + esc(ft.kicker) + "</span>" +
          '<h1 class="rv in">' + esc(ft.title) + "</h1>" +
          '<p class="rv in rv-d1">' + esc(ft.copy) + "</p>" +
          '<div class="billboard__cta rv in rv-d2"><span class="btn btn--solid">' + esc(ft.cta || "Open") +
          ' <span class="arr">→</span></span></div></div></header>';
      }
      html += "<main>";
      var L = data.labels || {};
      var sl = L.sets || ["The Sets", "Never published · Never public"];
      var fl = L.footage || ["Footage", "Reels · Loops · Tapes"];
      if (data.sets && data.sets.length) {
        html += '<div class="vhead"><h3>' + esc(sl[0]) + "</h3><span>" + esc(sl[1]) + "</span></div>" +
          '<div class="vgrid">' + data.sets.map(function (c) { return setCard(c, false); }).join("") + "</div>";
      }
      if (data.footage && data.footage.length) {
        html += '<div class="vhead"><h3>' + esc(fl[0]) + "</h3><span>" + esc(fl[1]) + "</span></div>" +
          '<div class="vgrid vgrid--wide">' + data.footage.map(function (c) { return setCard(c, true); }).join("") + "</div>";
      }
      var bk = data.book;
      if (bk) {
        html += '<section class="vband">' +
          '<div><span class="eyebrow eyebrow--gold">' + esc(bk.kicker) + "</span>" +
          '<h2 class="vband__title chrome-text">' + esc(bk.title) + "</h2>" +
          '<span class="vband__s">' + esc(bk.s) + "</span></div>" +
          '<img src="' + esc(bk.image) + '" alt="' + esc(bk.title) + '"></section>';
      }
      html += "</main>";
      vaultMount.innerHTML = html;
    }).catch(function () {});
  }

  /* year */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
