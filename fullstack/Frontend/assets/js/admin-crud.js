/**
 * admin-crud.js — Generic admin CRUD tables (Phase 16, from scratch, no kit).
 * One file drives destinations / hotels / restaurants / countries via
 * <body data-module="...">. Route shape: GET/POST/PUT/DELETE /v1/admin/{module}.
 *
 * Phase 17: datatable (search/sort/pagination), empty-state, dialog polish,
 * form validation states, toasts. Query contract:
 *   GET /v1/admin/{module}?page&per_page&search&sort_by&sort_order
 * When the backend returns {data:{data,links,meta}} the list is server-paged;
 * a bare array is treated as the full set and paged client-side.
 */
(function (global) {
  "use strict";

  const It = global.Itinera;

  const MODULES = {
    destinations: {
      url: "/admin/destinations",
      listLabel: "destinations",
      singular: "destination",
      sortable: { ID: "id", Name: "name", City: "city_name", Country: "country_id", Created: "created_at" },
      cols: ["ID", "Name", "City", "Country", "Created", "Actions"],
      cells: [
        function (row) { return row.city_name || "–"; },
        function (row) { return (row.country && row.country.name) || row.country_id || "–"; },
        function (row) { return fmtDate(row.created_at); },
      ],
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "city_name", label: "City", type: "text", required: true },
        { key: "country_id", label: "Country", type: "select", optionsUrl: "/admin/countries", optionLabel: "name" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "latitude", label: "Latitude", type: "number", step: "0.000001" },
        { key: "longitude", label: "Longitude", type: "number", step: "0.000001" },
        { key: "image", label: "Image URL", type: "text" },
      ],
      fill: function (row) {
        return {
          name: row.name,
          city_name: row.city_name,
          country_id: row.country_id || (row.country && row.country.id) || "",
          description: row.description,
          latitude: row.latitude,
          longitude: row.longitude,
          image: row.image
        };
      },
    },
    hotels: {
      url: "/admin/hotels",
      listLabel: "hotels",
      singular: "hotel",
      sortable: {
        ID: "id", Name: "name", Stars: "stars", "Price / night": "price_per_night",
        Availability: "availability", Destination: "destination_id", Created: "created_at",
      },
      cols: ["ID", "Name", "Stars", "Price / night", "Availability", "Destination", "Created", "Actions"],
      cells: [
        function (row) { return String(row.stars ?? "–"); },
        function (row) { return row.price_per_night == null ? "–" : "$" + Number(row.price_per_night).toLocaleString(); },
        function (row) { return row.availability || "–"; },
        function (row) { return (row.destination && row.destination.name) || row.destination_id || "–"; },
        function (row) { return fmtDate(row.created_at); },
      ],
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "destination_id", label: "Destination", type: "select", optionsUrl: "/admin/destinations", optionLabel: "name", required: true },
        { key: "address", label: "Address", type: "text" },
        { key: "price_per_night", label: "Price / night (USD)", type: "number", step: "0.01" },
        { key: "stars", label: "Stars", type: "number", min: "1", max: "5" },
        { key: "rating", label: "Rating", type: "number", step: "0.1", min: "0", max: "5" },
        { key: "availability", label: "Availability", type: "select", options: [{id: 1, name: "Available"}, {id: 0, name: "Unavailable"}], optionLabel: "name", required: true },
        { key: "image", label: "Image URL", type: "text" },
      ],
      fill: function (row) {
        return {
          name: row.name,
          destination_id: row.destination_id || (row.destination && row.destination.id) || "",
          address: row.address,
          price_per_night: row.price_per_night,
          stars: row.stars,
          rating: row.rating,
          availability: row.availability,
          image: row.image
        };
      },
    },
    restaurants: {
      url: "/admin/restaurants",
      listLabel: "restaurants",
      singular: "restaurant",
      sortable: {
        ID: "id", Name: "name", Cuisine: "cuisine", "Price range": "price_range",
        Rating: "rating", Destination: "destination_id", Created: "created_at",
      },
      cols: ["ID", "Name", "Cuisine", "Price range", "Rating", "Destination", "Created", "Actions"],
      cells: [
        function (row) { return row.cuisine || "–"; },
        function (row) { return row.price_range || "–"; },
        function (row) { return row.rating == null ? "–" : Number(row.rating).toFixed(1); },
        function (row) { return (row.destination && row.destination.name) || row.destination_id || "–"; },
        function (row) { return fmtDate(row.created_at); },
      ],
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "destination_id", label: "Destination", type: "select", optionsUrl: "/admin/destinations", optionLabel: "name", required: true },
        { key: "cuisine", label: "Cuisine", type: "text" },
        { key: "price_range", label: "Price range", type: "text" },
        { key: "rating", label: "Rating", type: "number", step: "0.1", min: "0", max: "5" },
        { key: "address", label: "Address", type: "text" },
        { key: "image", label: "Image URL", type: "text" },
      ],
      fill: function (row) {
        return {
          name: row.name,
          destination_id: row.destination_id || (row.destination && row.destination.id) || "",
          cuisine: row.cuisine,
          price_range: row.price_range,
          rating: row.rating,
          address: row.address,
          image: row.image
        };
      },
    },
    countries: {
      url: "/admin/countries",
      listLabel: "countries",
      singular: "country",
      sortable: { ID: "id", Name: "name", ISO: "iso_code", Capital: "capital", Currency: "currency" },
      cols: ["ID", "Name", "ISO", "Capital", "Currency", "Actions"],
      cells: [
        function (row) { return row.iso_code || "–"; },
        function (row) { return row.capital || "–"; },
        function (row) { return row.currency || "–"; },
      ],
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "iso_code", label: "ISO code", type: "text" },
        { key: "capital", label: "Capital", type: "text" },
        { key: "currency", label: "Currency", type: "text" },
        { key: "languages", label: "Languages (comma separated)", type: "text" },
        { key: "flag_url", label: "Flag URL", type: "text" },
      ],
      serialize: function (payload, fields, get) {
        const v = get("languages");
        payload.languages = v ? v.split(",").map(function (s) { return s.trim(); }).filter(Boolean) : [];
        return payload;
      },
      fill: function (row) {
        return { languages: Array.isArray(row.languages) ? row.languages.join(", ") : row.languages || "" };
      },
    },
    attractions: {
      url: "/admin/attractions",
      listLabel: "attractions",
      singular: "attraction",
      sortable: { ID: "id", Name: "name", Destination: "destination_id", Category: "category_id" },
      cols: ["ID", "Name", "Destination", "Category", "Actions"],
      cells: [
        function (row) { return (row.destination && row.destination.name) || row.destination_id || "–"; },
        function (row) { return (row.category && row.category.name) || row.category_id || "–"; },
      ],
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "destination_id", label: "Destination", type: "select", optionsUrl: "/admin/destinations", optionLabel: "name", required: true },
        { key: "category_id", label: "Category", type: "select", optionsUrl: "/admin/categories", optionLabel: "name" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "latitude", label: "Latitude", type: "number", step: "0.000001" },
        { key: "longitude", label: "Longitude", type: "number", step: "0.000001" },
        { key: "image", label: "Image URL", type: "text" },
      ],
    },
    users: {
      url: "/admin/users",
      listLabel: "users",
      singular: "user",
      sortable: { ID: "id", Name: "name", Email: "email", Status: "is_active", Created: "created_at" },
      cols: ["ID", "Name", "Email", "Role", "Status", "Created", "Actions"],
      cells: [
        function (row) { return row.email || "–"; },
        function (row) {
          const r = (row.roles && row.roles[0] && row.roles[0].name) || row.role || "user";
          const isAdm = r.includes("admin");
          return '<span class="badge ' + (isAdm ? 'badge-warn' : 'badge-off') + '">' + esc(r.replace('_', ' ')) + '</span>';
        },
        function (row) {
          return '<span class="badge ' + (row.is_active ? 'badge-ok' : 'badge-danger') + '">' + (row.is_active ? 'Active' : 'Blocked') + '</span>';
        },
        function (row) { return fmtDate(row.created_at); },
      ],
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "email", label: "Email", type: "email", required: true },
        { key: "password", label: "Password (leave blank to keep current)", type: "password" },
        { key: "role", label: "Role & Privileges", type: "select", options: [{id: "admin", name: "Sub-Admin / Manager"}, {id: "super_admin", name: "Super Admin"}, {id: "agency", name: "Agency Partner"}, {id: "user", name: "Customer Passenger"}], optionLabel: "name" },
        { key: "is_active", label: "Status", type: "select", options: [{id: 1, name: "Active"}, {id: 0, name: "Blocked"}], optionLabel: "name" },
      ],
      fill: function (row) {
        var r = (row.roles && row.roles[0] && row.roles[0].name) || row.role || "user";
        return { name: row.name, email: row.email, role: r, is_active: row.is_active };
      },
    },
    trips: {
      url: "/admin/trips",
      listLabel: "trips",
      singular: "trip",
      sortable: { ID: "id", Title: "title", Budget: "budget", Status: "status", Start: "start_date" },
      cols: ["ID", "Title", "Budget", "Status", "Dates", "Actions"],
      cells: [
        function (row) { return row.budget == null ? "–" : "$" + Number(row.budget).toLocaleString(); },
        function (row) {
          const s = String(row.status || "planned").toLowerCase();
          const cls = (s === "active" || s === "completed") ? "badge-ok" : (s === "cancelled" ? "badge-danger" : "badge-warn");
          return '<span class="badge ' + cls + '">' + esc(row.status || "Planned") + '</span>';
        },
        function (row) { return (row.start_date ? row.start_date.split('T')[0] : "–") + (row.end_date ? " → " + row.end_date.split('T')[0] : ""); },
      ],
      fields: [
        { key: "title", label: "Title", type: "text", required: true },
        { key: "budget", label: "Budget", type: "number", step: "0.01", required: true },
        { key: "status", label: "Status", type: "select", options: [{id: "planned", name: "Planned"}, {id: "active", name: "Active"}, {id: "completed", name: "Completed"}, {id: "cancelled", name: "Cancelled"}], optionLabel: "name" },
        { key: "start_date", label: "Start Date", type: "text" },
        { key: "end_date", label: "End Date", type: "text" },
      ],
    },
    reviews: {
      url: "/admin/reviews",
      listLabel: "reviews",
      singular: "review",
      sortable: { ID: "id", Rating: "rating", Status: "status", Created: "created_at" },
      cols: ["ID", "Target", "Rating", "Review", "Status", "Created", "Actions"],
      cells: [
        function (row) {
          const target = (row.reviewable && (row.reviewable.name || row.reviewable.title)) || (row.reviewable_type ? row.reviewable_type.split('\\').pop() : "–");
          return esc(target);
        },
        function (row) { return '<span class="rating-stars" style="color: #f59e0b; font-weight: 600;">★ ' + (row.rating || 5) + '</span>'; },
        function (row) { return '<span class="review-text-truncate" title="' + esc(row.comment || "") + '">' + esc((row.comment || "–").slice(0, 50)) + '</span>'; },
        function (row) {
          const s = String(row.status || "pending").toLowerCase();
          const cls = s === "approved" ? "badge-ok" : (s === "rejected" ? "badge-danger" : "badge-warn");
          return '<span class="badge ' + cls + '">' + esc(row.status || "Pending") + '</span>';
        },
        function (row) { return fmtDate(row.created_at); },
      ],
      fields: [
        { key: "status", label: "Status", type: "select", options: [{id: "pending", name: "Pending"}, {id: "approved", name: "Approved"}, {id: "rejected", name: "Rejected"}], optionLabel: "name" },
      ],
    },
    flights: {
      url: "/admin/flights",
      listLabel: "flights",
      singular: "flight",
      sortable: { ID: "id", Airline: "airline", Number: "flight_number", Origin: "departure_airport", Destination: "arrival_airport", Price: "price", Created: "created_at" },
      cols: ["ID", "Airline", "Flight #", "Route", "Departure", "Price", "Actions"],
      cells: [
        function (row) { return row.airline || "–"; },
        function (row) { return '<span class="badge badge-warn">' + esc(row.flight_number || "–") + '</span>'; },
        function (row) { return esc(row.departure_airport || "–") + " → " + esc(row.arrival_airport || "–"); },
        function (row) { return row.departure_date ? row.departure_date.split('T')[0] : "–"; },
        function (row) { return row.price == null ? "–" : "$" + Number(row.price).toLocaleString(); },
      ],
      fields: [
        { key: "airline", label: "Airline", type: "text", required: true },
        { key: "flight_number", label: "Flight Number", type: "text", required: true },
        { key: "departure_airport", label: "Origin Airport (e.g. CAI)", type: "text", required: true },
        { key: "arrival_airport", label: "Destination Airport (e.g. DXB)", type: "text", required: true },
        { key: "departure_date", label: "Departure Date/Time", type: "text", required: true },
        { key: "arrival_date", label: "Arrival Date/Time", type: "text" },
        { key: "price", label: "Price (USD)", type: "number", step: "0.01" },
        { key: "booking_status", label: "Status", type: "select", options: [{id: "confirmed", name: "Confirmed"}, {id: "pending", name: "Pending"}, {id: "cancelled", name: "Cancelled"}], optionLabel: "name" },
      ],
    },
  };

  const PER_PAGE_DEFAULT = 25;
  const PAGE_SIZE_OPTIONS = [15, 25, 50, 100];
  const state = { search: "", page: 1, sort: null, dir: "asc", rows: [], serverPaged: false, total: 0, pageSize: storedPageSize() || PER_PAGE_DEFAULT, density: "normal", hidden: {}, selected: {} };
  let searchTimer = null;

  function el(id) { return document.getElementById(id); }

  function module() { return MODULES[document.body.dataset.module]; }

    function fmtDate(v) {
    if (!v) return "–";
    const d = new Date(v);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString();
  }

  function badge(text) {
    const b = document.createElement("span");
    b.className = "badge badge-off";
    b.textContent = String(text ?? "–").toUpperCase();
    return b;
  }

  /* ---------- toasts ---------- */

  function toast(message, kind, opts) {
    if (It.feedback && It.feedback.toast) It.feedback.toast(message, kind || "is-info", opts);
  }

  /* ---------- option fetch ---------- */

  const optionCache = {};
  function fetchOptions(field) {
    if (!field.optionsUrl) return Promise.resolve([]);
    if (optionCache[field.optionsUrl]) return Promise.resolve(optionCache[field.optionsUrl]);
    return It.apiGet(field.optionsUrl, { auth: true }).then(function (res) {
      const data = res.body ? (res.body.data && res.body.data.data) || res.body.data : res.body;
      const list = Array.isArray(data) ? data : [];
      optionCache[field.optionsUrl] = list;
      return list;
    });
  }

  function storedPageSize() {
    try { return Number(localStorage.getItem("admin-crud:page-size")) || 0; } catch (e) { return 0; }
  }

  function buildPageSelect() {
    const size = document.createElement("select");
    size.className = "ctl-select";
    size.setAttribute("aria-label", "Rows per page");
    PAGE_SIZE_OPTIONS.forEach(function (n) {
      const o = document.createElement("option");
      o.value = String(n);
      o.textContent = n + " rows / page";
      size.appendChild(o);
    });
    size.value = String(state.pageSize);
    size.addEventListener("change", function () {
      const n = Number(size.value);
      state.pageSize = n;
      try { localStorage.setItem("admin-crud:page-size", String(n)); } catch (e) {}
      setPage(1);
    });
    return size;
  }

  /* ---------- datatable ---------- */

  function normalize(res) {
    const body = res.body || {};
    const hasLaravelPage = body.data && Array.isArray(body.data) && (body.links || body.meta);
    if (hasLaravelPage) {
      return { rows: body.data, serverPaged: true, meta: body.meta || null };
    }
    const wrapped = body.data && Array.isArray(body.data.data);
    const rows = wrapped ? body.data.data : (Array.isArray(body.data) ? body.data : (Array.isArray(body) ? body : []));
    return { rows: rows, serverPaged: !!(wrapped && body.data.links), meta: (wrapped && body.data.meta) || null };
  }

  function queryString() {
    const q = [];
    q.push("page=" + state.page, "per_page=" + state.pageSize);
    if (state.search) q.push("search=" + encodeURIComponent(state.search));
    if (state.sort) q.push("sort_by=" + encodeURIComponent(state.sort), "sort_order=" + state.dir);
    return "?" + q.join("&");
  }

  function matches(row) {
    const s = String(state.search || "").toLowerCase();
    if (!s) return true;
    for (const k in row) {
      const v = row[k];
      if (v === null || v === undefined) continue;
      if (typeof v === "object") continue;
      if (String(v).toLowerCase().indexOf(s) !== -1) return true;
    }
    return false;
  }

  function compare(a, b) {
    const key = state.sort;
    const av = a[key], bv = b[key];
    const an = (typeof av === "number") && (typeof bv === "number");
    let cmp;
    if (an) cmp = av - bv;
    else cmp = String(av ?? "").localeCompare(String(bv ?? ""));
    return state.dir === "desc" ? -cmp : cmp;
  }

  function tableHost() {
    const key = (document.body.dataset.module || "") + "-table";
    return el(key) || el("crud-table");
  }

  function load() {
    const mod = module();
    const host = tableHost();
    if (host) {
      host.textContent = "";
      host.innerHTML = '<div class="kit-grid-skeleton"><div class="box skeleton"></div><div class="box skeleton"></div><div class="box skeleton"></div></div>';
    }
    It.apiGet(mod.url + queryString(), { auth: true }).then(function (res) {
      if (!res.ok || !res.body) {
        host.textContent = "";
        It.feedback.banner("Could not load " + mod.listLabel + ".", "is-error");
        return;
      }
      const norm = normalize(res);
      state.serverPaged = norm.serverPaged;
      state.rows = norm.rows;
      state.total = state.serverPaged && norm.meta ? Number(norm.meta.total || 0) : state.rows.length;
      renderTable();
    });
  }

  function setPage(p) {
    if (p < 1) return;
    state.page = p;
    load();
  }

  function setSearch(value) {
    state.search = String(value || "").trim();
    state.page = 1;
    if (searchTimer) global.clearTimeout(searchTimer);
    searchTimer = global.setTimeout(function () {
      const mod = module();
      if (state.search) toast("Filtering " + mod.listLabel + "…", "info");
      load();
    }, 240);
  }

  function cycleSort(thIndex, label) {
    const key = module().sortable ? module().sortable[label] : null;
    if (!key) return;
    if (state.sort === key && state.dir === "asc") state.dir = "desc";
    else if (state.sort === key && state.dir === "desc") { state.sort = null; state.dir = "asc"; }
    else { state.sort = key; state.dir = "asc"; }
    state.page = 1;
    load();
  }

  /* ---------- render ---------- */

  function sortHeader(h, label) {
    const key = module().sortable ? module().sortable[label] : null;
    if (!key) {
      h.textContent = label;
      return;
    }
    h.classList.add("sortable");
    if (state.sort === key) h.classList.add(state.dir === "asc" ? "sort-asc" : "sort-desc");
    if (state.sort === key) h.setAttribute("aria-sort", state.dir === "asc" ? "ascending" : "descending");
    else h.removeAttribute("aria-sort");
    h.textContent = label;
    const tip = document.createElement("span");
    tip.className = "th-sort";
    tip.innerHTML =
      '<svg class="arrow-up" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="m18 15-6-6-6 6"/></svg>' +
      '<svg class="arrow-down" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>';
    h.appendChild(tip);
    h.addEventListener("click", function () { cycleSort(h, label); });
  }

  function isColHidden(label) {
    return !!state.hidden[label];
  }

  function renderControls(host) {
    const bar = document.createElement("div");
    bar.className = "table-toolbar";

    const colsBtn = document.createElement("button");
    colsBtn.type = "button";
    colsBtn.className = "btn-ghost btn-sm table-ctl";
    colsBtn.textContent = "Columns";
    colsBtn.setAttribute("aria-expanded", "false");
    bar.appendChild(colsBtn);

    const pop = document.createElement("div");
    pop.className = "cols-pop";
    pop.hidden = true;
    module().cols.forEach(function (label) {
      if (label === "Actions") return;
      const lab = document.createElement("label");
      lab.className = "cols-opt";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = !isColHidden(label);
      cb.addEventListener("change", function () {
        if (!cb.checked) state.hidden[label] = true; else delete state.hidden[label];
        renderTable();
      });
      lab.appendChild(cb);
      lab.appendChild(document.createTextNode(label));
      pop.appendChild(lab);
    });
    bar.appendChild(pop);
    colsBtn.addEventListener("click", function () {
      pop.hidden = !pop.hidden;
      colsBtn.setAttribute("aria-expanded", String(!pop.hidden));
    });
    document.addEventListener("click", function (e) {
      if (pop.hidden) return;
      if (e.target.closest && !e.target.closest(".cols-pop") && e.target !== colsBtn && !colsBtn.contains(e.target)) pop.hidden = true;
    });

    const dense = document.createElement("select");
    dense.className = "ctl-select";
    dense.setAttribute("aria-label", "Row density");
    [["normal", "Density: normal"], ["compact", "Density: compact"]].forEach(function (pair) {
      const o = document.createElement("option");
      o.value = pair[0];
      o.textContent = pair[1];
      dense.appendChild(o);
    });
    dense.value = state.density;
    dense.addEventListener("change", function () {
      state.density = dense.value;
      renderTable();
    });
    bar.appendChild(dense);

    const size = buildPageSelect();
    bar.appendChild(size);

    host.appendChild(bar);
  }

  function renderTable(rowsOverride) {
    const host = tableHost();
    if (!host) return;
    host.textContent = "";

    const filtered = state.rows.filter(matches);
    if (state.sort) filtered.sort(compare);
    const total = state.serverPaged ? state.total : filtered.length;
    const pageRows = state.serverPaged ? filtered : filtered.slice((state.page - 1) * state.pageSize, state.page * state.pageSize);

    if (!pageRows.length) {
      renderEmpty(host);
      return;
    }

    renderControls(host);

    const scroll = document.createElement("div");
    scroll.className = "table-scroll";

    const table = document.createElement("table");
    table.className = "kit-table" + (state.density === "compact" ? " density-compact" : "");
    const thead = document.createElement("thead");
    const htr = document.createElement("tr");

    const selTh = document.createElement("th");
    selTh.className = "td-select";
    const selAll = document.createElement("input");
    selAll.type = "checkbox";
    selAll.setAttribute("aria-label", "Select all rows");
    const selectedOnPage = pageRows.filter(function (r) { return state.selected[r.id]; }).length;
    selAll.checked = pageRows.length > 0 && selectedOnPage === pageRows.length;
    selAll.indeterminate = selectedOnPage > 0 && selectedOnPage < pageRows.length;
    selAll.addEventListener("change", function () {
      pageRows.forEach(function (r) {
        if (selAll.checked) state.selected[r.id] = true;
        else delete state.selected[r.id];
      });
      renderBulk();
      syncRowChecked();
    });
    selTh.appendChild(selAll);
    htr.appendChild(selTh);

    module().cols.forEach(function (label, i) {
      if (isColHidden(label)) return;
      const th = document.createElement("th");
      sortHeader(th, label, i);
      htr.appendChild(th);
    });
    thead.appendChild(htr);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    pageRows.forEach(function (row) {
      tbody.appendChild(renderTr(row));
    });
    table.appendChild(tbody);
    scroll.appendChild(table);
    host.appendChild(scroll);

    renderBulk(host);
    renderPagination(host, total);
  }

  function renderTr(row) {
    const mod = module();
    const moduleName = mod.id || document.body.dataset.module || "";
    const tr = document.createElement("tr");
    tr.dataset.rowId = String(row.id);
    const td = function (content, label) {
      const c = document.createElement("td");
      if (label) c.dataset.label = label;
      if (typeof content === "string" && (content.indexOf("<") !== -1 || content.indexOf("&") !== -1)) {
        c.innerHTML = content;
      } else {
        const node = typeof content === "string" ? document.createTextNode(content)
          : (content instanceof Node ? content : document.createTextNode(String(content)));
        c.appendChild(node);
      }
      return c;
    };
    const sel = document.createElement("td");
    sel.className = "td-select";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.setAttribute("aria-label", "Select " + (row.name || ("row " + row.id)));
    sel.appendChild(cb);
    tr.appendChild(sel);
    if (state.selected[row.id]) { tr.classList.add("is-selected"); cb.checked = true; }
    cb.addEventListener("change", function () {
      if (cb.checked) state.selected[row.id] = true;
      else delete state.selected[row.id];
      tr.classList.toggle("is-selected", cb.checked);
      renderBulk();
      syncSelectAll();
    });
      if (!isColHidden("ID")) tr.appendChild(td(String(row.id), "ID"));
      
      if (!isColHidden("Name")) {
        const nameCell = document.createElement("td");
        nameCell.dataset.label = "Name";
        if (moduleName === "users") {
          const a = document.createElement("a");
          a.href = "user-details.html?id=" + row.id;
          a.textContent = row.name || "–";
          a.style.textDecoration = "underline";
          a.style.color = "hsl(var(--primary))";
          nameCell.appendChild(a);
        } else {
          nameCell.textContent = row.name || "–";
        }
        tr.appendChild(nameCell);
      }
      
      mod.cols.slice(2, -1).forEach(function (label, i) {
      if (isColHidden(label)) return;
      tr.appendChild(td(mod.cells[i](row), label));
    });

    const cell = document.createElement("td");
    cell.className = "td-actions";
    cell.dataset.label = "Actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn-icon btn-ghost btn-sm";
    editBtn.title = "Edit " + mod.singular;
    editBtn.setAttribute("aria-label", "Edit " + mod.singular);
    editBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>';
    editBtn.addEventListener("click", function () { openEdit(row); });

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn-icon btn-ghost btn-sm is-danger-text";
    delBtn.title = "Delete " + mod.singular;
    delBtn.setAttribute("aria-label", "Delete " + mod.singular);
    delBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';
    delBtn.addEventListener("click", function () { removeRow(row.id); });

    if (moduleName === "users") {
      const viewBtn = document.createElement("a");
      viewBtn.href = "user-details.html?id=" + row.id;
      viewBtn.className = "btn-icon btn-ghost btn-sm";
      viewBtn.title = "View Passenger Profile";
      viewBtn.setAttribute("aria-label", "View Passenger Profile");
      viewBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
      cell.appendChild(viewBtn);
    }

    cell.appendChild(editBtn);
    cell.appendChild(delBtn);
    tr.appendChild(cell);
    return tr;
  }

  function selectedCount() {
    return Object.keys(state.selected).length;
  }

  function syncRowChecked() {
    document.querySelectorAll('.kit-table tbody tr').forEach(function (tr) {
      const cb = tr.querySelector('input[type=checkbox]');
      const id = Number(tr.dataset.rowId);
      if (cb && id) { cb.checked = !!state.selected[id]; tr.classList.toggle("is-selected", cb.checked); }
    });
  }

  function syncSelectAll() {
    const selAll = document.querySelector('.kit-table thead .td-select input');
    if (!selAll) return;
    const rows = document.querySelectorAll('.kit-table tbody tr');
    const cbs = document.querySelectorAll('.kit-table tbody input[type=checkbox]');
    const pageCount = rows.length;
    let onPage = 0;
    cbs.forEach(function (cb) { if (cb.checked) onPage++; });
    selAll.checked = pageCount > 0 && onPage === pageCount;
    selAll.indeterminate = onPage > 0 && onPage < pageCount;
  }

  function renderBulk(host) {
    const hostEl = host || tableHost();
    const existing = document.querySelector(".bulk-bar");
    if (existing) existing.remove();
    if (selectedCount() === 0) return;
    const bar = document.createElement("div");
    bar.className = "bulk-bar";
    const label = document.createElement("span");
    label.className = "bulk-label";
    label.textContent = selectedCount() + " selected";
    bar.appendChild(label);
    const exportBtn = document.createElement("button");
    exportBtn.type = "button";
    exportBtn.className = "btn-ghost btn-sm";
    exportBtn.textContent = "Export CSV";
    exportBtn.addEventListener("click", exportCsv);
    bar.appendChild(exportBtn);
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn-ghost btn-sm is-danger-text";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", bulkDelete);
    bar.appendChild(delBtn);
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "bulk-close";
    closeBtn.setAttribute("aria-label", "Clear selection");
    closeBtn.addEventListener("click", function () {
      state.selected = {};
      renderTable();
      syncSelectAll();
    });
    bar.appendChild(closeBtn);
    hostEl.appendChild(bar);
  }

  function bulkDelete() {
    const mod = module();
    const ids = Object.keys(state.selected).map(Number);
    if (!ids.length) return;
    if (!global.confirm("Delete " + ids.length + " selected " + mod.listLabel + "?")) return;
    const removed = state.rows.filter(function (r) { return state.selected[r.id]; });
    Promise.all(ids.map(function (id) {
      return It.apiDelete(mod.url + "/" + id, { auth: true }).then(function () { return id; }, function () { return id; });
    })).then(function () {
      state.selected = {};
      It.feedback.banner(ids.length + " deleted.", "is-ok");
      toast(ids.length + " " + mod.listLabel + " deleted.", "ok", { action: undoAction(mod, removed) });
      state.page = 1;
      load();
    });
  }

  function undoAction(mod, rows) {
    if (!rows || !rows.length) return null;
    return {
      label: "Undo",
      onClick: function () {
        Promise.all(rows.map(function (row) {
          return It.apiPost(mod.url, row, { auth: true });
        })).then(function () {
          It.feedback.banner(rows.length + " restored.", "is-ok");
          toast(rows.length + " " + mod.listLabel + " restored.", "ok");
          load();
        });
      }
    };
  }

  function exportCsv() {
    const mod = module();
    const labels = mod.cols.filter(function (label) {
      return label !== "Actions" && !isColHidden(label);
    });
    const headers = labels;
    const done = function (rows) {
      if (state.sort) rows.sort(compare);
      const csv = [headers.map(csvEsc).join(",")].concat(rows.map(function (row) {
        return labels.map(function (label) {
          if (label === "ID") return String(row.id);
          if (label === "Name") return row.name || "";
          const idx = mod.cols.indexOf(label);
          const cell = mod.cells[idx - 2];
          const val = cell ? cell(row) : "";
          return String(val === "–" ? "" : val).replace(/&[a-z]+;/g, "");
        }).map(csvEsc).join(",");
      })).join("\n");
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = mod.listLabel + "-" + new Date().toISOString().slice(0, 10) + ".csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      toast("Exported " + rows.length + " " + mod.listLabel + " to CSV.", "ok");
    };
    if (!state.serverPaged) {
      done(state.rows.filter(matches));
      return;
    }
    const q = [];
    if (state.search) q.push("search=" + encodeURIComponent(state.search));
    if (state.sort) q.push("sort_by=" + encodeURIComponent(state.sort), "sort_order=" + state.dir);
    const qs = q.length ? "&" + q.join("&") : "";
    const fetchPage = function (page) {
      return It.apiGet(mod.url + "?page=" + page + "&per_page=100" + qs, { auth: true }).then(function (res) {
        const norm = normalize(res);
        const total = norm.meta ? Number(norm.meta.total || 0) : norm.rows.length;
        return { rows: norm.rows, next: page * 100 < total ? page + 1 : null };
      });
    };
    fetchPage(1).then(function walk(r) {
      let acc = [];
      const loop = function (r) {
        acc = acc.concat(r.rows);
        return r.next ? fetchPage(r.next).then(loop) : Promise.resolve(acc);
      };
      return loop(r);
    }).then(function (all) {
      done(all.filter(matches));
    });
  }

  function csvEsc(val) {
    const s = String(val);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  /* ---------- empty ---------- */

  function renderEmpty(host) {
    const div = document.createElement("div");
    div.className = "kit-empty";
    div.innerHTML =
      '<span class="kit-empty-icon">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg></span>' +
      '<p class="kit-empty-title">' + (state.search ? "No matches" : "No " + module().listLabel + " yet.") + "</p>" +
      '<p class="kit-empty-hint">' + (state.search ? "Nothing matched &ldquo;" + esc(state.search) + "&rdquo;. Try a different term or clear the search." : "Create your first one to get going.") + "</p>" +
      (state.search ? "" : '<button type="button" class="btn-ghost" data-empty-new>Add ' + module().singular + "</button>");
    host.appendChild(div);
    const btn = div.querySelector("[data-empty-new]");
    if (btn) btn.addEventListener("click", function () { openModal("new", null, {}); });
  }

  function renderPagination(host, total) {
    const pages = Math.max(1, Math.ceil(total / state.pageSize));
    if (pages <= 1 && !state.serverPaged) return;
    const foot = document.createElement("div");
    foot.className = "kit-pagination";
    const from = total === 0 ? 0 : (state.page - 1) * state.pageSize + 1;
    const to = Math.min(total, state.page * state.pageSize);
    const info = document.createElement("span");
    info.textContent = "Showing " + from + "–" + to + " of " + total + " " + module().listLabel;
    const group = document.createElement("div");
    group.className = "pager-group";
    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "pager-btn";
    prev.textContent = "Prev";
    prev.disabled = state.page <= 1;
    prev.addEventListener("click", function () { setPage(state.page - 1); });

    const numbers = document.createElement("div");
    numbers.className = "pager-numbers";
    numbers.setAttribute("role", "group");
    numbers.setAttribute("aria-label", "Pagination");
    numbers.setAttribute("tabindex", "-1");
    numbers.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return;
      e.preventDefault();
      const btns = Array.from(numbers.querySelectorAll(".pager-btn"));
      const idx = btns.indexOf(document.activeElement);
      let target = -1;
      if (e.key === "ArrowLeft") target = Math.max(0, (idx === -1 ? state.page - 1 : idx) - 1);
      else if (e.key === "ArrowRight") target = Math.min(pages - 1, (idx === -1 ? state.page - 1 : idx) + 1);
      else if (e.key === "Home") target = 0;
      else if (e.key === "End") target = pages - 1;
      const nextBtn = btns[target];
      if (nextBtn && !nextBtn.disabled) nextBtn.focus();
    });
    for (let p = 1; p <= pages; p++) {
      const num = document.createElement("button");
      num.type = "button";
      num.className = "pager-btn" + (p === state.page ? " is-current" : "");
      num.textContent = String(p);
      num.setAttribute("aria-label", "Page " + p);
      if (p === state.page) num.setAttribute("aria-current", "page");
      num.setAttribute("aria-pressed", String(p === state.page));
      num.addEventListener("click", function () { setPage(p); });
      numbers.appendChild(num);
    }

    const next = document.createElement("button");
    next.type = "button";
    next.className = "pager-btn";
    next.textContent = "Next";
    next.disabled = state.page >= pages;
    next.addEventListener("click", function () { setPage(state.page + 1); });
    group.appendChild(prev);
    group.appendChild(numbers);
    group.appendChild(next);
    foot.appendChild(info);
    foot.appendChild(buildPageSelect());
    foot.appendChild(group);
    host.appendChild(foot);
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ---------- modal / form ---------- */

  function fieldInput(field, value, extra) {
    const desc = (extra && extra.desc) || "";
    if (field.type === "select") {
      const opts = (extra && extra.options) || [];
      const sel = opts.map(function (o) {
        const id = o.id;
        const label = o[field.optionLabel] || String(id);
        return '<option value="' + id + '"' + (String(value) === String(id) ? " selected" : "") + ">" + esc(label) + "</option>";
      }).join("");
      const selectedObj = opts.find(function(o) { return String(o.id) === String(value); });
      const initialText = selectedObj ? (selectedObj[field.optionLabel] || String(selectedObj.id)) : "";

      return '<div class="searchable-select-wrap" data-select-for="f-' + field.key + '">' +
        '<input type="text" class="ctl-search-input" id="search-f-' + field.key + '" placeholder="🔍 Search ' + esc(field.label) + '..." value="' + esc(initialText) + '" autocomplete="off" />' +
        '<select id="f-' + field.key + '" name="' + field.key + '"' + desc + '><option value="">— Select ' + esc(field.label) + ' —</option>' + sel + "</select>" +
        '</div>';
    }
    if (field.type === "textarea") {
      return '<textarea id="f-' + field.key + '" name="' + field.key + '" rows="3"' + desc + "></textarea>";
    }
    const attrs = [];
    if (field.step) attrs.push('step="' + field.step + '"');
    if (field.min) attrs.push('min="' + field.min + '"');
    if (field.max) attrs.push('max="' + field.max + '"');
    return '<input id="f-' + field.key + '" name="' + field.key + '" type="' + (field.type || "text") + '"' + (desc ? " " + desc : "") + " " + attrs.join(" ") + " />";
  }

  function openModal(mode, row, selectOptions) {
    const root = el("modal-root");
    root.textContent = "";
    const mod = module();
    const wrap = document.createElement("div");
    wrap.className = "kit-modal-backdrop";
    wrap.id = "crud-modal";
    const title = (mode === "edit" ? "Edit " : "New ") + mod.singular;

    const fieldsHtml = mod.fields.map(function (f) {
      let value = "";
      if (row) {
        const fillVals = mod.fill ? mod.fill(row) : {};
        value = (fillVals[f.key] !== undefined ? fillVals[f.key] : row[f.key]) ?? "";
      }
      const req = f.required ? ' <span class="field-hint">· required</span>' : "";
      const desc = f.required ? ' aria-describedby="fe-' + f.key + '"' : "";
      const opts = (selectOptions && selectOptions[f.key]) || undefined;
      return '<div class="kit-field" data-field="' + f.key + '"><label for="f-' + f.key + '">' + f.label + req + "</label>" +
        fieldInput(f, value, { options: opts, desc: desc }) +
        '<p class="field-error" id="fe-' + f.key + '" role="alert" hidden></p></div>';
    }).join("");

    wrap.innerHTML =
      '<div class="kit-modal kit-modal is-medium" role="dialog" aria-modal="true" aria-labelledby="crud-modal-title" aria-describedby="crud-modal-desc">' +
      '<div class="kit-modal-head">' +
      '<div style="display:flex;align-items:center;gap:0.75rem;">' +
      '<span class="kit-modal-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></span>' +
      '<div><h3 id="crud-modal-title">' + title + '</h3>' +
      '<p class="kit-modal-subtitle">' + esc(mod.singular) + ' &middot; ' + (mode === "edit" ? "Edit Record" : "Create Record") + '</p></div>' +
      '</div>' +
      '<button type="button" class="kit-modal-close" data-close aria-label="Close">&times;</button></div>' +
      '<form id="crud-form" class="kit-form" novalidate>' +
      '<div class="kit-modal-body"><p id="crud-modal-desc" class="view-sub">' + title + " " + mod.singular + " record</p>" + fieldsHtml + "</div>" +
      '<div class="kit-modal-foot">' +
      '<button type="button" class="btn-ghost" data-close>Cancel</button>' +
      '<button type="submit" class="btn-primary is-danger">Save</button>' +
      "</div></form></div>";
    root.appendChild(wrap);

    if (row) {
      mod.fields.forEach(function (f) {
        const node = wrap.querySelector("#f-" + f.key);
        if (!node) return;
        let value = row[f.key];
        if (mod.fill) {
          const fillVals = mod.fill(row);
          if (fillVals[f.key] !== undefined) value = fillVals[f.key];
        }
        if (value !== null && value !== undefined) node.value = value;
      });
    }

    /* Interactive Dynamic Country Dropdown Auto-Selection */
    const cityInput = wrap.querySelector("#f-city_name") || wrap.querySelector("#f-city");
    const countrySelect = wrap.querySelector("#f-country_id");

    if (cityInput && countrySelect) {
      const CITY_COUNTRY_MAP = {
        cairo: ["egypt", "eg"],
        alexandria: ["egypt", "eg"],
        giza: ["egypt", "eg"],
        luxor: ["egypt", "eg"],
        aswan: ["egypt", "eg"],
        "sharm el sheikh": ["egypt", "eg"],
        hurghada: ["egypt", "eg"],
        dubai: ["united arab emirates", "uae", "ae", "emirates"],
        "abu dhabi": ["united arab emirates", "uae", "ae", "emirates"],
        sharjah: ["united arab emirates", "uae", "ae", "emirates"],
        ajman: ["united arab emirates", "uae", "ae", "emirates"],
        "ras al khaimah": ["united arab emirates", "uae", "ae", "emirates"],
        fujairah: ["united arab emirates", "uae", "ae", "emirates"],
        "umm al quwain": ["united arab emirates", "uae", "ae", "emirates"],
        emirates: ["united arab emirates", "uae", "ae", "emirates"],
        uae: ["united arab emirates", "uae", "ae", "emirates"],
        "united arab emirates": ["united arab emirates", "uae", "ae", "emirates"],
        london: ["united kingdom", "uk", "gb"],
        manchester: ["united kingdom", "uk", "gb"],
        edinburgh: ["united kingdom", "uk", "gb"],
        paris: ["france", "fr"],
        nice: ["france", "fr"],
        lyon: ["france", "fr"],
        tokyo: ["japan", "jp"],
        kyoto: ["japan", "jp"],
        osaka: ["japan", "jp"],
        rome: ["italy", "it"],
        milan: ["italy", "it"],
        venice: ["italy", "it"],
        "new york": ["united states", "usa", "us"],
        "los angeles": ["united states", "usa", "us"],
        chicago: ["united states", "usa", "us"],
        miami: ["united states", "usa", "us"],
        "san francisco": ["united states", "usa", "us"],
        "las vegas": ["united states", "usa", "us"],
        sydney: ["australia", "au"],
        melbourne: ["australia", "au"],
        toronto: ["canada", "ca"],
        vancouver: ["canada", "ca"],
        berlin: ["germany", "de"],
        munich: ["germany", "de"],
        frankfurt: ["germany", "de"],
        madrid: ["spain", "es"],
        barcelona: ["spain", "es"],
        istanbul: ["turkey", "tr"],
        antalya: ["turkey", "tr"],
        bangkok: ["thailand", "th"],
        phuket: ["thailand", "th"],
        riyadh: ["saudi arabia", "sa"],
        jeddah: ["saudi arabia", "sa"],
        doha: ["qatar", "qa"]
      };

      const autoSelectCountry = function() {
        const val = String(cityInput.value || "").trim().toLowerCase();
        if (!val) return;

        let targetCountryTerms = CITY_COUNTRY_MAP[val];

        if (!targetCountryTerms) {
          for (const cName in CITY_COUNTRY_MAP) {
            if (val.indexOf(cName) !== -1 || cName.indexOf(val) !== -1) {
              targetCountryTerms = CITY_COUNTRY_MAP[cName];
              break;
            }
          }
        }

        const options = Array.from(countrySelect.options);
        let matchedOption = null;

        if (targetCountryTerms) {
          matchedOption = options.find(function(opt) {
            const text = opt.text.toLowerCase();
            return targetCountryTerms.some(function(term) { return text.indexOf(term) !== -1; });
          });
        }

        if (!matchedOption) {
          matchedOption = options.find(function(opt) {
            return opt.text.toLowerCase().indexOf(val) !== -1;
          });
        }

        if (matchedOption && countrySelect.value !== matchedOption.value) {
          countrySelect.value = matchedOption.value;
          countrySelect.dispatchEvent(new Event("change"));

          countrySelect.style.transition = "all 0.3s ease";
          countrySelect.style.borderColor = "#f59e0b";
          countrySelect.style.boxShadow = "0 0 0 4px rgba(245, 158, 11, 0.35)";
          setTimeout(function() {
            countrySelect.style.borderColor = "";
            countrySelect.style.boxShadow = "";
          }, 1200);

          const countrySearchInp = wrap.querySelector("#search-f-country_id");
          if (countrySearchInp) {
            countrySearchInp.value = matchedOption.text;
          }

          toast("Auto-detected Country: " + matchedOption.text, "ok");
        }
      };

      cityInput.addEventListener("input", autoSelectCountry);
      cityInput.addEventListener("blur", autoSelectCountry);
    }

    /* Searchable Select Live Filter */
    wrap.querySelectorAll(".searchable-select-wrap").forEach(function (wrapEl) {
      const searchInp = wrapEl.querySelector(".ctl-search-input");
      const selEl = wrapEl.querySelector("select");
      if (!searchInp || !selEl) return;

      const allOptions = Array.from(selEl.options);

      const filterOptions = function() {
        const query = searchInp.value.trim().toLowerCase();
        selEl.innerHTML = "";

        const matched = allOptions.filter(function (opt) {
          if (!opt.value) return true;
          return opt.text.toLowerCase().indexOf(query) !== -1;
        });

        matched.forEach(function (opt) {
          selEl.appendChild(opt.cloneNode(true));
        });

        if (matched.length === 2 && matched[1].value) {
          selEl.value = matched[1].value;
        }
      };

      searchInp.addEventListener("input", filterOptions);

      selEl.addEventListener("change", function () {
        const opt = selEl.options[selEl.selectedIndex];
        if (opt && opt.value) {
          searchInp.value = opt.text;
        } else {
          searchInp.value = "";
        }
      });
    });

    wrap.querySelectorAll("[data-close]").forEach(function (btn) {
      btn.addEventListener("click", closeModal);
    });
    wrap.addEventListener("click", function (e) { if (e.target === wrap) closeModal(); });

    wrap.querySelector("#crud-form").addEventListener("submit", function (e) {
      e.preventDefault();
      const bad = validate(wrap);
      if (bad) return;
      let payload = {};
      mod.fields.forEach(function (f) {
        const node = wrap.querySelector("#f-" + f.key);
        if (!node) return;
        let val = node.type === "checkbox" ? node.checked : node.value;
        if (typeof val === "string") val = val.trim();

        if (f.key.endsWith("_id") || f.key === "stars" || f.key === "availability" || f.key === "is_active") {
          if (val === "" || val === null || val === undefined) {
            val = null;
          } else if (!isNaN(val)) {
            val = Number(val);
          }
        } else if (f.type === "number") {
          if (val === "" || val === null || val === undefined) {
            val = null;
          } else if (!isNaN(val)) {
            val = Number(val);
          }
        }
        payload[f.key] = val;
      });
      if (mod.serialize) payload = mod.serialize(payload, mod.fields, function (k) {
        const node = wrap.querySelector("#f-" + k);
        return node ? node.value : "";
      });
      const reqv = mode === "edit"
        ? It.apiPut(mod.url + "/" + row.id, payload, { auth: true })
        : It.apiPost(mod.url, payload, { auth: true });
        reqv.then(function (res) {
          if (res.ok) {
            closeModal();
            It.feedback.banner(mode === "edit" ? "Updated." : "Created.", "is-ok");
            toast(mode === "edit" ? mod.singular + " updated." : mod.singular + " created.", "ok");
            load();
          } else if (res.status === 422 && res.body && res.body.error) {
            const errs = res.body.error;
            Object.keys(errs).forEach(function (k) {
              const node = el("f-" + k);
              if (node) {
                const box = node.closest(".kit-field");
                if (box) box.classList.add("has-error");
                node.classList.add("is-error");
                node.setAttribute("aria-invalid", "true");
                const hint = el("fe-" + k);
                if (hint) {
                  hint.textContent = Array.isArray(errs[k]) ? errs[k][0] : errs[k];
                  hint.hidden = false;
                }
              }
            });
            It.feedback.banner("Please correct the errors in the form.", "is-error");
            toast("Validation failed.", "error");
          } else {
            const msg = (res.body && (res.body.message || (res.body.error && res.body.error.message))) || "Save failed.";
            It.feedback.banner(String(msg).slice(0, 180), "is-error");
            toast(String(msg).slice(0, 120), "error");
          }
        });
    });

    wrap.querySelectorAll("#crud-form input, #crud-form select, #crud-form textarea").forEach(function (node) {
      node.addEventListener("input", function () { clearFieldError(node); });
    });

    const opener = document.activeElement;
    const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])';
    const trap = function (e) {
      if (e.key === "Escape") { e.stopPropagation(); closeModal(); return; }
      if (e.key !== "Tab") return;
      const list = Array.from(wrap.querySelectorAll(FOCUSABLE));
      if (!list.length) { e.preventDefault(); return; }
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;
      const inside = wrap.contains(active);
      if (e.shiftKey) {
        if (!inside || active === first) { e.preventDefault(); last.focus(); }
      } else if (!inside || active === last) {
        e.preventDefault(); first.focus();
      }
    };
    wrap.addEventListener("keydown", trap);

    const first = wrap.querySelector("input:not([type=hidden]), select, textarea");
    if (first) first.focus();

    modalCleanup = function () {
      wrap.removeEventListener("keydown", trap);
      if (opener && opener.isConnected) opener.focus();
    };
  }

  let modalCleanup = null;

  function clearFieldError(node) {
    if (!node) return;
    const box = node.closest(".kit-field");
    if (!box) return;
    box.classList.remove("has-error");
    node.classList.remove("is-error");
    const err = box.querySelector(".field-error");
    if (err) err.hidden = true;
    node.removeAttribute("aria-invalid");
  }

  function validate(wrap) {
    const mod = module();
    let firstBad = null;
    mod.fields.forEach(function (f) {
      const box = wrap.querySelector('[data-field="' + f.key + '"]');
      if (!box) return;
      const node = box.querySelector("input, select, textarea");
      const err = box.querySelector(".field-error");
      if (f.required) {
        if (node && !String(node.value).trim()) {
          box.classList.add("has-error");
          node.classList.add("is-error");
          if (err) {
            err.hidden = false;
            err.textContent = f.label + " is required.";
          }
          if (node) node.setAttribute("aria-invalid", "true");
          if (!firstBad) firstBad = node;
        } else {
          clearFieldError(node);
        }
      }
    });
    if (firstBad) {
      firstBad.focus();
      toast("Please fill the highlighted fields.", "error");
      return true;
    }
    return false;
  }

  function closeModal() {
    const root = el("modal-root");
    if (root) root.textContent = "";
    if (modalCleanup) {
      const cleanup = modalCleanup;
      modalCleanup = null;
      cleanup();
    }
  }

  function removeRow(id) {
    const mod = module();
    if (!global.confirm("Delete " + mod.singular + " #" + id + "?")) return;
    const removed = state.rows.filter(function (r) { return Number(r.id) === id; });
    It.apiDelete(mod.url + "/" + id, { auth: true }).then(function (res) {
      if (res.ok) {
        It.feedback.banner("Deleted.", "is-ok");
        toast(mod.singular + " deleted.", "ok", { action: undoAction(mod, removed) });
        load();
      } else {
        It.feedback.banner((res.body && res.body.message) || "Delete failed.", "is-error");
      }
    });
  }

  function openNew() {
    const needed = module().fields.filter(function (f) { return f.optionsUrl; });
    if (!needed.length) { openModal("new", null, {}); return; }
    Promise.all(needed.map(function (f) { return fetchOptions(f).then(function (o) { return [f.key, o]; }); }))
      .then(function (pairs) {
        const map = {};
        pairs.forEach(function (p) { map[p[0]] = p[1]; });
        openModal("new", null, map);
      });
  }

  function openEdit(row) {
    const needed = module().fields.filter(function (f) { return f.optionsUrl; });
    if (!needed.length) { openModal("edit", row, {}); return; }
    Promise.all(needed.map(function (f) { return fetchOptions(f).then(function (o) { return [f.key, o]; }); }))
      .then(function (pairs) {
        const map = {};
        pairs.forEach(function (p) { map[p[0]] = p[1]; });
        openModal("edit", row, map);
      });
  }

    let isBooted = false;
    function boot(user) {
      if (isBooted) return;
      isBooted = true;
      const btnNew = el("btn-new");
      if (btnNew) btnNew.addEventListener("click", openNew);
      document.addEventListener("admin:search", function (e) { setSearch(e.detail); });
      load();
    }

    document.addEventListener("itinera:ready", function(e) {
      boot(e.detail);
    });

    function tryDirectBoot() {
      if (isBooted) return;
      if (global.Itinera && global.Itinera.session && global.Itinera.session.hasToken()) {
        global.Itinera.session.currentUser().then(function (user) {
          if (user) boot(user);
        });
      }
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", tryDirectBoot);
    } else {
      setTimeout(tryDirectBoot, 50);
    }
  })(window);