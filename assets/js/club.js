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
        var v = gate.querySelector("input").value.trim().toUpperCase();
        if (v === KEY) {
          sessionStorage.setItem("pc-vault", "open");
          unlock();
        } else {
          gate.classList.remove("deny");
          void gate.offsetWidth;
          gate.classList.add("deny");
          gate.querySelector("input").value = "";
        }
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
      var b = data.billboard;
      var html = "";
      if (b) {
        html +=
          '<header class="billboard">' +
          '<div class="billboard__art"><img src="' + esc(b.image) + '" alt="' + esc(b.title) + '"></div>' +
          '<div class="billboard__fade"></div>' +
          '<div class="billboard__body">' +
          '<span class="eyebrow eyebrow--gold rv in">' + esc(b.kicker) + "</span>" +
          '<h1 class="rv in">' + esc(b.title) + "</h1>" +
          '<p class="rv in rv-d1">' + esc(b.copy) + "</p>" +
          '<div class="billboard__cta rv in rv-d2">' +
          (b.ctas || []).map(function (c) {
            return '<span class="btn' + (c.solid ? " btn--solid" : "") + '">' + esc(c.label) +
              (c.solid ? ' <span class="arr">→</span>' : "") + "</span>";
          }).join("") +
          "</div></div></header>";
      }
      html += "<main>" + (data.shelves || []).map(function (sh, i) {
        return '<section class="shelf"' + (i === (data.shelves.length - 1) ? ' style="padding-bottom:clamp(50px,8vh,90px)"' : "") + ">" +
          '<div class="shelf__head"><h3>' + esc(sh.title) + "</h3><span>" + esc(sh.note) + "</span></div>" +
          '<div class="shelf__row">' +
          (sh.cards || []).map(function (c) {
            var art = c.image
              ? '<div class="card__art"><img src="' + esc(c.image) + '" alt="" loading="lazy"></div>'
              : '<div class="card__art ' + esc(c.wash || "art-noir") + '"' +
                (c.logo ? ' style="display:flex;align-items:center;justify-content:center"' : "") + ">" +
                (c.logo ? '<img src="' + esc(c.logo) + '" alt="" style="width:58%;opacity:.9;position:relative;z-index:2" loading="lazy">' : "") +
                "</div>";
            return '<article class="card' + (c.wide ? " card--wide" : "") + '">' + art +
              (c.lock ? '<span class="card__lock">' + esc(c.lock) + "</span>" : "") +
              '<div class="card__body"><span class="k">' + esc(c.k) + '</span><span class="t">' + esc(c.t) +
              '</span><span class="s">' + esc(c.s) + "</span></div></article>";
          }).join("") +
          "</div></section>";
      }).join("") + "</main>";
      vaultMount.innerHTML = html;
    }).catch(function () {});
  }

  /* year */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
