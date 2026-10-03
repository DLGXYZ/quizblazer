// Events page: renders upcoming games from events.json (the same file the CrowPanel reads)
document.addEventListener("DOMContentLoaded", function () {
  var list = document.getElementById("event-list");
  if (!list) return;

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }

  // "18:30" -> "6:30 PM"
  function clock(time) {
    var parts = String(time || "").split(":");
    var h = parseInt(parts[0], 10), m = parts[1] || "00";
    if (isNaN(h)) return time || "";
    return ((h + 11) % 12 + 1) + ":" + m + " " + (h < 12 ? "AM" : "PM");
  }

  function message(text) {
    list.innerHTML = "";
    list.appendChild(el("li", "event-empty", text));
  }

  fetch("events.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      var events = (data.events || [])
        .map(function (e) {
          var d = String(e.date || "").split("-");
          e._day = new Date(+d[0], +d[1] - 1, +d[2]);
          return e;
        })
        .filter(function (e) { return !isNaN(e._day) && e._day >= today; })
        .sort(function (a, b) { return a._day - b._day || String(a.time).localeCompare(String(b.time)); });

      if (!events.length) {
        message("No games on the schedule right now. Check back soon.");
        return;
      }

      list.innerHTML = "";
      events.forEach(function (e) {
        var item = el("li", "event");

        var tile = el("div", "event-date");
        tile.setAttribute("aria-hidden", "true");
        tile.appendChild(el("span", "event-month", MONTHS[e._day.getMonth()]));
        tile.appendChild(el("span", "event-day", String(e._day.getDate())));
        item.appendChild(tile);

        var body = el("div", "event-body");
        body.appendChild(el("h2", "event-title", e.title));
        var when = DAYS[e._day.getDay()] + ", " + MONTHS[e._day.getMonth()] + " " + e._day.getDate();
        body.appendChild(el("p", "event-when", when));
        var place = [e.city, e.state].filter(Boolean).join(", ");
        var where = el("p", "event-where");
        var map = el("a", null, e.venue);
        map.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent([e.venue, place].join(" "));
        map.target = "_blank";
        map.rel = "noopener";
        where.appendChild(map);
        if (place) where.appendChild(document.createTextNode(" · " + place));
        body.appendChild(where);
        if (e.note) body.appendChild(el("p", "event-note", e.note));
        item.appendChild(body);

        item.appendChild(el("div", "event-time", clock(e.time)));
        list.appendChild(item);
      });
    })
    .catch(function () {
      message("The schedule couldn't load. Please try again in a moment.");
    });
});
