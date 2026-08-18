<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Executive Analytics Report — {{ config('app.name', 'Itinera') }}</title>
    <style>
        /* ── Itinera Luxury Gold & Dark Onyx Palette ────────────────────────
           Onyx #0B0F19 | Gold Accent #F59E0B | Amber #FBBF24 | Slate #1E293B | Ice #F1F5F9
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

        .cover-band-top {
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 8px;
            background: linear-gradient(90deg, #d97706, #f59e0b, #fbbf24);
        }

        .cover-band-bottom {
            position: absolute;
            bottom: 0; left: 0; right: 0;
            height: 6px;
            background: linear-gradient(90deg, #fbbf24, #f59e0b, #d97706);
        }

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

        .cover-content {
            position: absolute;
            top: 220pt;
            left: 0; right: 0;
            padding: 0 60px;
            box-sizing: border-box;
            text-align: center;
        }
        .cover-content-inner {
            display: block;
        }

        .cover-logo-wrap {
            margin-bottom: 24px;
            text-align: center;
        }
        .cover-logo-img {
            max-height: 84px;
            width: auto;
        }

        .cover-badge {
            display: inline-block;
            font-size: 10px;
            font-weight: bold;
            color: #0b0f19;
            background: #fbbf24;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            padding: 6px 16px;
            border-radius: 999px;
            margin-bottom: 22px;
        }

        .cover-tagline {
            font-size: 11px;
            color: #fbbf24;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            margin-bottom: 24px;
        }

        .cover-rule {
            width: 90px;
            height: 3px;
            background: #f59e0b;
            margin: 0 auto 28px auto;
        }

        .cover-title {
            font-size: 30px;
            font-weight: bold;
            color: #ffffff;
            margin-bottom: 10px;
            line-height: 1.25;
        }

        .cover-subtitle {
            font-size: 14px;
            color: #94a3b8;
            margin-bottom: 40px;
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
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            color: #64748b;
            margin-bottom: 6px;
        }

        .cover-meta-value {
            font-size: 12px;
            font-weight: bold;
            color: #f8fafc;
        }

        /* ── INNER PAGES HEADER & FOOTER ───────────────────────────────────── */
        .page-header {
            background: #0b0f19;
            margin: -28px -32px 0 -32px;
            padding: 14px 32px;
            overflow: hidden;
            border-bottom: 2px solid #f59e0b;
        }
        .page-header-inner {
            float: left;
            line-height: 1;
        }
        .page-logo-img {
            height: 26px;
            vertical-align: middle;
            margin-right: 12px;
        }
        .page-header-title {
            font-size: 13px;
            font-weight: bold;
            color: #fbbf24;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            vertical-align: middle;
        }
        .page-header-right {
            float: right;
            text-align: right;
            font-size: 10px;
            color: #94a3b8;
            padding-top: 5px;
        }
        .page-header-clearfix { clear: both; }
        .page-accent-line {
            height: 2px;
            background: #f59e0b;
            margin: 0 -32px 20px -32px;
        }

        /* Section headings */
        h2 {
            font-size: 18px;
            margin: 0 0 16px;
            color: #ffffff;
            background: #0b0f19;
            padding: 10px 16px;
            border-radius: 4px;
            border-left: 4px solid #f59e0b;
        }
        h3 {
            font-size: 14px;
            margin: 16px 0 10px;
            color: #0b0f19;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 5px;
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
        .kpi-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
        .kpi-value { font-size: 22px; font-weight: bold; margin-top: 4px; color: #0b0f19; }
        .kpi-positive { color: #16a34a; font-weight: bold; }
        .kpi-negative { color: #dc2626; font-weight: bold; }

        /* ── TABLES ────────────────────────────────────────────────────────── */
        table.data {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 12px;
        }
        table.data thead tr {
            background: #0b0f19;
        }
        table.data th {
            color: #ffffff;
            padding: 9px 12px;
            text-align: left;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 2px solid #f59e0b;
        }
        table.data td {
            padding: 9px 12px;
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
        }
        table.data tr:nth-child(even) td {
            background: #f8fafc;
        }

        /* ── BADGES & CHANGES ──────────────────────────────────────────────── */
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-success { background: #dcfce7; color: #15803d; }
        .badge-warning { background: #fef3c7; color: #b45309; }
        .badge-danger { background: #fee2e2; color: #b91c1c; }

        .change-up { color: #16a34a; font-weight: bold; }
        .change-down { color: #dc2626; font-weight: bold; }
        .change-flat { color: #64748b; }

        /* Chart container */
        .chart-img {
            width: 100%;
            margin: 10px 0 20px;
            border-radius: 6px;
        }

        .side-by-side { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 20px; }
        .side-by-side td { width: 50%; vertical-align: top; }
        .side-by-side td.side-left { padding-right: 8px; }
        .side-by-side td.side-right { padding-left: 8px; }
        .side-cell {
            border: 1px solid #e2e8f0;
            border-top: 2px solid #f59e0b;
            border-radius: 6px;
            background: #ffffff;
            padding: 12px 14px;
        }

        .two-col { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .two-col > tr > td { width: 50%; vertical-align: top; padding-right: 14px; }
        .two-col > tr > td:last-child { padding-right: 0; padding-left: 14px; }

        .no-data { color: #94a3b8; font-style: italic; font-size: 11px; padding: 6px 0; }

        .footer {
            font-size: 10px;
            color: #64748b;
            text-align: center;
            margin-top: 24px;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
        }
    </style>
</head>
<body>

    {{-- =================== COVER PAGE =================== --}}
    <div class="cover">
        <div class="cover-band-top"></div>
        <div class="cover-band-bottom"></div>
        <div class="cover-circle-1"></div>
        <div class="cover-circle-2"></div>
        <div class="cover-circle-3"></div>

        <div class="cover-content">
            <div class="cover-content-inner">

                <div class="cover-badge">Executive Telemetry</div>

                @if($logoDataUri)
                    <div class="cover-logo-wrap">
                        <img class="cover-logo-img" src="{{ $logoDataUri }}">
                    </div>
                @endif
                <div class="cover-tagline">Smart Luxury Travel Intelligence</div>

                <div class="cover-rule"></div>

                <div class="cover-title">Global Platform &amp; Booking Analytics</div>
                <div class="cover-subtitle">Executive Performance Audit &amp; Financial Telemetry Report</div>

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

    {{-- =================== PAGE 2 — Executive Summary =================== --}}
    <div class="page">
        <div class="page-header">
            <div class="page-header-inner">
                @if($logoDataUri)
                    <img class="page-logo-img" src="{{ $logoDataUri }}">
                @endif
                <span class="page-header-title">Executive Summary &amp; Metrics</span>
            </div>
            <div class="page-header-right">
                {{ $from }} — {{ $to }}<br>
                {{ $generatedAt->format('Y-m-d H:i') }}
            </div>
            <div class="page-header-clearfix"></div>
        </div>

        <h2>Executive Key Metrics</h2>

        <table class="kpi-table">
            <tr>
                <td>
                    <div class="kpi-card">
                        <div class="kpi-label">Gross Revenue</div>
                        <div class="kpi-value">${{ number_format($kpis['revenue'] ?? 0, 2) }}</div>
                        <div style="font-size:10px;color:#64748b;margin-top:2px;">{{ $kpis['currency'] ?? 'USD' }}</div>
                    </div>
                </td>
                <td>
                    <div class="kpi-card">
                        <div class="kpi-label">Total Bookings</div>
                        <div class="kpi-value">{{ number_format($kpis['bookings'] ?? 0) }}</div>
                    </div>
                </td>
                <td>
                    <div class="kpi-card">
                        <div class="kpi-label">Active Members</div>
                        <div class="kpi-value">{{ number_format($kpis['users'] ?? 0) }}</div>
                    </div>
                </td>
                <td>
                    <div class="kpi-card">
                        <div class="kpi-label">Revenue Growth</div>
                        <div class="kpi-value {{ ($kpis['growth_percent'] ?? 0) >= 0 ? 'kpi-positive' : 'kpi-negative' }}">
                            {{ ($kpis['growth_percent'] ?? 0) >= 0 ? '+' : '' }}{{ number_format($kpis['growth_percent'] ?? 0, 1) }}%
                        </div>
                    </div>
                </td>
            </tr>
        </table>

        <h3>Summary Telemetry Breakdown</h3>
        <table class="data">
            <thead>
                <tr>
                    <th>Metric Indicator</th>
                    <th>Current Period</th>
                    <th>Previous Period</th>
                    <th>Change</th>
                </tr>
            </thead>
            <tbody>
                @forelse($summaryTable as $row)
                    @php $isMoney = str_contains($row['metric'], 'USD'); @endphp
                    <tr>
                        <td><strong>{{ $row['metric'] }}</strong></td>
                        <td>{{ number_format($row['current'], $isMoney ? 2 : 0) }}</td>
                        <td>{{ number_format($row['previous'], $isMoney ? 2 : 0) }}</td>
                        <td>
                            @if($row['change_percent'] === null)
                                <span class="change-flat">—</span>
                            @else
                                @php
                                    $change = $row['change_percent'];
                                    $changeClass = $change > 0 ? 'change-up' : ($change < 0 ? 'change-down' : 'change-flat');
                                @endphp
                                <span class="{{ $changeClass }}">
                                    {{ $change > 0 ? '+' : '' }}{{ number_format($change, 1) }}%
                                </span>
                            @endif
                        </td>
                    </tr>
                @empty
                    <tr><td colspan="4" class="no-data">No metrics available for this period.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    {{-- =================== PAGE 3 — Revenue by Booking Type =================== --}}
    <div class="page">
        <div class="page-header">
            <div class="page-header-inner">
                @if($logoDataUri)
                    <img class="page-logo-img" src="{{ $logoDataUri }}">
                @endif
                <span class="page-header-title">Revenue by Category</span>
            </div>
            <div class="page-header-right">{{ $from }} — {{ $to }}</div>
            <div class="page-header-clearfix"></div>
        </div>

        <h2>Category Breakdown</h2>

        @if($revenueByTypeChartUrl)
            <img class="chart-img" src="{{ $revenueByTypeChartUrl }}">
        @endif
        <table class="data">
            <thead><tr><th>Category Type</th><th>Gross Revenue (USD)</th></tr></thead>
            <tbody>
                @forelse($revenueByType as $row)
                    <tr>
                        <td><strong>{{ ucfirst($row['type'] ?? 'General Package') }}</strong></td>
                        <td>${{ number_format($row['revenue'] ?? 0, 2) }}</td>
                    </tr>
                @empty
                    <tr><td colspan="2" class="no-data">No category revenue data available.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    {{-- =================== PAGE 4 — Revenue Analytics =================== --}}
    <div class="page">
        <div class="page-header">
            <div class="page-header-inner">
                @if($logoDataUri)
                    <img class="page-logo-img" src="{{ $logoDataUri }}">
                @endif
                <span class="page-header-title">Revenue Trajectory</span>
            </div>
            <div class="page-header-right">{{ $from }} — {{ $to }}</div>
            <div class="page-header-clearfix"></div>
        </div>

        <h2>Revenue Analytics</h2>

        <h3>Monthly Revenue Growth</h3>
        @if($monthlyRevenueChartUrl)
            <img class="chart-img" src="{{ $monthlyRevenueChartUrl }}">
        @else
            <p class="no-data">No monthly revenue data for this period.</p>
        @endif

        <h3>Weekly Revenue Distribution</h3>
        @if($weeklyRevenueChartUrl)
            <img class="chart-img" src="{{ $weeklyRevenueChartUrl }}">
        @else
            <p class="no-data">No weekly revenue data for this period.</p>
        @endif
    </div>

    {{-- =================== PAGE 5 — Booking Analytics =================== --}}
    <div class="page">
        <div class="page-header">
            <div class="page-header-inner">
                @if($logoDataUri)
                    <img class="page-logo-img" src="{{ $logoDataUri }}">
                @endif
                <span class="page-header-title">Booking Analytics</span>
            </div>
            <div class="page-header-right">{{ $from }} — {{ $to }}</div>
            <div class="page-header-clearfix"></div>
        </div>

        <h2>Booking Analytics</h2>

        <h3>Bookings Trend</h3>
        @if($bookingsTrendChartUrl)
            <img class="chart-img" src="{{ $bookingsTrendChartUrl }}">
        @else
            <p class="no-data">No booking trend data for this period.</p>
        @endif

        <table class="side-by-side">
            <tr>
                <td class="side-left">
                    <div class="side-cell">
                        <h3>Booking Status Breakdown</h3>
                        @if($bookingStatusChartUrl)
                            <img class="chart-img" src="{{ $bookingStatusChartUrl }}">
                        @endif
                        <table class="data">
                            <thead><tr><th>Status</th><th>Count</th></tr></thead>
                            <tbody>
                                @forelse($bookingStatus as $row)
                                    <tr><td>{{ ucfirst($row['status']) }}</td><td>{{ $row['count'] }}</td></tr>
                                @empty
                                    <tr><td colspan="2" class="no-data">No status data available.</td></tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                </td>
                <td class="side-right">
                    <div class="side-cell">
                        <h3>Booking Types Breakdown</h3>
                        @if($bookingTypesChartUrl)
                            <img class="chart-img" src="{{ $bookingTypesChartUrl }}">
                        @endif
                        <table class="data">
                            <thead><tr><th>Type</th><th>Count</th></tr></thead>
                            <tbody>
                                @forelse($bookingTypes as $row)
                                    <tr><td>{{ $row['type'] }}</td><td>{{ $row['count'] }}</td></tr>
                                @empty
                                    <tr><td colspan="2" class="no-data">No type data available.</td></tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    {{-- =================== PAGE 6 — User Analytics =================== --}}
    <div class="page">
        <div class="page-header">
            <div class="page-header-inner">
                @if($logoDataUri)
                    <img class="page-logo-img" src="{{ $logoDataUri }}">
                @endif
                <span class="page-header-title">User Analytics &amp; Growth</span>
            </div>
            <div class="page-header-right">{{ $from }} — {{ $to }}</div>
            <div class="page-header-clearfix"></div>
        </div>

        <h2>User Analytics</h2>

        <h3>New User Registrations</h3>
        @if($newUsersChartUrl)
            <img class="chart-img" src="{{ $newUsersChartUrl }}">
        @else
            <p class="no-data">No new user data for this period.</p>
        @endif

        <h3>Active User Trajectory</h3>
        @if($activeUsersChartUrl)
            <img class="chart-img" src="{{ $activeUsersChartUrl }}">
        @else
            <p class="no-data">No active user data for this period.</p>
        @endif
    </div>

    {{-- =================== PAGE 7 — Returning Users =================== --}}
    <div class="page">
        <div class="page-header">
            <div class="page-header-inner">
                @if($logoDataUri)
                    <img class="page-logo-img" src="{{ $logoDataUri }}">
                @endif
                <span class="page-header-title">Returning User Engagement</span>
            </div>
            <div class="page-header-right">{{ $from }} — {{ $to }}</div>
            <div class="page-header-clearfix"></div>
        </div>

        <h2>Returning Users</h2>

        <h3>Returning Users by Period</h3>
        <table class="data">
            <thead><tr><th>Period Range</th><th>Returning User Count</th></tr></thead>
            <tbody>
                @forelse($returningUsersTrend as $row)
                    <tr><td>{{ $row['period'] }}</td><td>{{ $row['returning_users'] }}</td></tr>
                @empty
                    <tr><td colspan="2" class="no-data">No returning user data for this period.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    {{-- =================== PAGE 8 — Business Insights =================== --}}
    <div class="page">
        <div class="page-header">
            <div class="page-header-inner">
                @if($logoDataUri)
                    <img class="page-logo-img" src="{{ $logoDataUri }}">
                @endif
                <span class="page-header-title">Market Demand &amp; Insights</span>
            </div>
            <div class="page-header-right">{{ $from }} — {{ $to }}</div>
            <div class="page-header-clearfix"></div>
        </div>

        <h2>Business Insights</h2>

        <table class="two-col">
            <tr>
                <td>
                    <h3>Top Destinations by Bookings</h3>
                    @if($topDestinationsChartUrl)
                        <img class="chart-img" src="{{ $topDestinationsChartUrl }}">
                    @endif
                    <table class="data">
                        <thead><tr><th>Destination</th><th>Bookings</th></tr></thead>
                        <tbody>
                            @forelse($topDestinations as $row)
                                <tr><td>{{ $row->name }}</td><td>{{ $row->bookings_count }}</td></tr>
                            @empty
                                <tr><td colspan="2" class="no-data">No destination data.</td></tr>
                            @endforelse
                        </tbody>
                    </table>
                </td>
                <td>
                    <h3>Top Destinations by Revenue</h3>
                    <table class="data">
                        <thead><tr><th>Destination</th><th>Revenue (USD)</th></tr></thead>
                        <tbody>
                            @forelse($topRevenueDestinations as $row)
                                <tr><td>{{ $row['name'] }}</td><td>${{ number_format($row['revenue'], 2) }}</td></tr>
                            @empty
                                <tr><td colspan="2" class="no-data">No destination revenue data.</td></tr>
                            @endforelse
                        </tbody>
                    </table>
                </td>
            </tr>
        </table>

        <h3>Peak Operating Hours / Days</h3>
        @if($peakBookingDaysChartUrl)
            <img class="chart-img" src="{{ $peakBookingDaysChartUrl }}">
        @else
            <p class="no-data">No peak booking data for this period.</p>
        @endif

        <div class="footer">
            Itinera Platform &mdash; Confidential Executive Audit Report &mdash; Generated {{ $generatedAt->format('Y-m-d H:i') }} UTC
        </div>
    </div>

</body>
</html>
