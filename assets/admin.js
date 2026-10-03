// Schedule editor: edits events.json with a form and saves it to GitHub, so the file is always valid
document.addEventListener("DOMContentLoaded", function () {
  var REPO = "DLGXYZ/quizblazer";
  var BRANCH = "main";
  var FILE = "events.json";
  var API = "https://api.github.com/repos/" + REPO + "/contents/" + FILE;
  var KEY_STORE = "qb-github-key";

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  var $ = function (id) { return document.getElementById(id); };
  var list = $("game-list"), editor = $("editor"), form = $("game-form");
  var publishBtn = $("publish"), publishMsg = $("publish-msg");

  var token = "";
  var data = { updated: "", events: [] }; // whole file, so any extra fields are kept
  var sha = null;                          // GitHub's id for the version we loaded
  var editing = -1;                        // index being edited, -1 for a new game
  var dirty = false;

  function storeGet() { try { return localStorage.getItem(KEY_STORE) || ""; } catch (e) { return ""; } }
  function storeSet(v) { try { v ? localStorage.setItem(KEY_STORE, v) : localStorage.removeItem(KEY_STORE); } catch (e) {} }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }

  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function clock(time) {
    var p = String(time || "").split(":"), h = parseInt(p[0], 10);
    if (isNaN(h)) return time || "";
    return ((h + 11) % 12 + 1) + ":" + (p[1] || "00") + " " + (h < 12 ? "AM" : "PM");
  }

  function sortEvents() {
    data.events.sort(function (a, b) {
      return String(a.date).localeCompare(String(b.date)) || String(a.time).localeCompare(String(b.time));
    });
  }

  // Text <-> base64 that survives accents and curly quotes
  function toB64(text) {
    var bytes = new TextEncoder().encode(text), bin = "";
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin);
  }
  function fromB64(b64) {
    var bin = atob(b64.replace(/\s/g, "")), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function fileText() {
    sortEvents();
    return JSON.stringify(data, null, 2) + "\n";
  }

  function setDirty(on) {
    dirty = on;
    $("dirty").textContent = on ? "Unsaved changes" : "No changes";
    $("dirty").classList.toggle("on", on);
    publishBtn.disabled = !on || !token;
    if (on && !token) publishMsg.textContent = "Connect your key above to publish, or download the file instead.";
    else if (on) publishMsg.textContent = "Press Publish to put these changes on the website.";
  }

  function render() {
    sortEvents();
    list.innerHTML = "";
    $("count").textContent = data.events.length + (data.events.length === 1 ? " game" : " games");
    if (!data.events.length) {
      list.appendChild(el("li", "game-empty", "No games yet. Add one below."));
      return;
    }
    var now = today();
    data.events.forEach(function (e, i) {
      var item = el("li", "game" + (e.date < now ? " past" : ""));
      var d = String(e.date || "").split("-"), day = new Date(+d[0], +d[1] - 1, +d[2]);
      var tile = el("div", "game-date");
      tile.appendChild(el("span", "game-month", isNaN(day) ? "?" : MONTHS[day.getMonth()]));
      tile.appendChild(el("span", "game-day", isNaN(day) ? "" : String(day.getDate())));
      item.appendChild(tile);

      var body = el("div", "game-body");
      body.appendChild(el("h2", "game-title", e.title));
      var when = (isNaN(day) ? e.date : DAYS[day.getDay()] + " " + MONTHS[day.getMonth()] + " " + day.getDate() + ", " + day.getFullYear()) + " at " + clock(e.time);
      body.appendChild(el("p", "game-when", when + (e.date < now ? "  (past, hidden on the site)" : "")));
      body.appendChild(el("p", "game-where", [e.venue, [e.city, e.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ")));
      if (e.note) body.appendChild(el("p", "game-note", e.note));
      item.appendChild(body);

      var actions = el("div", "game-actions");
      var edit = el("button", "btn btn-ghost btn-small", "Edit");
      edit.type = "button";
      edit.addEventListener("click", function () { openEditor(i); });
      var del = el("button", "btn btn-ghost btn-small btn-danger", "Delete");
      del.type = "button";
      del.addEventListener("click", function () {
        if (!confirm('Delete "' + e.title + '"?')) return;
        data.events.splice(i, 1);
        closeEditor();
        render();
        setDirty(true);
      });
      actions.appendChild(edit);
      actions.appendChild(del);
      item.appendChild(actions);
      list.appendChild(item);
    });
  }

  function openEditor(i) {
    editing = i;
    var e = i >= 0 ? data.events[i] : { title: "", date: "", time: "18:30", venue: "", city: "", state: "", note: "" };
    ["title", "date", "time", "venue", "city", "state", "note"].forEach(function (k) { form.elements[k].value = e[k] || ""; });
    $("editor-title").textContent = i >= 0 ? "Edit game" : "New game";
    $("game-error").hidden = true;
    editor.hidden = false;
    editor.scrollIntoView({ behavior: "smooth", block: "start" });
    form.elements.title.focus({ preventScroll: true });
  }

  function closeEditor() {
    editor.hidden = true;
    editing = -1;
    form.reset();
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var f = form.elements;
    var g = {
      title: f.title.value.trim(),
      date: f.date.value,
      time: f.time.value.slice(0, 5),
      venue: f.venue.value.trim(),
      city: f.city.value.trim(),
      state: f.state.value.trim().toUpperCase(),
      note: f.note.value.trim().replace(/\s+/g, " ")
    };
    var problem =
      !g.title ? "Give the game a name." :
      !/^\d{4}-\d{2}-\d{2}$/.test(g.date) ? "Pick a date." :
      !/^\d{2}:\d{2}$/.test(g.time) ? "Pick a start time." :
      !g.venue ? "Add the venue name." : "";
    if (problem) {
      $("game-error").textContent = problem;
      $("game-error").hidden = false;
      return;
    }
    if (editing >= 0) data.events[editing] = Object.assign({}, data.events[editing], g);
    else data.events.push(g);
    closeEditor();
    render();
    setDirty(true);
    list.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  $("cancel-edit").addEventListener("click", closeEditor);
  $("add-game").addEventListener("click", function () { openEditor(-1); });

  function showConnected(on) {
    $("connect-form").hidden = on;
    $("connected").hidden = !on;
    $("connect-state").textContent = on ? "Connected" : "Not connected";
    $("connect-state").classList.toggle("on", on);
  }

  function gh(method, body) {
    return fetch(API + (method === "GET" ? "?ref=" + BRANCH + "&t=" + Date.now() : ""), {
      method: method,
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined
    });
  }

  function useFile(parsed) {
    if (!parsed || !Array.isArray(parsed.events)) throw new Error("The schedule file is missing its list of games.");
    data = parsed;
    closeEditor();
    render();
    setDirty(false);
  }

  // Load the latest copy straight from GitHub (needs the key)
  function loadFromGitHub() {
    return gh("GET").then(function (r) {
      if (r.status === 401) throw new Error("GitHub didn't accept that key. Check it was copied in full, or make a new one.");
      if (r.status === 404) throw new Error("That key can't see the quizblazer repository. Make sure you picked it under Repository access.");
      if (!r.ok) throw new Error("GitHub said " + r.status + ". Try again in a moment.");
      return r.json();
    }).then(function (file) {
      sha = file.sha;
      var parsed;
      try { parsed = JSON.parse(fromB64(file.content)); }
      catch (e) { throw new Error("The current events.json has a typo in it, so it can't be opened here. Ask Claude to fix it."); }
      useFile(parsed);
    });
  }

  // Without a key, show what's live on the site (read only)
  function loadFromSite() {
    return fetch(FILE + "?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(useFile)
      .catch(function () { list.innerHTML = ""; list.appendChild(el("li", "game-empty", "The schedule couldn't load.")); });
  }

  function connect(key, remember) {
    token = key;
    publishMsg.textContent = "Connecting...";
    return loadFromGitHub().then(function () {
      if (remember) storeSet(key);
      showConnected(true);
      publishMsg.textContent = "Loaded the latest schedule. Changes stay on this page until you publish them.";
    }).catch(function (err) {
      token = "";
      storeSet("");
      showConnected(false);
      publishMsg.textContent = err.message;
      return loadFromSite();
    });
  }

  $("connect-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var key = $("token").value.trim();
    if (!key) return;
    if (dirty && !confirm("Connecting reloads the schedule from the website and drops changes you haven't published. Continue?")) return;
    $("token").value = "";
    connect(key, $("remember").checked);
  });

  $("disconnect").addEventListener("click", function () {
    token = "";
    sha = null;
    storeSet("");
    showConnected(false);
    setDirty(dirty);
  });

  publishBtn.addEventListener("click", function () {
    if (!token || !dirty) return;
    publishBtn.disabled = true;
    publishMsg.textContent = "Publishing...";
    data.updated = today();
    gh("PUT", { message: "Update event schedule", content: toB64(fileText()), sha: sha, branch: BRANCH })
      .then(function (r) {
        if (r.status === 409 || r.status === 422) throw new Error("The schedule was changed somewhere else since you opened this page. Reload the page and make your changes again.");
        if (r.status === 401) throw new Error("GitHub didn't accept your key. It may have expired; make a new one and connect again.");
        if (r.status === 403 || r.status === 404) throw new Error("Your key isn't allowed to save. Make sure Contents is set to Read and write.");
        if (!r.ok) throw new Error("GitHub said " + r.status + ". Nothing was saved; try again.");
        return r.json();
      })
      .then(function (res) {
        sha = res.content.sha;
        setDirty(false);
        render();
        publishMsg.textContent = "Published. The Events page and CrowPanel will show it in about a minute.";
      })
      .catch(function (err) {
        publishMsg.textContent = err.message;
        publishBtn.disabled = false;
      });
  });

  $("download").addEventListener("click", function () {
    if (dirty) data.updated = today();
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([fileText()], { type: "application/json" }));
    a.download = FILE;
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  window.addEventListener("beforeunload", function (ev) {
    if (dirty) { ev.preventDefault(); ev.returnValue = ""; }
  });

  var saved = storeGet();
  if (saved) connect(saved, true);
  else { showConnected(false); loadFromSite(); }
});
