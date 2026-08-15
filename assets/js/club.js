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

  /* year */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
