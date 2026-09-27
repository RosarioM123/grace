/* TheGirlSavedByGrace — interactions.
   1. Scroll progress bar. 2. Smooth-scroll buttons. 3. Canvas globe (ported
   from the original site's globe: rotating wireframe, continent shapes,
   country markers, drag to spin, hover tooltips). 4. Waitlist form -> Formspree. */

(function () {
  "use strict";

  /* ---------- 1. scroll progress ---------- */
  var progressFill = document.getElementById("progressFill");
  function updateProgress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    progressFill.style.width = pct + "%";
  }
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();

  /* ---------- 2. smooth scroll ---------- */
  document.querySelectorAll("[data-scroll]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var el = document.getElementById(btn.getAttribute("data-scroll"));
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* ---------- 3. globe ---------- */
  var MARKERS = [
    { name: "United States", lat: 39.8, lng: -98.5 },
    { name: "Philippines", lat: 12.8, lng: 122 },
    { name: "United Kingdom", lat: 55.3, lng: -3.4 },
    { name: "Uruguay", lat: -32.5, lng: -55.7 },
    { name: "Canada", lat: 56.1, lng: -106.3 },
    { name: "Singapore", lat: 1.3, lng: 103.8 },
    { name: "Russia", lat: 61.5, lng: 105.3 },
    { name: "Jamaica", lat: 18.1, lng: -77.2 },
    { name: "South Africa", lat: -30.5, lng: 22.9 },
    { name: "Czechia", lat: 49.8, lng: 15.4 },
    { name: "Brazil", lat: -14.2, lng: -51.9 },
    { name: "Nigeria", lat: 9, lng: 8.6 },
    { name: "Germany", lat: 51.1, lng: 10.4 },
    { name: "Australia", lat: -25.2, lng: 133.7 },
    { name: "Mexico", lat: 23.6, lng: -102.5 },
    { name: "India", lat: 20.5, lng: 78.9 },
    { name: "Japan", lat: 36.2, lng: 138.2 },
    { name: "Kenya", lat: -1.2, lng: 36.8 }
  ];

  var LAND = [
    { id: "na", fill: "#D6C7B0", points: [[71,-168],[71,-60],[55,-52],[49,-65],[39,-74],[30,-82],[25,-84],[20,-96],[22,-115],[32,-120],[44,-124],[54,-130],[61,-150],[71,-168]] },
    { id: "sa", fill: "#D4C4B0", points: [[12,-82],[6,-60],[0,-48],[-6,-48],[-20,-38],[-34,-55],[-54,-68],[-54,-73],[-30,-82],[0,-82],[12,-82]] },
    { id: "eu", fill: "#CFC2B2", points: [[70,-10],[69,10],[66,22],[60,30],[55,32],[50,28],[46,18],[42,10],[38,0],[38,-8],[45,-12],[55,-14],[70,-10]] },
    { id: "af", fill: "#DDD0BC", points: [[36,-16],[36,42],[22,50],[5,44],[-8,38],[-22,32],[-34,22],[-34,12],[-20,4],[-5,-6],[6,-18],[36,-16]] },
    { id: "as", fill: "#D8CAB6", points: [[55,32],[55,60],[50,80],[42,90],[36,100],[30,115],[26,125],[22,135],[40,145],[55,150],[65,140],[70,100],[70,50],[55,32]] },
    { id: "au", fill: "#D2C0A8", points: [[-12,115],[-12,155],[-28,152],[-34,140],[-32,115],[-12,115]] },
    { id: "gr", fill: "#CABEA9", points: [[60,-45],[72,-40],[78,-25],[70,-18],[60,-45]] }
  ];

  function initGlobe() {
    var wrap = document.getElementById("globeWrap");
    var canvas = document.getElementById("globeCanvas");
    var tip = document.getElementById("globeTip");
    var tipName = document.getElementById("globeTipName");
    if (!wrap || !canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var rot = 0;          // rotation (radians-ish, matches original units)
    var tilt = -12;       // axial tilt in degrees
    var vel = 0;          // spin velocity
    var dragging = false;
    var dragStartX = 0;
    var dragStartRot = 0;
    var scrollPos = window.scrollY;
    var hits = [];

    function project(lat, lng, R, cx, cy) {
      var X = (90 - lat) * Math.PI / 180;
      var O = (lng + rot) * Math.PI / 180;
      var H = tilt * Math.PI / 180;
      var B = R * Math.sin(X) * Math.cos(O);
      var D = R * Math.cos(X);
      var uA = R * Math.sin(X) * Math.sin(O);
      var y3 = D * Math.cos(H) - uA * Math.sin(H);
      var z = D * Math.sin(H) + uA * Math.cos(H);
      return { x: cx + B * 0.96, y: cy - y3 * 0.58, z: z, visible: z > -R * 0.12 };
    }

    function jittered(poly, R, cx, cy) {
      return poly.points.map(function (pt, idx) {
        var p = project(pt[0], pt[1], R, cx, cy);
        var q = Math.sin(idx * 1.9 + pt[0] * 0.8) * 0.9 + Math.cos(idx * 0.7) * 0.4;
        return { x: p.x + q, y: p.y + q * 0.6, visible: p.visible };
      });
    }

    function tracePath(pts) {
      var started = false;
      pts.forEach(function (p) {
        if (!p.visible) { started = false; return; }
        if (!started) { ctx.moveTo(p.x, p.y); started = true; }
        else ctx.lineTo(p.x, p.y);
      });
    }

    function frame() {
      var rect = wrap.getBoundingClientRect();
      var W = rect.width, H = rect.height;
      if (W === 0 || H === 0) { requestAnimationFrame(frame); return; }
      var cx = W / 2, cy = H / 2 + 8;
      var R = Math.min(W, H) * 0.4;

      if (!dragging) {
        vel *= 0.98;
        if (Math.abs(vel) < 0.015) vel = 0.035;
        rot += vel + (scrollPos % 1000) * 0.00002;
      }

      ctx.clearRect(0, 0, W, H);

      // backdrop
      ctx.fillStyle = "#FAF6F1";
      ctx.fillRect(0, 0, W, H);

      // sphere
      ctx.fillStyle = "#EDE6DA";
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

      // soft highlight
      var g = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.3, R * 0.1, cx, cy, R);
      g.addColorStop(0, "rgba(255,255,255,0.28)");
      g.addColorStop(0.55, "rgba(237,230,218,0)");
      g.addColorStop(1, "rgba(0,0,0,0.05)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

      // graticule
      ctx.save();
      ctx.strokeStyle = "rgba(26,26,26,0.08)";
      ctx.lineWidth = 0.6;
      var lat, lng, p, started, i;
      for (lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath(); started = false;
        for (lng = -180; lng <= 180; lng += 4) {
          p = project(lat, lng, R, cx, cy);
          if (!p.visible) { started = false; continue; }
          var onDisc = (p.x - cx) * (p.x - cx) + (p.y - cy) * (p.y - cy) <= R * R + 2;
          if (!onDisc) { started = false; continue; }
          if (!started) { ctx.moveTo(p.x, p.y); started = true; }
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }
      for (lng = -150; lng <= 150; lng += 30) {
        ctx.beginPath(); started = false;
        for (lat = -80; lat <= 80; lat += 3) {
          p = project(lat, lng, R, cx, cy);
          if (!p.visible) { started = false; continue; }
          var onDisc2 = (p.x - cx) * (p.x - cx) + (p.y - cy) * (p.y - cy) <= R * R + 2;
          if (!onDisc2) { started = false; continue; }
          if (!started) { ctx.moveTo(p.x, p.y); started = true; }
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }
      ctx.restore();

      // land fills
      LAND.forEach(function (poly) {
        var pts = jittered(poly, R, cx, cy).filter(function (q) { return q.visible; });
        if (pts.length < 3) return;
        ctx.save();
        ctx.fillStyle = poly.fill;
        ctx.globalAlpha = 0.92;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        pts.forEach(function (q) { ctx.lineTo(q.x, q.y); });
        ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "#121212";
        ctx.fill();
        ctx.restore();
      });

      // land outlines
      ctx.strokeStyle = "#1A1A1A";
      ctx.lineWidth = 1;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      LAND.forEach(function (poly) {
        ctx.beginPath();
        tracePath(jittered(poly, R, cx, cy));
        ctx.stroke();
      });

      // markers
      hits = [];
      MARKERS.forEach(function (m) {
        var mp = project(m.lat, m.lng, R, cx, cy);
        if (mp.visible) {
          ctx.strokeStyle = "#121212";
          ctx.lineWidth = 0.9;
          ctx.fillStyle = "#C25E3E";
          ctx.beginPath(); ctx.arc(mp.x, mp.y, 3, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
        }
        hits.push({ x: mp.x, y: mp.y, visible: mp.visible, country: m });
      });

      requestAnimationFrame(frame);
    }

    function resize() {
      var dpr = window.devicePixelRatio || 1;
      var rect = wrap.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    window.addEventListener("scroll", function () { scrollPos = window.scrollY; }, { passive: true });
    window.addEventListener("resize", resize);
    resize();

    wrap.addEventListener("pointerdown", function (e) {
      dragging = true;
      dragStartX = e.clientX;
      dragStartRot = rot;
      vel = 0;
      try { wrap.setPointerCapture(e.pointerId); } catch (err) {}
    });
    wrap.addEventListener("pointermove", function (e) {
      if (dragging) {
        var dx = (e.clientX - dragStartX) * 0.35;
        rot = dragStartRot + dx;
        vel = dx * 0.01 - vel * 0.5;
        return;
      }
      var rect = wrap.getBoundingClientRect();
      var mx = e.clientX - rect.left, my = e.clientY - rect.top;
      var best = null, bestD = 18;
      hits.forEach(function (h) {
        if (!h.visible) return;
        var d = Math.sqrt((h.x - mx) * (h.x - mx) + (h.y - my) * (h.y - my));
        if (d < bestD) { bestD = d; best = h.country; }
      });
      if (best) { tipName.textContent = best.name; tip.hidden = false; }
      else tip.hidden = true;
    });
    wrap.addEventListener("pointerup", function (e) {
      if (dragging) vel = (e.clientX - dragStartX) * 0.005;
      dragging = false;
    });
    wrap.addEventListener("pointerleave", function () {
      dragging = false;
      tip.hidden = true;
    });

    requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGlobe);
  } else {
    initGlobe();
  }

  /* ---------- 4. waitlist form ---------- */
  var FORMSPREE_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID"; // owner: paste the real form ID here
  var CF_BEACON_TOKEN = ""; // owner: paste the Cloudflare Web Analytics token here (optional)

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function initForm() {
    var form = document.getElementById("waitlistForm");
    if (!form) return;
    var email = document.getElementById("email");
    var age = document.getElementById("age");
    var btn = document.getElementById("submitBtn");
    var msg = document.getElementById("formMsg");
    var micro = document.getElementById("microcopy");
    var honeypot = form.querySelector(".honeypot");

    function showMsg(text, kind) {
      msg.textContent = text;
      msg.className = "form-msg" + (kind ? " " + kind : "");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      showMsg("", "");

      var value = email.value.trim();
      if (!EMAIL_RE.test(value)) {
        showMsg("Please enter a valid email address.", "error");
        email.focus();
        return;
      }
      if (!age.checked) {
        showMsg("Please confirm you are 13 or older to join.", "error");
        age.focus();
        return;
      }
      if (honeypot.value) return; // bots go nowhere
      if (FORMSPREE_ENDPOINT.indexOf("YOUR_FORM_ID") !== -1) {
        showMsg("Signup is not connected yet. The site owner needs to add the form ID.", "error");
        return;
      }

      btn.disabled = true;
      var original = btn.textContent;
      btn.textContent = "Joining...";

      fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          email: value,
          age_confirm: "yes",
          _subject: "New TheGirlSavedByGrace waitlist signup"
        })
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (out) {
          if (!out.ok) throw new Error("formspree rejected the submission");
          btn.textContent = "joined";
          showMsg("You are in. Early access invite coming soon.", "success");
          if (micro) micro.style.display = "none";
          email.value = "";
          age.checked = false;
        })
        .catch(function () {
          showMsg("Something went wrong. Please try again.", "error");
          btn.disabled = false;
          btn.textContent = original;
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initForm);
  } else {
    initForm();
  }

  /* ---------- 5. Cloudflare Web Analytics (only when a token is set) ---------- */
  if (CF_BEACON_TOKEN) {
    var s = document.createElement("script");
    s.defer = true;
    s.src = "https://static.cloudflareinsights.com/beacon.min.js";
    s.setAttribute("data-cf-beacon", JSON.stringify({ token: CF_BEACON_TOKEN }));
    document.head.appendChild(s);
  }
})();
