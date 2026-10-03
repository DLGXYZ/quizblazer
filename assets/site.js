// Mobile menu toggle
document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", function () {
    var open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
});

// Get started form: "Other" reveals, plan prefill, and in-page submit
document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("fit-form");
  if (!form) return;

  // Show the extra text box when an option with data-other is picked
  form.querySelectorAll('input[type="radio"]').forEach(function (radio) {
    radio.addEventListener("change", function () {
      form.querySelectorAll('input[name="' + radio.name + '"]').forEach(function (r) {
        if (!r.dataset.other) return;
        var box = document.getElementById(r.dataset.other);
        box.hidden = !r.checked;
        if (r.checked) box.focus(); else box.value = "";
      });
    });
  });

  // Pre-select "Interested in" from links like get-started.html?plan=bundle
  var plans = { free: "Free first game", "a-la-carte": "A la carte games", bundle: "Bundle", extras: "Extras" };
  var plan = plans[new URLSearchParams(location.search).get("plan")];
  if (plan) {
    form.querySelectorAll('input[name="Interested in"]').forEach(function (r) {
      if (r.value.indexOf(plan) === 0) r.checked = true;
    });
  }

  var error = document.getElementById("form-error");
  var thanks = document.getElementById("form-thanks");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    error.hidden = true;
    var data = {};
    new FormData(form).forEach(function (value, key) { if (value !== "") data[key] = value; });
    fetch(form.action.replace("formsubmit.co/", "formsubmit.co/ajax/"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data)
    })
      .then(function (res) { return res.json(); })
      .then(function (res) {
        if (String(res.success) !== "true") throw new Error(res.message);
        form.hidden = true;
        thanks.hidden = false;
        thanks.focus();
        thanks.scrollIntoView({ behavior: "smooth", block: "center" });
      })
      .catch(function () {
        error.hidden = false;
        button.disabled = false;
      });
  });
});

// Screenshots: tap or click to see them full size
document.addEventListener("DOMContentLoaded", function () {
  var shots = document.querySelectorAll(".feature-media.has-shot img");
  if (!shots.length) return;

  var box = document.createElement("div");
  box.className = "lightbox";
  box.hidden = true;
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "Screenshot, full size");
  box.innerHTML = '<button type="button" class="lightbox-close">CLOSE</button><img alt=""><p class="lightbox-caption"></p>';
  document.body.appendChild(box);
  var big = box.querySelector("img");
  var caption = box.querySelector(".lightbox-caption");
  var close = box.querySelector(".lightbox-close");
  var opener = null;

  function show(img) {
    opener = img;
    big.src = img.currentSrc || img.src;
    big.alt = img.alt;
    caption.textContent = img.alt;
    box.hidden = false;
    document.body.classList.add("lightbox-open");
    close.focus();
  }
  function hide() {
    box.hidden = true;
    document.body.classList.remove("lightbox-open");
    if (opener) opener.focus();
  }

  shots.forEach(function (img) {
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", img.alt + " (view full size)");
    img.addEventListener("click", function () { show(img); });
    img.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(img); }
    });
  });
  box.addEventListener("click", hide);
  document.addEventListener("keydown", function (e) {
    if (!box.hidden && e.key === "Escape") hide();
  });
});
