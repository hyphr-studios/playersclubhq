/* PLAYER'S CLUB™ — club.js */
(function () {
  "use strict";

  /* ─────────────────────────────────────────────────────────────
     WHERE THE FILMS LIVE.
     "" (empty)  = served from this site, out of assets/video/
     a URL       = served from there instead, by filename.
     Changing this one line moves every film on the site.
     ───────────────────────────────────────────────────────────── */
  var VIDEO_BASE = "";

  var filmURL = function (p) {
    if (!p || !VIDEO_BASE) return p;
    return VIDEO_BASE.replace(/\/+$/, "") + "/" + p.split("/").pop();
  };

  /* point every film at the configured home */
  var routeFilms = function (root) {
    (root || document).querySelectorAll("[data-video]").forEach(function (el) {
      el.setAttribute("data-video", filmURL(el.getAttribute("data-video")));
    });
    (root || document).querySelectorAll("video[src]").forEach(function (v) {
      v.setAttribute("src", filmURL(v.getAttribute("src")));
    });
  };

  routeFilms(document);


  /* Session flags. Some in-app browsers (Instagram, TikTok, locked-down
     webviews, older Private Browsing) throw on sessionStorage — unguarded,
     that exception would kill this whole file. Fall back to a session
     cookie, then to memory, so the site degrades instead of dying. */
  var store = (function () {
    var mem = {}, native = false, ss = null;
    try {
      ss = window.sessionStorage;
      var probe = "__pc_t";
      ss.setItem(probe, "1"); ss.removeItem(probe);
      native = true;
    } catch (e) { native = false; ss = null; }
    var cookieGet = function (k) {
      try {
        var m = document.cookie.match("(?:^|; )" + k.replace(/([.*+?^${}()|[\]\\])/g, "\\$1") + "=([^;]*)");
        return m ? decodeURIComponent(m[1]) : null;
      } catch (e) { return null; }
    };
    var cookieSet = function (k, v) {
      try { document.cookie = k + "=" + encodeURIComponent(v) + "; path=/; SameSite=Lax"; } catch (e) {}
    };
    return {
      get: function (k) {
        if (native) {
          try {
            var v = ss.getItem(k);
            if (v !== null) return v;
          } catch (e) {}
        }
        var c = cookieGet(k);
        if (c !== null) return c;
        return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;
      },
      set: function (k, v) {
        mem[k] = v;
        var stored = false;
        if (native) { try { ss.setItem(k, v); stored = true; } catch (e) {} }
        if (!stored) cookieSet(k, v);
      }
    };
  })();

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
    var USER = (gate.getAttribute("data-user") || "STANLEY").toUpperCase();
    var vault = document.getElementById("vault-inner");
    var unlock = function () {
      gate.style.transition = "opacity .8s ease, visibility .8s";
      gate.style.opacity = "0";
      gate.style.visibility = "hidden";
      if (vault) vault.removeAttribute("hidden");
      document.body.style.overflow = "";
    };
    if (store.get("pc-vault") === "open") {
      gate.remove();
      if (vault) vault.removeAttribute("hidden");
    } else {
      document.body.style.overflow = "hidden";
      gate.querySelector("form").addEventListener("submit", function (e) {
        e.preventDefault();
        var keyInput = gate.querySelector("input[name=key]") || gate.querySelector("input");
        var userInput = gate.querySelector("input[name=user]");
        var vKey = keyInput.value.trim().toUpperCase();
        var vUser = userInput ? userInput.value.trim().toUpperCase() : USER;
        if (vKey === KEY && vUser === USER) {
          store.set("pc-vault", "open");
          store.set("pc-member", vUser);
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
    if (store.get("pc-vault") !== "open") {
      location.replace("../");
    } else if (store.get("pc-ad") === "open") {
      adgate.remove();
      if (adInner) adInner.removeAttribute("hidden");
    } else {
      document.body.style.overflow = "hidden";
      adgate.querySelector("[data-ad-yes]").addEventListener("click", function () {
        store.set("pc-ad", "open");
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

  /* card thumbnails: serve the 800px variant, not the full frame.
     Full frames are still used by the fullscreen viewer. */
  var cardImg = function (src, cls, sizes) {
    if (!src) return "";
    var sm = src.replace(/\.jpe?g$/i, "-sm.jpg");
    var c = cls ? ' class="' + cls + '"' : "";
    if (sm === src) return "<img" + c + ' src="' + src + '" alt="" loading="lazy">';
    return "<img" + c + ' src="' + src + '" alt="" loading="lazy"' +
           ' srcset="' + sm + ' 800w, ' + src.replace(/\.jpe?g$/i, "-md.jpg") + ' 1200w, ' + src + ' 1600w"' +
           ' sizes="' + (sizes || "(max-width:700px) 92vw, 340px") + '">';
  };

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
          '<div class="edition__wash ' + esc(e.wash || "art-noir") + '"' +
          (e.image ? " style=\"background-image:url('" + esc(e.image) + "');background-size:cover;background-position:center 58%\"" : "") +
          "></div>" +
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
        var pattr = c.photos && c.photos.length
          ? ' data-photos="' + esc(c.photos.join(",")) + '" data-set-title="' + esc(c.t) + '"' +
            (c.captions ? ' data-captions="' + esc(c.captions.join("|")) + '"' : "")
          : "";
        var art = c.video
          ? '<div class="vset__art"><img class="vfill" src="' + esc((c.poster || "").replace(/\.jpe?g$/i, "-blur.jpg")) + '" alt="" aria-hidden="true" loading="lazy">' +
            '<img class="vmain" src="' + esc(c.poster || "") + '" alt="" loading="lazy">' +
            '<span class="cinema__play cinema__play--sm">▶</span></div>'
          : c.mark
            ? '<div class="vset__art"><img src="' + esc(c.mark) + '" alt="" loading="lazy"></div>'
            : c.image
              ? '<div class="vset__art">' + cardImg(esc(c.image)) + '</div>'
              : '<div class="vset__art ' + esc(c.wash || "art-noir") + '"></div>';
        var cls = "vset" + (wide ? " vset--wide" : "") + (c.locked ? " vset--locked" : "") + (c.href ? " vset--door" : "") + (c.video ? " vset--film" : "") + (c.mark ? " vset--mark" : "");
        var vattr = c.video ? ' data-video="' + esc(c.video) + '"' : "";
        var inner = art +
          (c.no ? '<span class="vset__no">' + esc(c.no) + "</span>" : "") +
          (c.tag ? '<span class="' + tagClass(c) + '">' + esc(c.tag) + "</span>" : "") +
          '<div class="vset__body">' +
          (c.t ? '<span class="vset__t">' + esc(c.t) + "</span>" : "") +
          '<span class="vset__s">' + esc(c.s) + "</span></div>";
        return c.href
          ? '<a class="' + cls + '" href="' + esc(c.href) + '"' + vattr + ">" + inner + "</a>"
          : '<article class="' + cls + '"' + vattr + pattr + ">" + inner + "</article>";
      };
      var html = "";
      var ft = data.featured;
      if (ft) {
        html += '<header class="billboard"' +
          (ft.photos && ft.photos.length
            ? ' data-photos="' + esc(ft.photos.join(",")) + '" data-set-title="' + esc(ft.title) + '"'
            : "") + ">" +
          (ft.image
            ? '<div class="billboard__art">' + cardImg(esc(ft.image), "kb", "(max-width:700px) 50vw, 100vw") + '</div>'
            : '<div class="billboard__art ' + esc(ft.wash || "art-noir") + '"></div>') +
          '<div class="billboard__fade"></div>' +
          '<div class="billboard__body">' +
          '<span class="eyebrow eyebrow--gold rv in">' + esc(ft.kicker) + "</span>" +
          '<h2 class="rv in">' + esc(ft.title) + "</h2>" +
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
          '<div class="vgrid' + (data.sets.length <= 2 ? " vgrid--duo" : "") + '">' +
          data.sets.map(function (c) { return setCard(c, false); }).join("") + "</div>";
      }
      if (data.footage && data.footage.length) {
        html += '<div class="vhead"><h3>' + esc(fl[0]) + "</h3><span>" + esc(fl[1]) + "</span></div>";
        var cn = data.cinema;
        if (cn) {
          html += '<section class="cinema" data-video="' + esc(cn.video) + '">' +
            '<div class="cinema__art"><img class="vfill" src="' + esc((cn.poster || "").replace(/\.jpe?g$/i, "-blur.jpg")) + '" alt="" aria-hidden="true" loading="lazy">' +
            '<img class="vmain" src="' + esc(cn.poster || "") + '" alt="" loading="lazy">' +
            '<span class="cinema__play">▶</span></div>' +
            '<div class="cinema__meta"><span class="eyebrow eyebrow--gold">' + esc(cn.kicker) + "</span>" +
            "<h2>" + esc(cn.title) + '</h2><span class="cinema__s">' + esc(cn.s) + "</span></div></section>";
        }
        html += '<div class="vgrid vgrid--wide">' + data.footage.map(function (c) { return setCard(c, true); }).join("") + "</div>";
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
      routeFilms(vaultMount);
    }).catch(function () {});
  }

  /* the viewer — click a set, walk the frames */
  var lbx = null, lbxList = [], lbxTitle = "", lbxIdx = 0, lbxCaps = [];
  var lbxShow = function (i) {
    lbxIdx = (i + lbxList.length) % lbxList.length;
    lbx.querySelector("img").src = lbxList[lbxIdx];
    var name = lbxCaps[lbxIdx] || lbxTitle;
    lbx.querySelector(".lbx__meta").textContent =
      name + (lbxList.length > 1 ? " · " + (lbxIdx + 1) + " / " + lbxList.length : "");
    var pre = new Image();
    pre.src = lbxList[(lbxIdx + 1) % lbxList.length];
  };
  var lbxClose = function () { if (lbx) { lbx.classList.remove("open"); document.body.style.overflow = ""; } };
  var lbxOpen = function (list, title, caps) {
    if (!lbx) {
      lbx = document.createElement("div");
      lbx.className = "lbx";
      lbx.innerHTML = '<button class="lbx__close" aria-label="Close">×</button>' +
        '<button class="lbx__btn lbx__prev" aria-label="Previous">←</button>' +
        '<img alt="">' +
        '<button class="lbx__btn lbx__next" aria-label="Next">→</button>' +
        '<div class="lbx__meta"></div>';
      document.body.appendChild(lbx);
      lbx.addEventListener("click", function (e) {
        if (e.target.closest(".lbx__prev")) { lbxShow(lbxIdx - 1); return; }
        if (e.target.closest(".lbx__next") || e.target.tagName === "IMG") { lbxShow(lbxIdx + 1); return; }
        if (e.target.closest(".lbx__close") || e.target === lbx) lbxClose();
      });
      document.addEventListener("keydown", function (e) {
        if (!lbx.classList.contains("open")) return;
        if (e.key === "Escape") lbxClose();
        if (e.key === "ArrowLeft") lbxShow(lbxIdx - 1);
        if (e.key === "ArrowRight") lbxShow(lbxIdx + 1);
      });
    }
    lbxList = list; lbxTitle = title; lbxCaps = caps || [];
    lbx.classList.add("open");
    document.body.style.overflow = "hidden";
    lbxShow(0);
  };
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-photos]");
    if (!el || el.getAttribute("data-video")) return;
    e.preventDefault();
    var caps = el.getAttribute("data-captions");
    lbxOpen(
      el.getAttribute("data-photos").split(","),
      el.getAttribute("data-set-title") || "",
      caps ? caps.split("|") : []
    );
  });

  /* screening room — click a poster, get the film */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-video]");
    if (!el || el.querySelector("video")) return;
    var art = el.querySelector(".cinema__art") || el.querySelector(".vset__art");
    if (!art) return;
    e.preventDefault();
    var v = document.createElement("video");
    v.src = el.getAttribute("data-video");
    v.controls = true;
    v.autoplay = true;
    v.playsInline = true;
    /* the blurred fill stays; only the still frame and the play badge go */
    art.querySelectorAll(".vmain,.cinema__play").forEach(function (n) { n.remove(); });
    art.appendChild(v);
  });

  /* ambient loops: desktop plays them in view, phones wait for a tap.
     Nothing downloads until it is actually wanted. */
  var ambient = document.querySelectorAll("video[data-ambient],video[autoplay]");
  if (ambient.length) {
    var wide = window.matchMedia("(min-width: 768px)").matches;
    var saver = (navigator.connection || {}).saveData;
    if (wide && !saver) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var v = en.target;
          if (en.isIntersecting) {
            if (v.preload === "none") { v.preload = "auto"; v.load(); }
            v.play().catch(function () {});
          } else { v.pause(); }
        });
      }, { threshold: 0.25 });
      ambient.forEach(function (v) { vio.observe(v); });
    } else {
      ambient.forEach(function (v) {
        v.removeAttribute("autoplay");
        v.parentNode.classList.add("tap-to-play");
        v.parentNode.addEventListener("click", function () {
          if (v.paused) {
            v.preload = "auto";
            v.play().catch(function () {});
            v.parentNode.classList.remove("tap-to-play");
          }
        });
      });
    }
  }

  /* year */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
