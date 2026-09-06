/* PLAYER'S CLUB™ — portal ↔ Supabase.
   The page keeps drawing the same shapes it always drew (a model ledger, a
   house ledger). This file signs people in and builds those shapes out of
   database rows, so the rest of the portal did not have to change.

   Nothing here is secret: the publishable key only lets the browser talk to
   the API, and every row it can read or write is decided server-side by row
   level security and by functions that check the caller's role. */
(function (root) {
  "use strict";

  var CONFIG = {
    url: "https://oghgufyayowoafbtrvjh.supabase.co",
    key: "sb_publishable_krmQVDhvrPTb2NjoHKrWPw_oIniiDPC",
    site: "https://playersclubhq.com/portal/"
  };

  /* ── little helpers ─────────────────────────────────────────────── */
  var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  function monthYear(iso) {
    if (!iso) return "—";
    var d = new Date(String(iso).slice(0, 10) + "T12:00:00");
    return isNaN(d) ? String(iso) : MONTHS[d.getMonth()] + " " + d.getFullYear();
  }
  function pad3(n) { return String(n == null ? "" : n).padStart(3, "0"); }
  function issueLabel(p) { return p ? (p.title + " " + pad3(p.issue_no)).trim() : "—"; }
  var ROLE = { cover: "Cover", feature: "Feature", cast: "Cast", bts: "BTS" };
  function roleWord(r) { return ROLE[r] || (r ? r.charAt(0).toUpperCase() + r.slice(1) : ""); }
  function src(path) { return path ? (/^(\.\.\/|https?:)/.test(path) ? path : "../" + path) : ""; }
  function sum(list, f) { return (list || []).reduce(function (n, x) { return n + (+(f ? f(x) : x) || 0); }, 0); }
  function by(list, key) { var m = {}; (list || []).forEach(function (x) { m[x[key]] = x; }); return m; }
  function group(list, keyFn) {
    var out = [], idx = {};
    (list || []).forEach(function (x) {
      var k = keyFn(x);
      if (!(k in idx)) { idx[k] = out.length; out.push({ key: k, items: [] }); }
      out[idx[k]].items.push(x);
    });
    return out;
  }
  function bySet(a, b) {
    return (a.set_name || "").localeCompare(b.set_name || "") || ((a.seq || 0) - (b.seq || 0));
  }
  function frameOf(a) {
    return { src: src(a.path), frame: a.frame || "", taken: a.taken_at || null, camera: a.camera || "",
             lens: a.lens || "", iso: a.iso, aperture: a.aperture || "", shutter: a.shutter || "",
             focal: a.focal || "", set: a.set_name || "", unit: a.approved !== false };
  }
  function currentQuarter(quarters) {
    var qs = (quarters || []).slice().sort(function (a, b) { return a.id < b.id ? -1 : 1; });
    return qs.filter(function (q) { return q.status === "open"; })[0] || qs[qs.length - 1] || null;
  }
  function lastClosed(quarters) {
    var qs = (quarters || []).filter(function (q) { return q.status !== "open" && q.revenue != null; })
      .sort(function (a, b) { return a.id < b.id ? 1 : -1; });
    return qs[0] || null;
  }
  /* what she is still owed: everything unpaid that has not been folded into a later quarter */
  function balanceOf(payouts) {
    return sum((payouts || []).filter(function (p) { return !p.paid && !p.rolled_into; }), function (p) { return p.amount; });
  }

  /* ── a model's ledger, from rows ────────────────────────────────── */
  function shapeModel(x) {
    var me = x.profile || {}, projects = by(x.projects, "id");
    var units = sum(x.units, function (u) { return u.units; });
    var vault = sum(x.totals, function (t) { return t.units; }) || units;
    /* her own sets first, then the group frames she is in */
    var own = function (a) { return (a.set_name || "").indexOf(me.name || "\u0000") === 0 ? 0 : 1; };
    var ownFirst = function (a, b) { return own(a) - own(b) || bySet(a, b); };
    var photos = (x.assets || []).filter(function (a) { return a.kind !== "video"; }).sort(ownFirst);
    var videos = (x.assets || []).filter(function (a) { return a.kind === "video"; }).sort(ownFirst);

    var lines = [];
    group(photos.filter(function (a) { return a.approved !== false; }), function (a) { return a.project_id + "|" + a.set_name; })
      .forEach(function (g) {
        var a0 = g.items[0];
        lines.push({ set: a0.set_name, kind: "photo", units: g.items.length, issue: issueLabel(projects[a0.project_id]),
                     photos: g.items.map(function (a) { return src(a.path); }) });
      });
    group(videos.filter(function (a) { return a.approved !== false; }), function (a) { return a.project_id; })
      .forEach(function (g) {
        var a0 = g.items[0], names = g.items.map(function (a) { return a.set_name; });
        lines.push({ set: names.length > 1 ? names[0].replace(/\s+[IVX]+$/, "") + " · " + names.length + " tapes" : names[0],
                     kind: "video", units: g.items.length, issue: issueLabel(projects[a0.project_id]),
                     videos: g.items.map(function (a) { return src(a.path); }) });
      });
    (x.placements || []).forEach(function (pl) {
      if (pl.bonus_units > 0) lines.push({ set: roleWord(pl.role) + " placement — " + issueLabel(projects[pl.project_id]),
                                           kind: "bonus", units: pl.bonus_units, issue: issueLabel(projects[pl.project_id]) });
    });

    var credits = (x.placements || []).slice().sort(function (a, b) {
      return ((projects[b.project_id] || {}).issue_no || 0) - ((projects[a.project_id] || {}).issue_no || 0);
    }).map(function (pl) {
      return { project: pl.project_id, issue: issueLabel(projects[pl.project_id]), role: roleWord(pl.role),
               billing: pl.billing || (roleWord(pl.role) + " — " + issueLabel(projects[pl.project_id])) };
    });
    var top = credits[0];

    var cur = currentQuarter(x.quarters), closed = lastClosed(x.quarters);
    var frames = photos.map(frameOf);
    var note, quarterInfo = null;
    if (closed) {
      var mine = (x.payouts || []).filter(function (p) { return p.quarter_id === closed.id; })[0];
      var pool = Math.round(closed.revenue * 40) / 100;
      var perUnit = mine && mine.units ? mine.amount / mine.units : null;
      quarterInfo = { id: closed.id, label: closed.label, revenue: +closed.revenue, pool: pool, perUnit: perUnit,
                      units: mine ? mine.units : 0, amount: mine ? +mine.amount : 0, payable: mine ? +mine.payable : 0,
                      paid: !!(mine && mine.paid), paidOn: closed.paid_on };
      note = null; /* the page writes it from quarterInfo */
    } else {
      note = "The Vault is open at no charge while the library is built, so no revenue has been booked for this quarter yet. " +
             "Your units are banked and count from the first paid quarter.";
    }

    var cast = (x.cast || []).map(function (c) {
      var pls = c.placements || [];
      var latest = pls[0];
      return { id: c.id, name: c.name, handle: c.handle || "", since: monthYear(c.since),
               portrait: src(c.portrait) || (c.id === me.id && frames[0] ? frames[0].src : ""),
               credit: latest ? roleWord(latest.role) + " · " + (latest.title + " " + pad3(latest.issue_no)).trim() : "Cast",
               latest: latest ? (latest.title + " " + pad3(latest.issue_no)).trim() + " · " + roleWord(latest.role) : "",
               covers: pls.filter(function (p) { return p.role === "cover"; }).length,
               credits: pls.map(function (p) { return { issue: (p.title + " " + pad3(p.issue_no)).trim(), billing: p.billing || roleWord(p.role) }; }),
               frames: c.id === me.id ? frames.length : null,
               profile: { tagline: c.tagline || "", wants: c.wants || "" } };
    });

    return {
      role: "model", live: true, id: me.id, email: me.email,
      name: me.name, handle: me.handle || "", since: monthYear(me.since),
      status: top ? top.billing : "Model", credit: top ? top.role + " · " + top.issue : "",
      units: units, vaultUnits: vault, poolShare: vault ? Math.round(units / vault * 1000) / 10 : 0,
      balance: balanceOf(x.payouts), threshold: 100,
      quarter: cur ? cur.label : "—", payoutDate: cur ? cur.paid_on : "—",
      note: note, quarterInfo: quarterInfo,
      lines: lines, frames: frames, photos: frames.map(function (f) { return f.src; }),
      portrait: src(me.portrait) || (frames[0] ? frames[0].src : ""),
      credits: credits,
      profile: { tagline: me.tagline || "", city: me.city || "", height: me.height || "", size: me.size || "",
                 shoe: me.shoe || "", socials: me.socials || "", available: me.available || "", wants: me.wants || "" },
      cast: cast
    };
  }

  /* ── the house ledger, from rows ────────────────────────────────── */
  function shapeHouse(x) {
    var me = x.me || {}, profiles = by(x.profiles, "id");
    var models = (x.profiles || []).filter(function (p) { return p.role === "model" && p.active !== false; });
    var projects = (x.projects || []).slice().sort(function (a, b) { return (a.issue_no || 0) - (b.issue_no || 0); });
    var pById = by(projects, "id");
    var creditsByAsset = {};
    (x.credits || []).forEach(function (c) { (creditsByAsset[c.asset_id] = creditsByAsset[c.asset_id] || []).push(c.profile_id); });
    var unitsByProfile = {}, unitsByProject = {};
    (x.units || []).forEach(function (u) {
      unitsByProfile[u.profile_id] = (unitsByProfile[u.profile_id] || 0) + (+u.units || 0);
      unitsByProject[u.project_id] = (unitsByProject[u.project_id] || 0) + (+u.units || 0);
    });
    var totalUnits = sum(x.units, function (u) { return u.units; });
    var payoutsByProfile = {};
    (x.payouts || []).forEach(function (p) { (payoutsByProfile[p.profile_id] = payoutsByProfile[p.profile_id] || []).push(p); });

    var roster = models.map(function (m) {
      var pls = (x.placements || []).filter(function (p) { return p.profile_id === m.id; })
        .sort(function (a, b) { return ((pById[b.project_id] || {}).issue_no || 0) - ((pById[a.project_id] || {}).issue_no || 0); });
      var u = unitsByProfile[m.id] || 0;
      return { id: m.id, email: m.email, name: m.name, handle: m.handle || "", units: u,
               share: totalUnits ? Math.round(u / totalUnits * 1000) / 10 : 0,
               balance: balanceOf(payoutsByProfile[m.id]),
               status: pls[0] ? pls[0].billing : "Model", role: pls[0] ? roleWord(pls[0].role) : "",
               portrait: src(m.portrait) };
    }).sort(function (a, b) { return b.units - a.units || a.name.localeCompare(b.name); });

    var shaped = projects.map(function (p) {
      var assets = (x.assets || []).filter(function (a) { return a.project_id === p.id; }).sort(bySet);
      var names = [];
      var pics = assets.filter(function (a) { return a.kind !== "video"; }).map(function (a) {
        var who = (creditsByAsset[a.id] || []).map(function (id) { return (profiles[id] || {}).name; }).filter(Boolean);
        who.forEach(function (n) { if (names.indexOf(n) < 0) names.push(n); });
        var f = frameOf(a); f.id = a.id; f.models = who; f.model = who.join(" & "); f.project = p.id;
        return f;
      });
      (x.placements || []).forEach(function (pl) {
        if (pl.project_id === p.id && profiles[pl.profile_id] && names.indexOf(profiles[pl.profile_id].name) < 0) names.push(profiles[pl.profile_id].name);
      });
      return { id: p.id, issue: pad3(p.issue_no), title: p.title, shot: p.shot_on, status: p.status,
               units: unitsByProject[p.id] || 0, models: names, pictures: pics.length,
               videos: assets.filter(function (a) { return a.kind === "video"; }).length, assets: pics };
    });

    var cur = currentQuarter(x.quarters);
    var quarters = (x.quarters || []).slice().sort(function (a, b) { return a.id < b.id ? -1 : 1; });
    var founder = me.role === "founder";
    var who = { id: me.id, email: me.email, name: me.name, role: founder ? "Founder" : "Partner",
                can: founder ? ["close", "pay", "approve", "view"] : ["approve", "view"] };

    var audit = (x.audit || []).map(function (r) {
      var actor = r.actor && profiles[r.actor] ? profiles[r.actor].name : (r.actor_email || "—");
      var detail = r.target || "";
      if (r.detail && typeof r.detail === "object") {
        var bits = Object.keys(r.detail).map(function (k) { return k + " " + String(r.detail[k]); });
        detail += (detail ? " · " : "") + bits.join(" · ");
      }
      return { at: new Date(r.at).getTime(), who: actor, action: (r.action || "").replace(/_/g, " "), detail: detail };
    });

    return {
      role: "house", live: true, name: "PLAYER'S CLUB", handle: "House", since: "Aug 2025", status: "Control Room",
      threshold: 100, quarter: cur ? cur.label : "—", quarterId: cur ? cur.id : null,
      quarterStatus: cur ? cur.status : null, quarterRevenue: cur && cur.revenue != null ? +cur.revenue : null,
      payoutDate: cur ? cur.paid_on : "—", quarters: quarters,
      totalUnits: totalUnits, models: roster.length, roster: roster, projects: shaped,
      payouts: x.payouts || [], applications: (x.applications || []).slice().sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; }),
      audit: audit, who: who, auditVersion: 3,
      note: "Every approved unit in the Vault. Close a quarter by entering its revenue below — the split is computed live and written to the database when you close it."
    };
  }

  /* ── the client ─────────────────────────────────────────────────── */
  var client = null;
  function sb() {
    if (client) return client;
    if (!root.supabase || !root.supabase.createClient) throw new Error("supabase-js did not load");
    client = root.supabase.createClient(CONFIG.url, CONFIG.key, {
      auth: { flowType: "implicit", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return client;
  }
  function must(p) {
    return p.then(function (r) { if (r.error) throw r.error; return r.data; });
  }
  function q(table, select, mod) {
    var s = sb().from(table).select(select || "*");
    if (mod) s = mod(s);
    return must(s);
  }

  var API = {
    ready: !!(CONFIG.url && CONFIG.key),
    config: CONFIG,
    shapeModel: shapeModel,
    shapeHouse: shapeHouse,

    session: function () { return must(sb().auth.getSession()).then(function (d) { return d.session || null; }); },
    onAuth: function (cb) { sb().auth.onAuthStateChange(function (ev, s) { cb(ev, s); }); },
    signIn: function (email, password) {
      return must(sb().auth.signInWithPassword({ email: String(email).trim().toLowerCase(), password: password }));
    },
    signOut: function () { return sb().auth.signOut().catch(function () {}); },
    sendReset: function (email) {
      return must(sb().auth.resetPasswordForEmail(String(email).trim().toLowerCase(), { redirectTo: CONFIG.site }));
    },
    setPassword: function (pw) { return must(sb().auth.updateUser({ password: pw })); },

    /* who am I, then everything I am allowed to see */
    load: function () {
      return API.session().then(function (s) {
        if (!s) throw new Error("nosession");
        var email = String(s.user.email || "").toLowerCase();
        return q("profiles", "*", function (x) { return x.eq("email", email).maybeSingle(); }).then(function (me) {
          if (!me || !me.id) throw new Error("noprofile");
          if (me.active === false) throw new Error("inactive");
          return me.role === "model" ? loadModel(me) : loadHouse(me);
        });
      });
    },
    saveProfile: function (fields) { return must(sb().rpc("update_my_profile", { p: fields })); },
    log: function (action, target, detail) {
      return must(sb().rpc("log_action", { p_action: action, p_target: target || null, p_detail: detail || null })).catch(function () {});
    },
    closeQuarter: function (id, revenue) { return must(sb().rpc("close_quarter", { p_quarter: id, p_revenue: revenue })); },
    markPaid: function (quarterId, profileId) { return must(sb().rpc("mark_paid", { p_quarter: quarterId, p_profile: profileId })); },
    review: function (id, status) { return must(sb().rpc("review_application", { p_id: id, p_status: status })); },
    addToRoster: function (p) {
      return must(sb().from("profiles").insert([{ email: String(p.email).trim().toLowerCase(), role: "model", name: p.name,
        handle: p.handle || null, since: new Date().toISOString().slice(0, 10), city: p.city || null }]).select().single());
    },
    crewKey: function () {
      return q("club_keys", "k,v", function (x) { return x.eq("k", "crew").maybeSingle(); })
        .then(function (r) { return r ? r.v : null; }).catch(function () { return null; });
    }
  };

  function loadModel(me) {
    return Promise.all([
      q("projects"),
      q("assets", "id,project_id,kind,path,set_name,seq,frame,taken_at,camera,lens,iso,aperture,shutter,focal,approved"),
      q("placements", "project_id,profile_id,role,bonus_units,billing"),
      q("model_units"),
      q("quarters"),
      q("payouts"),
      must(sb().rpc("vault_totals")).catch(function () { return []; }),
      q("cast_public").catch(function () { return []; })
    ]).then(function (r) {
      return { role: "model", data: shapeModel({ profile: me, projects: r[0], assets: r[1], placements: r[2], units: r[3],
                                                 quarters: r[4], payouts: r[5], totals: r[6], cast: r[7] }) };
    });
  }
  function loadHouse(me) {
    return Promise.all([
      q("profiles"),
      q("projects"),
      q("assets", "id,project_id,kind,path,set_name,seq,frame,taken_at,camera,lens,iso,aperture,shutter,focal,approved"),
      q("asset_credits", "asset_id,profile_id"),
      q("placements", "project_id,profile_id,role,bonus_units,billing"),
      q("model_units"),
      q("quarters"),
      q("payouts"),
      q("applications", "*", function (x) { return x.order("created_at", { ascending: false }).limit(200); }),
      q("audit_log", "*", function (x) { return x.order("at", { ascending: false }).limit(300); })
    ]).then(function (r) {
      return { role: "house", data: shapeHouse({ me: me, profiles: r[0], projects: r[1], assets: r[2], credits: r[3], placements: r[4],
                                                 units: r[5], quarters: r[6], payouts: r[7], applications: r[8], audit: r[9] }) };
    });
  }

  root.PCLive = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
