/* TheGirlSavedByGrace - main.js
   Waitlist form logic (Formspree), Cloudflare beacon injection,
   external-link behavior. No frameworks. */

(function () {
  "use strict";

  /* ============ OWNER SETTINGS ============
     1. Create a free form at https://formspree.io and paste its endpoint below.
        It looks like: https://formspree.io/f/xabcyz12
     2. (Optional) Paste your Cloudflare Web Analytics token below.
        Leave it empty ("") and no beacon will load. */
  var FORMSPREE_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID";
  var CF_BEACON_TOKEN = "";

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* ---------- Cloudflare Web Analytics (only when a token is set) ---------- */
  if (CF_BEACON_TOKEN) {
    var beacon = document.createElement("script");
    beacon.defer = true;
    beacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
    beacon.setAttribute("data-cf-beacon", JSON.stringify({ token: CF_BEACON_TOKEN }));
    document.body.appendChild(beacon);
  }

  /* ---------- External links open in new tabs, safely ---------- */
  function markExternalLinks(root) {
    var links = (root || document).querySelectorAll("a[href]");
    for (var i = 0; i < links.length; i++) {
      (function (a) {
        var href = a.getAttribute("href");
        if (!href) return;
        try {
          var url = new URL(href, document.baseURI);
          if ((url.protocol === "http:" || url.protocol === "https:") && url.host !== location.host) {
            a.target = "_blank";
            a.rel = "noopener noreferrer";
          }
        } catch (e) { /* ignore malformed hrefs */ }
      })(links[i]);
    }
  }
  if (document.readyState !== "loading") {
    markExternalLinks();
  } else {
    document.addEventListener("DOMContentLoaded", markExternalLinks);
  }

  /* ---------- Waitlist form ---------- */
  var form = document.getElementById("waitlist-form");
  if (!form) return;

  var emailInput = document.getElementById("waitlist-email");
  var ageCheckbox = document.getElementById("age-confirm");
  var submitBtn = document.getElementById("waitlist-submit");
  var message = document.getElementById("form-message");
  var endpointConfigured = FORMSPREE_ENDPOINT.indexOf("YOUR_FORM_ID") === -1;

  function setMessage(text, kind) {
    message.textContent = text;
    message.className = "form-message" + (kind ? " " + kind : "");
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    setMessage("", "");

    var email = emailInput.value.trim();

    if (!EMAIL_RE.test(email)) {
      setMessage("Please enter a valid email address.", "error");
      emailInput.focus();
      return;
    }

    if (!ageCheckbox.checked) {
      setMessage("Please confirm you are 13 or older to join.", "error");
      ageCheckbox.focus();
      return;
    }

    if (!endpointConfigured) {
      // Honest failure: never pretend a signup worked.
      setMessage("Signup is not connected yet. The site owner needs to add the form ID in main.js.", "error");
      return;
    }

    submitBtn.disabled = true;
    var originalLabel = submitBtn.textContent;
    submitBtn.textContent = "Joining\u2026";

    var payload = {
      email: email,
      age_confirm: "yes",
      _gotcha: form.querySelector('input[name="_gotcha"]').value,
      _subject: "New TheGirlSavedByGrace waitlist signup"
    };

    fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return { ok: response.ok, data: data };
        });
      })
      .then(function (result) {
        if (result.ok) {
          setMessage("You are in. Early access invite coming soon.", "success");
          emailInput.value = "";
          ageCheckbox.checked = false;
          submitBtn.textContent = "Joined";
          // Keep it disabled: this email is on the list now.
        } else {
          throw new Error((result.data && result.data.error) || "bad response");
        }
      })
      .catch(function () {
        setMessage("Something went wrong. Please try again.", "error");
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      });
  });
})();
