/**
 * planner.js — light-themed Trip Planning Engine SPA.
 * Interfaces with Laravel backend endpoints for live trip storage.
 */
(function (global) {
    "use strict";

    const It = global.Itinari;
    const fb = It.feedback;

    let trips = [];
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

    function el(id) { return document.getElementById(id); }

    // -------------------------------------------------------------
    // Page Tab Navigation
    // -------------------------------------------------------------
    function navigateTo(pageId) {
        document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
        el(pageId).classList.add("active");

        document.querySelectorAll(".nav-pills button").forEach(btn => {
            const dataPage = btn.getAttribute("data-page");
            btn.classList.toggle("active", dataPage === pageId);
        });

        // Trigger updates when specific tabs load
        if (pageId === "page-trips") {
            loadTripsFromDb();
        } else if (pageId === "page-details") {
            renderActiveTripDetails();
        } else if (pageId === "page-schedule") {
            renderCalendarSchedule();
        } else if (pageId === "page-checkout") {
            renderCheckoutInvoice();
        }
    }

    global.navigateTo = navigateTo;

    // Attach Nav Pills buttons event listeners
    function setupNavButtons() {
        document.querySelectorAll('.nav-pills button').forEach(btn => {
            btn.addEventListener('click', function() {
                const pageId = this.getAttribute('data-page');
                if (pageId) navigateTo(pageId);
            });
        });
    }

    // -------------------------------------------------------------
    // Database API queries
    // -------------------------------------------------------------
    function loadTripsFromDb() {
        const grid = el("trip-grid-container");
        grid.innerHTML = `<div class="skeleton" style="min-height:160px; grid-column:1/-1;"></div>`;

        It.apiGet("/v1/dashboard/trips", { auth: true }).then(function (res) {
            if (res.ok && res.body && res.body.data) {
                trips = res.body.data;
                
                // Fetch mock attachments persistent in local storage
                trips.forEach(t => {
                    const localAtts = localStorage.getItem(`itinari_attachments_${t.id}`);
                    t.attachments = localAtts ? JSON.parse(localAtts) : [];
                    
                    // Fallback attachments if database trip is newly created
                    if (t.attachments.length === 0 && t.title.includes("Bali")) {
                        t.attachments = [
                            { id: "att-1", name: "Amnaya Resort DPS", type: "Hotel", address: "Kuta, Bali", price: 140, x: 50, y: 110 },
                            { id: "att-2", name: "Nusa Penida Tour", type: "Attraction", address: "Nusa Penida", price: 45, x: 140, y: 130 }
                        ];
                        localStorage.setItem(`itinari_attachments_${t.id}`, JSON.stringify(t.attachments));
                    }
                });

                if (trips.length > 0 && !activeTripId) {
                    activeTripId = trips[0].id;
                }

                renderTripsList();
            } else {
                fb.banner("Failed to pull trips from database.", "is-error");
            }
        }).catch(function (err) {
            fb.banner(err.message || "Failed to reach backend database server.", "is-error");
        });
    }

    function renderTripsList() {
        const grid = el("trip-grid-container");
        grid.innerHTML = "";

        if (trips.length === 0) {
            grid.innerHTML = `<div class="text-muted" style="grid-column:1/-1;">No trips found in database. Create one!</div>`;
            el("trips-count-meta").innerHTML = `<i class="fas fa-info-circle"></i> 0 trips · last updated today`;
            return;
        }

        trips.forEach(trip => {
            const card = document.createElement("div");
            card.className = "trip-card";
            card.onclick = () => {
                activeTripId = trip.id;
                navigateTo("page-details");
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

        el("trips-count-meta").innerHTML = `<i class="fas fa-info-circle"></i> ${trips.length} trips · last updated today`;
    }

    // -------------------------------------------------------------
    // Page 2: Create Trip (Live DB POST)
    // -------------------------------------------------------------
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
            budget: 2500, // default budget mapping
            start_date: start,
            end_date: end,
            no_of_travelers: travelers
        };

        fb.banner("Saving trip to database...", "is-info");

        It.apiPost("/v1/trips", postBody, { auth: true }).then(function (res) {
            if (res.ok && res.body && res.body.data) {
                fb.banner("Trip created successfully!", "is-ok");
                activeTripId = res.body.data.id;
                
                // Initialize empty attachments
                localStorage.setItem(`itinari_attachments_${activeTripId}`, JSON.stringify([]));
                
                loadTripsFromDb();
                navigateTo("page-trips");
            } else {
                fb.banner(res.body.message || "Failed to save trip.", "is-error");
            }
        }).catch(function (err) {
            fb.banner(err.message || "Database connection error.", "is-error");
        });
    }

    global.saveNewTripToDb = saveNewTripToDb;

    // -------------------------------------------------------------
    // Page 3: Trip Details & Map Route
    // -------------------------------------------------------------
    function renderActiveTripDetails() {
        const trip = trips.find(t => t.id == activeTripId);
        if (!trip) {
            el("details-trip-title").innerHTML = `<i class="fas fa-map-marked-alt"></i> No Trip Selected`;
            el("timeline-container").innerHTML = `<div class="text-muted">Select a trip from the list first.</div>`;
            return;
        }

        el("details-trip-title").innerHTML = `<i class="fas fa-map-marked-alt"></i> ${trip.title} · Details`;

        // Populate Timeline items list
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

        // Render Dynamic SVG route map
        renderMapCanvas(attachments);

        // Open Attach modal list options
        populateAttachModal(trip);
    }

    function renderMapCanvas(attachments) {
        const container = el("map-canvas-container");
        container.innerHTML = "";

        if (attachments.length === 0) {
            container.innerHTML = `<i class="fas fa-map-pin" style="margin-right: 6px;"></i> Map route checkpoints will show here`;
            return;
        }

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("style", "position:absolute; inset:0;");

        // Connecting line path
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

        // Circles nodes
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

    // -------------------------------------------------------------
    // Page 3: Attach/Detach functions
    // -------------------------------------------------------------
    function populateAttachModal(trip) {
        const select = el("modal-item-select");
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
        const trip = trips.find(t => t.id == activeTripId);
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
        const trip = trips.find(t => t.id == activeTripId);
        if (!trip) return;

        trip.attachments = (trip.attachments || []).filter(att => att.id !== itemId);
        localStorage.setItem(`itinari_attachments_${trip.id}`, JSON.stringify(trip.attachments));
        renderActiveTripDetails();
    }

    global.detachItemFromTrip = detachItemFromTrip;

    // -------------------------------------------------------------
    // Page 4: Calendar Schedule View
    // -------------------------------------------------------------
    function renderCalendarSchedule() {
        const trip = trips.find(t => t.id == activeTripId);
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

        // Populate days grid
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
            
            // Add date number increment starting from trip start date day
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

    // -------------------------------------------------------------
    // Page 5: Checkout Summary Billing
    // -------------------------------------------------------------
    function renderCheckoutInvoice() {
        const trip = trips.find(t => t.id == activeTripId);
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

        // Flight tickets row
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
    // Boot Authentication Gate
    // -------------------------------------------------------------
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
                global.location.replace(It.CONFIG.role.admin);
                return;
            }

            // Update badge in header
            document.querySelector(".user-badge").innerHTML = `<i class="fas fa-user-circle"></i> ${user.name}`;

            // Load trips
            loadTripsFromDb();
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        const btn = el("logout-btn");
        if (btn) btn.addEventListener("click", function () { It.session.logout(); });
        
        setupNavButtons();
        boot();
    });

})(window);
