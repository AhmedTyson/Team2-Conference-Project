/**
 * dashboard.js — user dashboard (user role only).
 * Connects to live database endpoints (/v1/dashboard) and maps tab screens.
 */
(function (global) {
  "use strict";

  const It = global.Itinari;
  const fb = It.feedback;

  const DASH = {
    stats: "/stats/summary",
    trips: "/dashboard/trips",
    favs: "/dashboard/favourites",
    notifs: "/notifications"
  };

  const mockTransactions = [
    { id: "TXN-3291-K", date: "2026-08-08", details: "Return Flights to DPS (x2 passengers)", amount: 580.00 },
    { id: "TXN-8742-L", date: "2026-08-05", details: "Amnaya Resort DPS Check-in (3 nights)", amount: 420.00 },
    { id: "TXN-9125-W", date: "2026-07-28", details: "Transfers & Nusa Penida Excursion Tours", amount: 210.00 }
  ];

  function el(id) { return document.getElementById(id); }

  function setStat(id, value) {
    const card = el(id);
    if (!card) return;
    const v = card.querySelector(".stat-value");
    if (v) v.textContent = value;
    card.classList.remove("skeleton");
  }

  function buildCard(title, meta) {
    const div = document.createElement("div");
    div.className = "feed-item";
    const h = document.createElement("h3");
    h.textContent = title || "Untitled";
    const p = document.createElement("p");
    p.textContent = meta || "";
    div.appendChild(h);
    div.appendChild(p);
    return div;
  }

  function renderTrips(items) {
    return items.map(function (t) {
      return buildCard(
        t.destination_name || t.title || t.destination || "Trip",
        "Status: " + (t.status || "Planned") + (t.start_date ? " · " + t.start_date.split('T')[0] : "")
      );
    });
  }

  function renderFavs(items) {
    return items.map(function (f) {
      const details = f.item || f;
      return buildCard(
        details.name || details.title || details.destination || "Place",
        details.address || details.city || details.category || ""
      );
    });
  }

  function renderNotifications(items) {
    return items.map(function (n) {
      return buildCard(
        n.message || (n.data && n.data.message) || n.title || "Alert",
        n.created_at ? "Received: " + n.created_at.split('T')[0] : "Received: Recent"
      );
    });
  }

  function setFeed(listEl, items, emptyMsg, render) {
    listEl.textContent = "";
    if (!items || !items.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = emptyMsg;
      listEl.appendChild(empty);
      return;
    }
    items.forEach(function (it) { listEl.appendChild(render([it])[0]); });
  }

  // -------------------------------------------------------------
  // Tab Switching
  // -------------------------------------------------------------
  function switchTab(tabId) {
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
    el(`tab-${tabId}`).classList.add("active");

    document.querySelectorAll(".sidebar .nav-link").forEach(link => link.classList.remove("active"));

    const activeLink = Array.from(document.querySelectorAll(".sidebar .nav-link")).find(link => 
        link.textContent.toLowerCase().includes(tabId === "overview" ? "dashboard" : (tabId === "planner" ? "planner" : (tabId === "reports" ? "reports" : "transactions")))
    );
    if (activeLink) activeLink.classList.add("active");

    const pageTitle = el("page-title");
    if (tabId === "overview") {
      pageTitle.textContent = "Dashboard";
    } else if (tabId === "planner") {
      pageTitle.textContent = "Trip Planner";
      switchPlannerSubTab("page-trips");
    } else if (tabId === "transactions") {
      pageTitle.textContent = "Transactions";
      renderTransactionsList();
    } else if (tabId === "reports") {
      pageTitle.textContent = "My Reports";
      renderReportsList();
    }
  }

  global.switchTab = switchTab;

  // -------------------------------------------------------------
  // Transaction Table & Receipt Modal
  // -------------------------------------------------------------
  function renderTransactionsList() {
    const feed = el("transactions-list-feed");
    feed.innerHTML = "";

    mockTransactions.forEach(t => {
      const div = document.createElement("div");
      div.className = "tx-row";
      div.innerHTML = `
        <div class="tx-details">
          <h3>${t.details}</h3>
          <p>Reference ID: #${t.id} · Settled Date: ${t.date}</p>
        </div>
        <div class="tx-right">
          <span class="tx-amount">$${t.amount.toFixed(2)}</span>
          <button type="button" class="btn-ghost" onclick="showReceiptModal('${t.id}')">View Receipt</button>
        </div>
      `;
      feed.appendChild(div);
    });
  }

  function showReceiptModal(txId) {
    const tx = mockTransactions.find(t => t.id === txId);
    if (!tx) return;

    el("rec-id").textContent = "#" + tx.id;
    el("rec-date").textContent = tx.date;
    el("rec-details").textContent = tx.details;
    el("rec-total").textContent = "$" + tx.amount.toFixed(2);

    el("receipt-modal-backdrop").classList.add("is-open");
  }

  global.showReceiptModal = showReceiptMock;
  function showReceiptMock(txId) {
    showReceiptModal(txId);
  }

  function closeReceiptModal() {
    el("receipt-modal-backdrop").classList.remove("is-open");
  }

  global.closeReceiptModal = closeReceiptModal;

  // -------------------------------------------------------------
  // Reports Tab
  // -------------------------------------------------------------
  function renderReportsList() {
    const listEl = el("dashboard-reports-list");
    if (!listEl) return;
    listEl.innerHTML = `<div class="skeleton"></div><div class="skeleton"></div>`;

    It.apiGet('/me/reports', { auth: true })
      .then(function(res) {
        const reports = res.data || res.body?.data || [];
        listEl.innerHTML = "";
        
        if (!reports || reports.length === 0) {
          const empty = document.createElement("div");
          empty.className = "empty";
          empty.textContent = "No reports found. You haven't filed any reports against agencies.";
          listEl.appendChild(empty);
          return;
        }

        reports.forEach(function(report) {
          const agencyName = report.agency ? (report.agency.name || report.agency.company_name || 'Agency') : 'Unknown Agency';
          
          const div = document.createElement("div");
          div.className = "feed-item";
          div.style.display = "flex";
          div.style.flexDirection = "column";
          div.style.gap = "8px";
          
          const h3 = document.createElement("h3");
          h3.textContent = "Report against " + agencyName;
          
          const pMeta = document.createElement("p");
          pMeta.textContent = "Status: " + (report.status || "pending") + " · Reason: " + (report.reason_category || "General");
          pMeta.style.color = "var(--text-muted)";
          
          const pDetails = document.createElement("p");
          pDetails.textContent = report.details || "No additional details provided.";
          pDetails.style.fontSize = "0.9rem";
          
          div.appendChild(h3);
          div.appendChild(pMeta);
          div.appendChild(pDetails);
          listEl.appendChild(div);
        });
      })
      .catch(function(err) {
        fb.banner('Failed to load reports: ' + err.message, 'is-error');
        listEl.innerHTML = '<div class="empty">Could not load reports.</div>';
      });
  }

  // =============================================================
  // TRIP PLANNER FUNCTIONALITY (TAB INJECTION)
  // =============================================================
  let tripsDataList = [];
  let activeTripId = null;

  const catalog = [
    { name: "Amnaya Resort DPS", type: "Hotel", address: "Kuta, Bali", price: 140, x: 50, y: 110 },
    { name: "Ubud Monkey Forest", type: "Attraction", address: "Ubud, Bali", price: 12, x: 90, y: 80 },
    { name: "Nusa Penida Tour", type: "Attraction", address: "Nusa Penida", price: 45, x: 140, y: 130 },
    { name: "Jimbaran Seafood Dinner", type: "Restaurant", address: "Jimbaran Bay", price: 30, x: 60, y: 140 },
    { name: "Private Driver Service", type: "Service", address: "Bali Region", price: 25, x: 100, y: 100 },
    { name: "Swiss Alps Chalet", type: "Hotel", address: "Zermatt, Switzerland", price: 320, x: 70, y: 90 },
    { name: "Mount Batur Sunrise Trek", type: "Attraction", address: "Kintamani, Giza", price: 35, x: 110, y: 60 }
  ];

  function switchPlannerSubTab(subTabId) {
    document.querySelectorAll(".planner-sub-page").forEach(page => page.style.display = "none");
    const target = el(subTabId);
    if (target) target.style.display = "block";

    document.querySelectorAll("#navPills button").forEach(btn => {
      const dataPage = btn.getAttribute("data-page");
      btn.classList.toggle("active", dataPage === subTabId);
    });

    if (subTabId === "page-trips") {
      loadTripsFromDb();
    } else if (subTabId === "page-details") {
      renderActiveTripDetails();
    } else if (subTabId === "page-schedule") {
      renderCalendarSchedule();
    } else if (subTabId === "page-checkout") {
      renderCheckoutInvoice();
    }
  }

  global.switchPlannerSubTab = switchPlannerSubTab;

  function loadTripsFromDb() {
    const grid = el("trip-grid-container");
    if (!grid) return;
    grid.innerHTML = `<div class="skeleton" style="min-height:160px; grid-column:1/-1;"></div>`;

    It.apiGet("/dashboard/trips", { auth: true }).then(function (res) {
      if (res.ok && res.body && res.body.data) {
        tripsDataList = res.body.data;
        
        tripsDataList.forEach(t => {
          const localAtts = localStorage.getItem(`itinari_attachments_${t.id}`);
          t.attachments = localAtts ? JSON.parse(localAtts) : [];
          
          if (t.attachments.length === 0 && t.title.includes("Bali")) {
            t.attachments = [
              { id: "att-1", name: "Amnaya Resort DPS", type: "Hotel", address: "Kuta, Bali", price: 140, x: 50, y: 110 },
              { id: "att-2", name: "Nusa Penida Tour", type: "Attraction", address: "Nusa Penida", price: 45, x: 140, y: 130 }
            ];
            localStorage.setItem(`itinari_attachments_${t.id}`, JSON.stringify(t.attachments));
          }
        });

        if (tripsDataList.length > 0 && !activeTripId) {
          activeTripId = tripsDataList[0].id;
        }

        renderTripsList();
      } else {
        fb.banner("Failed to pull trips.", "is-error");
      }
    }).catch(function (err) {
      fb.banner(err.message || "Failed to reach backend database.", "is-error");
    });
  }

  function renderTripsList() {
    const grid = el("trip-grid-container");
    if (!grid) return;
    grid.innerHTML = "";

    if (tripsDataList.length === 0) {
      grid.innerHTML = `<div class="text-muted" style="grid-column:1/-1;">No trips found in database. Create one!</div>`;
      el("trips-count-meta").innerHTML = `<i class="fas fa-info-circle"></i> 0 trips · last updated today`;
      return;
    }

    tripsDataList.forEach(trip => {
      const card = document.createElement("div");
      card.className = "trip-card";
      card.onclick = () => {
        activeTripId = trip.id;
        switchPlannerSubTab("page-details");
      };

      const startDate = trip.start_date ? trip.start_date.split("T")[0] : "—";
      const endDate = trip.end_date ? trip.end_date.split("T")[0] : "—";
      const travelers = trip.no_of_travelers || 2;

      card.innerHTML = `
        <h3>${trip.title}</h3>
        <div class="meta">
          <span><i class="fas fa-calendar-alt"></i> ${startDate} to ${endDate}</span>
          <span><i class="fas fa-users"></i> ${travelers} travelers</span>
        </div>
        <div class="actions">
          <button type="button"><i class="fas fa-eye"></i> View details</button>
        </div>
      `;
      grid.appendChild(card);
    });

    el("trips-count-meta").innerHTML = `<i class="fas fa-info-circle"></i> ${tripsDataList.length} trips · last updated today`;
  }

  function saveNewTripToDb() {
    const title = el("trip-title-input").value.trim();
    const start = el("trip-start-input").value;
    const end = el("trip-end-input").value;
    const travelers = parseInt(el("trip-travelers-input").value || 1);

    if (!title) {
      alert("Please provide a name for your trip!");
      return;
    }

    const postBody = {
      title: title,
      status: "planned",
      budget: 2500,
      start_date: start,
      end_date: end,
      no_of_travelers: travelers
    };

    fb.banner("Saving trip to database...", "is-info");

    It.apiPost("/trips", postBody, { auth: true }).then(function (res) {
      if (res.ok && res.body && res.body.data) {
        fb.banner("Trip created successfully!", "is-ok");
        activeTripId = res.body.data.id;
        localStorage.setItem(`itinari_attachments_${activeTripId}`, JSON.stringify([]));
        
        loadTripsFromDb();
        switchPlannerSubTab("page-trips");
      } else {
        fb.banner(res.body.message || "Failed to save trip.", "is-error");
      }
    }).catch(function (err) {
      fb.banner(err.message || "Database connection error.", "is-error");
    });
  }

  global.saveNewTripToDb = saveNewTripToDb;

  function renderActiveTripDetails() {
    const trip = tripsDataList.find(t => t.id == activeTripId);
    if (!trip) {
      el("details-trip-title").innerHTML = `<i class="fas fa-map-marked-alt"></i> No Trip Selected`;
      el("timeline-container").innerHTML = `<div class="text-muted">Select a trip from the list first.</div>`;
      return;
    }

    el("details-trip-title").innerHTML = `<i class="fas fa-map-marked-alt"></i> ${trip.title} · Details`;

    const timeline = el("timeline-container");
    timeline.innerHTML = "";

    const attachments = trip.attachments || [];
    if (attachments.length === 0) {
      timeline.innerHTML = `<div class="text-muted">No items attached yet. Check the attachment panel below!</div>`;
    } else {
      attachments.forEach((item, index) => {
        const day = Math.floor(index / 2) + 1;
        const time = index % 2 === 0 ? "09:30" : "14:00";
        const div = document.createElement("div");
        div.className = "timeline-item";
        div.innerHTML = `
          <span>
            <span class="time">${time}</span>
            <span class="desc">${item.name} (${item.type})</span>
          </span>
          <span>Day ${day}</span>
        `;
        timeline.appendChild(div);
      });
    }

    renderMapCanvas(attachments);
    populateAttachModal(trip);
  }

  function renderMapCanvas(attachments) {
    const container = el("map-canvas-container");
    if (!container) return;
    container.innerHTML = "";

    if (attachments.length === 0) {
      container.innerHTML = `<i class="fas fa-map-pin" style="margin-right: 6px;"></i> Map route checkpoints will show here`;
      return;
    }

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("style", "position:absolute; inset:0;");

    if (attachments.length > 1) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      let pathD = `M ${attachments[0].x} ${attachments[0].y}`;
      for (let i = 1; i < attachments.length; i++) {
        pathD += ` L ${attachments[i].x} ${attachments[i].y}`;
      }
      path.setAttribute("d", pathD);
      path.setAttribute("class", "map-path");
      svg.appendChild(path);
    }

    attachments.forEach(item => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", item.x);
      circle.setAttribute("cy", item.y);
      circle.setAttribute("r", 5);
      circle.setAttribute("class", "map-node");

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", item.x);
      text.setAttribute("y", item.y + 14);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("fill", "#1f3a5c");
      text.setAttribute("font-size", "9px");
      text.setAttribute("font-weight", "600");
      text.textContent = item.name.split(" ").slice(0, 2).join(" ");

      svg.appendChild(circle);
      svg.appendChild(text);
    });

    container.appendChild(svg);
  }

  function populateAttachModal(trip) {
    const select = el("modal-item-select");
    if (!select) return;
    select.innerHTML = "";

    catalog.forEach(cat => {
      const alreadyAttached = trip.attachments && trip.attachments.some(att => att.name === cat.name);
      if (!alreadyAttached) {
        const opt = document.createElement("option");
        opt.value = cat.name;
        opt.textContent = `${cat.name} (${cat.type})`;
        select.appendChild(opt);
      }
    });

    if (select.children.length === 0) {
      const opt = document.createElement("option");
      opt.textContent = "All items attached";
      opt.disabled = true;
      select.appendChild(opt);
    }

    renderAttachedList(trip);
  }

  function renderAttachedList(trip) {
    const list = el("attached-items-list");
    if (!list) return;
    list.innerHTML = "";

    const attachments = trip.attachments || [];
    if (attachments.length === 0) {
      list.innerHTML = `<div style="font-size:12px; color:#617e9e; text-align:center; padding:10px;">No items attached.</div>`;
      return;
    }

    attachments.forEach(item => {
      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `
        <span>📌 ${item.name}</span>
        <button type="button" onclick="detachItemFromTrip('${item.id}')"><i class="fas fa-minus-circle"></i> Detach</button>
      `;
      list.appendChild(row);
    });
  }

  function addSelectedItemToTrip() {
    const trip = tripsDataList.find(t => t.id == activeTripId);
    if (!trip) return;

    const select = el("modal-item-select");
    const name = select.value;
    if (!name || name.includes("attached")) return;

    const catItem = catalog.find(c => c.name === name);
    if (!catItem) return;

    const newAtt = {
      id: "att-" + Date.now(),
      name: catItem.name,
      type: catItem.type,
      address: catItem.address,
      price: catItem.price,
      x: catItem.x,
      y: catItem.y
    };

    if (!trip.attachments) trip.attachments = [];
    trip.attachments.push(newAtt);

    localStorage.setItem(`itinari_attachments_${trip.id}`, JSON.stringify(trip.attachments));
    renderActiveTripDetails();
  }

  global.addSelectedItemToTrip = addSelectedItemToTrip;

  function detachItemFromTrip(itemId) {
    const trip = tripsDataList.find(t => t.id == activeTripId);
    if (!trip) return;

    trip.attachments = (trip.attachments || []).filter(att => att.id !== itemId);
    localStorage.setItem(`itinari_attachments_${trip.id}`, JSON.stringify(trip.attachments));
    renderActiveTripDetails();
  }

  global.detachItemFromTrip = detachItemFromTrip;

  function renderCalendarSchedule() {
    const trip = tripsDataList.find(t => t.id == activeTripId);
    if (!trip) {
      el("schedule-trip-title").textContent = "Schedule";
      el("calendar-days-container").innerHTML = "";
      el("schedule-items-list").innerHTML = `<div class="text-muted">Select a trip to schedule activities.</div>`;
      return;
    }

    el("schedule-trip-title").innerHTML = `<i class="fas fa-calendar-check"></i> Schedule · ${trip.title.split(" ")[0]}`;

    const start = new Date(trip.start_date || Date.now());
    const end = new Date(trip.end_date || Date.now() + 86400000);
    const dayDiff = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);

    const grid = el("calendar-days-container");
    grid.innerHTML = "";

    const daysOfWeek = ["M", "T", "W", "T", "F", "S", "S"];
    daysOfWeek.forEach(d => {
      const col = document.createElement("div");
      col.className = "cal-day";
      col.style.fontWeight = "bold";
      col.style.background = "transparent";
      col.style.border = "none";
      col.textContent = d;
      grid.appendChild(col);
    });

    for (let d = 1; d <= dayDiff; d++) {
      const cell = document.createElement("div");
      cell.className = `cal-day ${d === 1 ? 'active' : ''}`;
      
      const dateNum = new Date(start.getTime() + (d - 1) * 24 * 60 * 60 * 1000).getDate();
      cell.innerHTML = `${dateNum} ${(trip.attachments && trip.attachments.length > 0) ? '<span class="event-dot"></span>' : ''}`;
      
      cell.onclick = () => {
        document.querySelectorAll(".cal-day").forEach(c => c.classList.remove("active"));
        cell.classList.add("active");
        populateCalendarSlots(d, trip);
      };
      grid.appendChild(cell);
    }

    populateCalendarSlots(1, trip);
  }

  function populateCalendarSlots(dayIndex, trip) {
    const list = el("schedule-items-list");
    list.innerHTML = "";

    const dailyExcursions = [
      { hour: "Morning Activity", name: "Beach Day & Relaxing" },
      { hour: "Afternoon Tour", name: "Leisure Sightseeing Walk" },
      { hour: "Dinner Reservation", name: "Local Culinary Restaurant" }
    ];

    const attachments = trip.attachments || [];
    const hotels = attachments.filter(a => a.type === "Hotel");
    const attractions = attachments.filter(a => a.type === "Attraction");
    const restaurants = attachments.filter(a => a.type === "Restaurant");

    if (hotels.length > 0) {
      dailyExcursions[0].name = `Lobby meeting at ${hotels[0].name}`;
    }
    if (attractions.length > 0) {
      const att = attractions[(dayIndex - 1) % attractions.length];
      dailyExcursions[1].name = `${att.name} Visit`;
    }
    if (restaurants.length > 0) {
      const res = restaurants[(dayIndex - 1) % restaurants.length];
      dailyExcursions[2].name = `Dinner at ${res.name}`;
    }

    dailyExcursions.forEach((slot, index) => {
      const div = document.createElement("div");
      div.className = "schedule-item";
      
      const icons = ["umbrella-beach", "hiking", "utensils"];
      const icon = icons[index % 3];

      div.innerHTML = `
        <span><i class="fas fa-${icon}" style="color:#3b7cff; margin-right: 8px;"></i> ${slot.name}</span>
        <span>${slot.hour}</span>
      `;
      list.appendChild(div);
    });
  }

  function renderCheckoutInvoice() {
    const trip = tripsDataList.find(t => t.id == activeTripId);
    if (!trip) {
      el("checkout-summary-container").innerHTML = `<div class="text-muted">Select a trip to proceed to invoice billing.</div>`;
      return;
    }

    const travelers = parseInt(trip.no_of_travelers || 2);
    const flightCost = 290 * travelers;

    const start = new Date(trip.start_date || Date.now());
    const end = new Date(trip.end_date || Date.now());
    const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

    const container = el("checkout-summary-container");
    container.innerHTML = "";

    const listDiv = document.createElement("div");

    let detailsHtml = `<div class="price-row"><span>✈️ Return Flights (x${travelers} pax)</span> <span>$${flightCost}</span></div>`;
    let lodgingsTotal = 0;
    let attractionsTotal = 0;

    const attachments = trip.attachments || [];
    attachments.forEach(item => {
      if (item.type === "Hotel") {
        const cost = item.price * nights;
        lodgingsTotal += cost;
        detailsHtml += `<div class="price-row"><span>🏨 ${item.name} Resort (${nights} nights)</span> <span>$${cost}</span></div>`;
      } else {
        const cost = item.price * travelers;
        attractionsTotal += cost;
        detailsHtml += `<div class="price-row"><span>🎟️ ${item.name} Entry Tickets</span> <span>$${cost}</span></div>`;
      }
    });

    const totalCost = flightCost + lodgingsTotal + attractionsTotal;

    detailsHtml += `
      <div class="price-row total"><span>Total</span> <span>$${totalCost.toLocaleString()}</span></div>
      <div style="margin-top: 1.8rem; display: flex; gap: 1rem; flex-wrap: wrap;">
        <button class="btn-primary" onclick="simulatePayment(${totalCost})"><i class="fas fa-credit-card"></i> Pay now</button>
        <button class="btn-outline"><i class="fas fa-lock"></i> Secure</button>
      </div>
      <p style="margin-top: 0.8rem; font-size: 0.9rem; color: #3b6a93;"><i class="fas fa-shield-alt"></i> Payment via Stripe · 3D secure</p>
    `;

    listDiv.innerHTML = detailsHtml;
    container.appendChild(listDiv);
  }

  function simulatePayment(amount) {
    alert(`💳 Payment simulation: $${amount.toLocaleString()} charged successfully!`);
  }

  global.simulatePayment = simulatePayment;

  // -------------------------------------------------------------
  // Load State
  // -------------------------------------------------------------
  function renderProfile(user) {
    el("user-display-name").textContent = user.name;
    el("user-display-role").textContent = It.session.roleOf(user).replace(/_/g, ' ').toUpperCase();

    const letters = user.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
    el("avatar-letters").textContent = letters || "U";

    const first = user.name.split(" ")[0].replace(/[.]+$/, "") || "there";
    el("greet").textContent = "Welcome back, " + first + ".";
    el("greet-sub").textContent = "Here's what's happening with your travels.";
  }

  function load(user) {
    renderProfile(user);
    const tripsList = el("trips-list");
    const favsList = el("favs-list");
    const notifsList = el("notifications-list");

    const mockTrips = [
      { title: "Bali Escape Voyage", status: "planned", start_date: "2026-06-12" },
      { title: "Swiss Alps Adventure", status: "planned", start_date: "2026-07-03" },
      { title: "NYC Express Getaway", status: "planned", start_date: "2026-08-22" }
    ];

    const mockFavs = [
      { name: "Amnaya Resort DPS", address: "Kuta, Bali" },
      { name: "Swiss Alps Chalet", address: "Zermatt, Switzerland" }
    ];

    const mockNotifs = [
      { message: "Welcome to Itinari! Explore trips and bookmark your favorites.", created_at: new Date().toISOString() },
      { message: "Your card payment of $580.00 was processed successfully.", created_at: new Date(Date.now() - 3600000).toISOString() },
      { message: "Your trip itinerary to DPS is finalized.", created_at: new Date(Date.now() - 7200000).toISOString() }
    ];

    Promise.all([
      It.apiGet(DASH.stats, { auth: true }),
      It.apiGet(DASH.trips, { auth: true }),
      It.apiGet(DASH.favs, { auth: true }),
      It.apiGet(DASH.notifs, { auth: true }),
    ]).then(function (results) {
      const [statsRes, tripsRes, favsRes, notifsRes] = results;
      const stats = statsRes.ok && statsRes.body && statsRes.body.data ? statsRes.body.data : null;
      if (stats) {
        setStat("stat-total", stats.total_trips ?? "0");
        setStat("stat-pending", stats.trip_statistics ? stats.trip_statistics.pending : "0");
        setStat("stat-planning", stats.trip_statistics ? stats.trip_statistics.planning : "0");
        setStat("stat-booked", stats.trip_statistics ? stats.trip_statistics.booked : "0");
        setStat("stat-completed", stats.trip_statistics ? stats.trip_statistics.completed : "0");
        setStat("stat-cancelled", stats.trip_statistics ? stats.trip_statistics.cancelled : "0");
        setStat("stat-favs", stats.total_favourites ?? "0");
      } else {
        throw new Error("Stats load failed");
      }

      const tripsData = tripsRes.ok && tripsRes.body && tripsRes.body.data ? tripsRes.body.data : [];
      setFeed(tripsList, tripsData, "No trips yet. Start planning your next adventure!", renderTrips);

      const favsData = favsRes.ok && favsRes.body && favsRes.body.data ? favsRes.body.data : [];
      setFeed(favsList, favsData, "No favourites saved yet.", renderFavs);

      const notifsData = notifsRes.ok && notifsRes.body && notifsRes.body.data ? notifsRes.body.data : [];
      setFeed(notifsList, notifsData, "No new notifications.", renderNotifications);
    }).catch(function (err) {
      console.warn("Backend API unavailable, loading fallback mockup stats:", err);

      // Populate fallback mock stats
      setStat("stat-total", "3");
      setStat("stat-pending", "0");
      setStat("stat-planning", "3");
      setStat("stat-booked", "0");
      setStat("stat-completed", "0");
      setStat("stat-cancelled", "0");
      setStat("stat-favs", "2");

      setFeed(tripsList, mockTrips, "No trips yet.", renderTrips);
      setFeed(favsList, mockFavs, "No favourites saved yet.", renderFavs);
      setFeed(notifsList, mockNotifs, "No new notifications.", renderNotifications);

      fb.banner("Showing demo mode dashboard (offline).", "is-info");
    });

    // Fetch Weather
    // We'll use a fixed lat/lon for demo purposes (e.g. Cairo) if browser geolocation is not available immediately
    // or just call the backend endpoint.
    It.apiGet('/weather?lat=30.0444&lon=31.2357', { auth: true })
      .then(res => {
        if (res.ok && res.body && res.body.data) {
          const w = res.body.data;
          el("weather-temp").textContent = w.temperature ? `${Math.round(w.temperature)}°C` : "--°C";
          el("weather-desc").textContent = w.description || "Sunny";
          el("weather-location").textContent = w.city || "Cairo, EG";
        }
      })
      .catch(err => {
        el("weather-desc").textContent = "Weather unavailable";
        el("weather-location").textContent = "Could not load weather";
      });
  }
  // =============================================================
  // AI CONCIERGE & ENHANCE LOGIC
  // =============================================================
  global.enhanceTrip = function() {
    if (!activeTripId) return;
    fb.banner("AI is analyzing and enhancing your trip...", "is-info");
    It.apiPost("/enhance", { trip_id: activeTripId }, { auth: true })
      .then(res => {
        if (res.ok) {
          fb.banner("Trip enhanced successfully by AI!", "is-ok");
          loadTripsFromDb();
        } else {
          fb.banner("Failed to enhance trip.", "is-error");
        }
      })
      .catch(err => fb.banner("AI service error.", "is-error"));
  };

  global.reviewTrip = function() {
    if (!activeTripId) return;
    fb.banner("Generating AI review...", "is-info");
    It.apiPost("/review", { trip_id: activeTripId }, { auth: true })
      .then(res => {
        if (res.ok) {
          alert("AI Review:\n" + (res.body.data.review || res.body.data.message || "Trip looks great!"));
        } else {
          fb.banner("Failed to generate AI review.", "is-error");
        }
      })
      .catch(err => fb.banner("AI service error.", "is-error"));
  };

  global.sendConciergeMessage = function() {
    if (!activeTripId) return;
    const input = el("concierge-input");
    const msg = input.value.trim();
    if (!msg) return;

    const history = el("concierge-chat-history");
    const userMsgDiv = document.createElement("div");
    userMsgDiv.style = "align-self: flex-end; background: var(--primary-accent); color: white; padding: 0.8rem 1rem; border-radius: 12px 12px 0 12px; font-size: 0.9rem;";
    userMsgDiv.textContent = msg;
    history.appendChild(userMsgDiv);
    input.value = "";
    history.scrollTop = history.scrollHeight;

    const loaderDiv = document.createElement("div");
    loaderDiv.style = "align-self: flex-start; background: var(--bg-surface); padding: 0.8rem 1rem; border-radius: 12px 12px 12px 0; border: 1px solid var(--border-color); font-size: 0.9rem;";
    loaderDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Typing...';
    history.appendChild(loaderDiv);
    history.scrollTop = history.scrollHeight;

    It.apiPost(`/v1/trips/${activeTripId}/concierge`, { message: msg }, { auth: true })
      .then(res => {
        history.removeChild(loaderDiv);
        const aiMsgDiv = document.createElement("div");
        aiMsgDiv.style = "align-self: flex-start; background: var(--bg-surface); padding: 0.8rem 1rem; border-radius: 12px 12px 12px 0; border: 1px solid var(--border-color); font-size: 0.9rem;";
        aiMsgDiv.textContent = (res.ok && res.body && res.body.data && res.body.data.reply) ? res.body.data.reply : "I am an AI assistant. How can I help you plan this trip?";
        history.appendChild(aiMsgDiv);
        history.scrollTop = history.scrollHeight;
      })
      .catch(err => {
        history.removeChild(loaderDiv);
        fb.banner("AI Concierge is currently unavailable.", "is-error");
      });
  };

  function boot() {
    if (!It.session.hasToken()) {
      It.session.redirectToLogin();
      return;
    }
    It.session.currentUser().then(function (user) {
      if (!user) {
        It.session.clearSession();
        It.session.redirectToLogin();
        return;
      }
      const role = It.session.roleOf(user);
      if (It.session.isAdminRole(role)) {
        global.location.replace((It.CONFIG.roleUrl && It.CONFIG.roleUrl.admin) || "/admin/index.html");
        return;
      }
      load(user);
    });
  }

  function initTheme() {
    const btn = el("theme-toggle");
    if (!btn) return;
    const sun = btn.querySelector(".icon-sun");
    const moon = btn.querySelector(".icon-moon");

    let dark = false;
    try { dark = global.localStorage.getItem("theme") === "dark"; } catch (e) {}

    function setDark(val) {
      dark = val;
      document.documentElement.classList.toggle("dark", dark);
      if (sun) sun.style.display = dark ? "none" : "block";
      if (moon) moon.style.display = dark ? "block" : "none";
      btn.setAttribute("aria-pressed", String(dark));
      try { global.localStorage.setItem("theme", dark ? "dark" : "light"); } catch (e) {}
    }

    setDark(dark);
    btn.addEventListener("click", function () { setDark(!dark); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    const btn = el("logout-btn");
    if (btn) btn.addEventListener("click", function () { It.session.logout(); });
    initTheme();
    boot();
  });
})(window);