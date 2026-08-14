<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Booking Report — {{ config('app.name', 'Itinera') }}</title>
    <style>
        /* ── Itinera Luxury Gold & Dark Palette ──────────────────────────────
           Deep Onyx #0B0F19 | Gold Accent #F59E0B | Amber #FBBF24 | Slate #1E293B
        ─────────────────────────────────────────────────────────────────────── */

        @page { margin: 0; }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #1e293b;
            background: #ffffff;
            margin: 0;
            padding: 0;
        }

        /* Page breaks */
        .page { page-break-after: always; padding: 28px 32px; box-sizing: border-box; }
        .page:last-child { page-break-after: auto; }

        /* ── COVER PAGE ─────────────────────────────────────────────────────── */
        .cover {
            page: cover;
            width: 100%;
            height: 297mm;
            background-color: #0b0f19;
            position: relative;
            overflow: hidden;
            page-break-after: always;
        }

        /* Top diagonal band */
        .cover-band-top {
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 8px;
            background: linear-gradient(90deg, #f59e0b, #fbbf24, #d97706);
        }

        /* Bottom diagonal band */
        .cover-band-bottom {
            position: absolute;
            bottom: 0; left: 0; right: 0;
            height: 6px;
            background: linear-gradient(90deg, #d97706, #f59e0b, #fbbf24);
        }

        /* Large background circle decorations */
        .cover-circle-1 {
            position: absolute;
            top: -80px; right: -80px;
            width: 340px; height: 340px;
            border-radius: 50%;
            background: rgba(245, 158, 11, 0.12);
        }
        .cover-circle-2 {
            position: absolute;
            bottom: 80px; left: -60px;
            width: 240px; height: 240px;
            border-radius: 50%;
            background: rgba(251, 191, 36, 0.08);
        }
        .cover-circle-3 {
            position: absolute;
            top: 50%; right: 60px;
            width: 120px; height: 120px;
            border-radius: 50%;
            background: rgba(245, 158, 11, 0.15);
        }

        /* Content area positioned in vertical centre */
        .cover-content {
            position: absolute;
            top: 250pt;
            left: 0; right: 0;
            padding: 0 60px;
            box-sizing: border-box;
            text-align: center;
        }
        .cover-content-inner {
            display: block;
        }

        /* Logo wordmark */
        .cover-logo {
            font-size: 52px;
            font-weight: bold;
            color: #ffffff;
            letter-spacing: -0.03em;
            margin-bottom: 4px;
        }
        .cover-logo span {
            color: #f59e0b;
        }

        .cover-logo-wrap {
            margin-bottom: 20px;
            text-align: center;
        }

        .cover-tagline {
            font-size: 12px;
            color: #fbbf24;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            margin-bottom: 30px;
        }

        .cover-rule {
            width: 100px;
            height: 3px;
            background: #f59e0b;
            margin: 0 auto 30px auto;
        }

        .cover-title {
            font-size: 32px;
            font-weight: bold;
            color: #ffffff;
            margin-bottom: 12px;
            line-height: 1.2;
        }

        .cover-subtitle {
            font-size: 15px;
            color: #94a3b8;
            margin-bottom: 44px;
        }

        .cover-meta {
            border-top: 1px solid rgba(255, 255, 255, 0.15);
            padding-top: 24px;
            width: 100%;
        }

        .cover-meta-table {
            width: 100%;
            border-collapse: collapse;
        }

        .cover-meta-table td {
            vertical-align: top;
            text-align: center;
            padding: 0 16px;
        }

        .cover-meta-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            color: #64748b;
            margin-bottom: 6px;
        }

        .cover-meta-value {
            font-size: 13px;
            font-weight: bold;
            color: #f8fafc;
        }

        /* ── INNER PAGES HEADER & FOOTER ───────────────────────────────────── */
        .page-header-bar {
            border-bottom: 2px solid #f59e0b;
            padding-bottom: 10px;
            margin-bottom: 24px;
        }
        .page-header-bar table {
            width: 100%;
        }
        .page-title-text {
            font-size: 18px;
            font-weight: bold;
            color: #0b0f19;
            margin: 0;
        }
        .page-sub-text {
            font-size: 11px;
            color: #64748b;
            margin: 3px 0 0 0;
        }
        .page-brand-logo {
            font-size: 16px;
            font-weight: bold;
            color: #0b0f19;
            text-align: right;
        }
        .page-brand-logo span {
            color: #f59e0b;
        }

        /* ── SECTION HEADINGS ──────────────────────────────────────────────── */
        .section-heading {
            font-size: 13px;
            font-weight: bold;
            color: #0b0f19;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin: 22px 0 12px 0;
            border-left: 4px solid #f59e0b;
            padding-left: 10px;
        }

        /* ── KPI CARDS GRID ────────────────────────────────────────────────── */
        .kpi-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 12px;
            margin-bottom: 20px;
        }
        .kpi-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-top: 3px solid #f59e0b;
            border-radius: 8px;
            padding: 14px;
            text-align: center;
        }
        .kpi-val {
            font-size: 20px;
            font-weight: bold;
            color: #0b0f19;
            margin-bottom: 4px;
        }
        .kpi-lbl {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #64748b;
        }

        /* ── TABLES ────────────────────────────────────────────────────────── */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .data-table th {
            background: #0b0f19;
            color: #ffffff;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 10px 12px;
            text-align: left;
            border-bottom: 2px solid #f59e0b;
        }
        .data-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
            font-size: 12px;
        }
        .data-table tr:nth-child(even) td {
            background: #f8fafc;
        }

        /* ── BADGES ────────────────────────────────────────────────────────── */
        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-success { background: #dcfce7; color: #15803d; }
        .badge-warning { background: #fef3c7; color: #b45309; }
        .badge-danger { background: #fee2e2; color: #b91c1c; }

        /* Chart container */
        .chart-box {
            text-align: center;
            margin: 20px 0;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
        }
        .chart-box img {
            max-width: 100%;
            height: auto;
            border-radius: 6px;
        }
    </style>
</head>
<body>

    <!-- =================================================================== -->
    <!-- COVER PAGE (COLEADER DESIGN ENHANCED)                              -->
    <!-- =================================================================== -->
    <div class="cover">
        <div class="cover-band-top"></div>
        <div class="cover-band-bottom"></div>
        <div class="cover-circle-1"></div>
        <div class="cover-circle-2"></div>
        <div class="cover-circle-3"></div>

        <div class="cover-content">
            <div class="cover-content-inner">
                <div class="cover-logo">ITINERA<span>.</span></div>
                <div class="cover-tagline">Luxury Travel & Executive Telemetry</div>
                <div class="cover-rule"></div>

                <div class="cover-title">Global Platform & Booking Analytics</div>
                <div class="cover-subtitle">Executive Performance Audit & Financial Telemetry Report</div>

                <div class="cover-meta">
                    <table class="cover-meta-table">
                        <tr>
                            <td>
                                <div class="cover-meta-label">Audit Period</div>
                                <div class="cover-meta-value">{{ $from }} &mdash; {{ $to }}</div>
                            </td>
                            <td>
                                <div class="cover-meta-label">Generated At</div>
                                <div class="cover-meta-value">{{ $generatedAt->format('Y-m-d H:i') }} UTC</div>
                            </td>
                            <td>
                                <div class="cover-meta-label">Classification</div>
                                <div class="cover-meta-value">Executive Confidential</div>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- =================================================================== -->
    <!-- PAGE 1: EXECUTIVE SUMMARY & KPIS                                    -->
    <!-- =================================================================== -->
    <div class="page">
        <div class="page-header-bar">
            <table>
                <tr>
                    <td>
                        <h2 class="page-title-text">Executive Summary & Key Metrics</h2>
                        <p class="page-sub-text">Platform performance audit ({{ $from }} to {{ $to }})</p>
                    </td>
                    <td class="page-brand-logo">
                        ITINERA<span>.</span>
                    </td>
                </tr>
            </table>
        </div>

        <div class="section-heading">Platform Telemetry Summary</div>
        <table class="kpi-table">
            <tr>
                <td style="width: 25%;">
                    <div class="kpi-card">
                        <div class="kpi-val">${{ number_format($kpis['totalRevenue'] ?? 0, 2) }}</div>
                        <div class="kpi-lbl">Total Gross Revenue</div>
                    </div>
                </td>
                <td style="width: 25%;">
                    <div class="kpi-card">
                        <div class="kpi-val">{{ number_format($kpis['totalBookings'] ?? 0) }}</div>
                        <div class="kpi-lbl">Total Bookings</div>
                    </div>
                </td>
                <td style="width: 25%;">
                    <div class="kpi-card">
                        <div class="kpi-val">{{ number_format($kpis['newUsersCount'] ?? 0) }}</div>
                        <div class="kpi-lbl">New Registered Users</div>
                    </div>
                </td>
                <td style="width: 25%;">
                    <div class="kpi-card">
                        <div class="kpi-val">${{ number_format($kpis['averageBookingValue'] ?? 0, 2) }}</div>
                        <div class="kpi-lbl">Average Booking Value</div>
                    </div>
                </td>
            </tr>
        </table>

        @if(!empty($monthlyRevenueChartUrl))
        <div class="section-heading">Monthly Revenue Trajectory</div>
        <div class="chart-box">
            <img src="{{ $monthlyRevenueChartUrl }}" alt="Monthly Revenue Chart">
        </div>
        @endif
    </div>

    <!-- =================================================================== -->
    <!-- PAGE 2: REVENUE ANALYTICS                                           -->
    <!-- =================================================================== -->
    <div class="page">
        <div class="page-header-bar">
            <table>
                <tr>
                    <td>
                        <h2 class="page-title-text">Revenue & Booking Type Breakdown</h2>
                        <p class="page-sub-text">Financial distribution across product categories</p>
                    </td>
                    <td class="page-brand-logo">
                        ITINERA<span>.</span>
                    </td>
                </tr>
            </table>
        </div>

        <div class="section-heading">Revenue by Booking Category</div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Booking Category</th>
                    <th>Gross Revenue ($)</th>
                    <th>Share (%)</th>
                </tr>
            </thead>
            <tbody>
                @forelse($revenueByType as $row)
                <tr>
                    <td><strong>{{ ucfirst($row->type ?? 'General') }}</strong></td>
                    <td>${{ number_format($row->revenue ?? 0, 2) }}</td>
                    <td>
                        @php
                            $total = $revenueByType->sum('revenue');
                            $pct = $total > 0 ? ($row->revenue / $total) * 100 : 0;
                        @endphp
                        {{ number_format($pct, 1) }}%
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="3" style="text-align: center; color: #94a3b8;">No revenue records in this date range.</td>
                </tr>
                @endforelse
            </tbody>
        </table>

        @if(!empty($revenueByTypeChartUrl))
        <div class="section-heading">Revenue Category Distribution</div>
        <div class="chart-box">
            <img src="{{ $revenueByTypeChartUrl }}" alt="Revenue by Type Chart">
        </div>
        @endif
    </div>

    <!-- =================================================================== -->
    <!-- PAGE 3: TOP DESTINATIONS & INSIGHTS                                 -->
    <!-- =================================================================== -->
    <div class="page">
        <div class="page-header-bar">
            <table>
                <tr>
                    <td>
                        <h2 class="page-title-text">Top Destinations & Market Demand</h2>
                        <p class="page-sub-text">Highest performing travel destinations and demand peaks</p>
                    </td>
                    <td class="page-brand-logo">
                        ITINERA<span>.</span>
                    </td>
                </tr>
            </table>
        </div>

        <div class="section-heading">Top Performing Destinations</div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Destination Name</th>
                    <th>Bookings Count</th>
                    <th>Demand Status</th>
                </tr>
            </thead>
            <tbody>
                @forelse($topDestinations as $dest)
                <tr>
                    <td><strong>{{ $dest->name ?? 'Unknown' }}</strong></td>
                    <td>{{ number_format($dest->bookings_count ?? 0) }}</td>
                    <td><span class="badge badge-success">High Demand</span></td>
                </tr>
                @empty
                <tr>
                    <td colspan="3" style="text-align: center; color: #94a3b8;">No destination data available.</td>
                </tr>
                @endforelse
            </tbody>
        </table>

        @if(!empty($topDestinationsChartUrl))
        <div class="section-heading">Destination Performance Visualization</div>
        <div class="chart-box">
            <img src="{{ $topDestinationsChartUrl }}" alt="Top Destinations Chart">
        </div>
        @endif
    </div>

</body>
</html>
