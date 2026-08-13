<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Booking Report — {{ config('app.name', 'Voyago') }}</title>
    <style>
        /* ── Palette ─────────────────────────────────────────────────────────
           Navy #0F2854 | Royal Blue #1C4D8D | Sky Blue #4988C4 | Ice Blue #BDE8F5
        ─────────────────────────────────────────────────────────────────────── */

        @page         { margin: 0; }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #1a2a4a;
            background: #ffffff;
        }

        /* Page breaks */
        .page { page-break-after: always; padding: 28px 32px; box-sizing: border-box; }
        .page:last-child { page-break-after: auto; }

        /* ── COVER PAGE ─────────────────────────────────────────────────────── */
        .cover {
            page: cover;
            width: 100%;
            height: 100vh;
            background-color: #0F2854;
            position: relative;
            overflow: hidden;
        }

        /* Top diagonal band */
        .cover-band-top {
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 8px;
            background: #BDE8F5;
        }

        /* Bottom diagonal band */
        .cover-band-bottom {
            position: absolute;
            bottom: 0; left: 0; right: 0;
            height: 6px;
            background: #4988C4;
        }

        /* Large background circle decorations */
        .cover-circle-1 {
            position: absolute;
            top: -80px; right: -80px;
            width: 340px; height: 340px;
            border-radius: 50%;
            background: rgba(73, 136, 196, 0.18);
        }
        .cover-circle-2 {
            position: absolute;
            bottom: 80px; left: -60px;
            width: 240px; height: 240px;
            border-radius: 50%;
            background: rgba(189, 232, 245, 0.10);
        }
        .cover-circle-3 {
            position: absolute;
            top: 50%; right: 60px;
            width: 120px; height: 120px;
            border-radius: 50%;
            background: rgba(28, 77, 141, 0.40);
        }

        /* Content area positioned in vertical centre */
        .cover-content {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            padding: 0 60px;
            display: table;
            width: 100%;
            box-sizing: border-box;
        }
        .cover-content-inner {
            display: table-cell;
            vertical-align: middle;
        }

        /* Logo wordmark */
        .cover-logo {
            font-size: 42px;
            font-weight: bold;
            color: #ffffff;
            letter-spacing: -0.03em;
            margin-bottom: 4px;
        }
        .cover-logo span {
            color: #BDE8F5;
        }

        /* Tagline under logo */
        .cover-tagline {
            font-size: 11px;
            color: #9dc4e8;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            margin-bottom: 40px;
        }

        /* Horizontal rule */
        .cover-rule {
            width: 80px;
            height: 3px;
            background: #4988C4;
            margin-bottom: 32px;
        }

        /* Report title */
        .cover-title {
            font-size: 28px;
            font-weight: bold;
            color: #ffffff;
            margin-bottom: 8px;
            line-height: 1.2;
        }

        .cover-subtitle {
            font-size: 14px;
            color: #BDE8F5;
            margin-bottom: 48px;
        }

        /* Meta card */
        .cover-meta {
            background: rgba(255,255,255,0.08);
            border-left: 3px solid #4988C4;
            border-radius: 4px;
            padding: 16px 20px;
            display: inline-block;
        }
        .cover-meta-row {
            font-size: 11px;
            color: #9dc4e8;
            margin-bottom: 6px;
        }
        .cover-meta-row:last-child { margin-bottom: 0; }
        .cover-meta-label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #4988C4;
            margin-bottom: 2px;
        }
        .cover-meta-value {
            font-size: 12px;
            color: #ffffff;
            font-weight: bold;
        }

        /* ── INNER PAGES header strip ───────────────────────────────────────── */
        .page-header {
            background: #0F2854;
            margin: -28px -32px 0 -32px;
            padding: 10px 32px;
            overflow: hidden;
        }
        .page-header-inner {
            float: left;
        }
        .page-header-logo {
            font-size: 14px;
            font-weight: bold;
            color: #BDE8F5;
            letter-spacing: -0.01em;
        }
        .page-header-title {
            font-size: 9px;
            color: #4988C4;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }
        .page-header-right {
            float: right;
            text-align: right;
            font-size: 9px;
            color: #4988C4;
            padding-top: 4px;
        }
        .page-header-clearfix { clear: both; }
        .page-accent-line {
            height: 2px;
            background: #4988C4;
            margin: 0 -32px 20px -32px;
        }

        /* Section headings */
        h2 {
            font-size: 15px;
            margin: 0 0 14px;
            color: #ffffff;
            background: #1C4D8D;
            padding: 9px 14px;
            border-radius: 4px;
        }
        h3 {
            font-size: 12px;
            margin: 18px 0 8px;
            color: #1C4D8D;
            border-bottom: 1px solid #BDE8F5;
            padding-bottom: 4px;
        }

        /* KPI cards */
        .kpi-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .kpi-table td {
            width: 25%;
            padding: 14px 10px;
            text-align: center;
            vertical-align: top;
            border: 2px solid #BDE8F5;
            background: #f0f7ff;
            border-radius: 4px;
        }
        .kpi-label { font-size: 9px; color: #4988C4; text-transform: uppercase; letter-spacing: 0.06em; }
        .kpi-value { font-size: 19px; font-weight: bold; margin-top: 5px; color: #0F2854; }
        .kpi-positive { color: #047857; }
        .kpi-negative { color: #b91c1c; }

        /* Data tables */
        table.data { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
        table.data thead tr { background: #0F2854; }
        table.data th {
            color: #BDE8F5;
            padding: 7px 10px;
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        table.data td { padding: 6px 10px; border-bottom: 1px solid #dbeafe; color: #1a2a4a; }
        table.data tr:nth-child(even) td { background: #f0f7ff; }
        table.data tr:last-child td { border-bottom: none; }

        /* Charts */
        .chart-img { width: 100%; max-width: 460px; margin: 8px 0 16px; }

        /* Two-column layout */
        .two-col { width: 100%; border-collapse: collapse; }
        .two-col > tr > td { width: 50%; vertical-align: top; padding-right: 10px; }
        .two-col > tr > td:last-child { padding-right: 0; padding-left: 10px; }

        /* No-data placeholder */
        .no-data { color: #9ca3af; font-style: italic; font-size: 11px; padding: 8px 0; }

        /* Footer */
        .footer {
            font-size: 9px;
            color: #4988C4;
            text-align: center;
            margin-top: 28px;
            border-top: 1px solid #BDE8F5;
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

                {{-- Logo --}}
                <div class="cover-logo">
                    Iti<span>nari</span>
                </div>
                <div class="cover-tagline">Smart Travel Intelligence</div>

                <div class="cover-rule"></div>

                {{-- Report Title --}}
                <div class="cover-title">Business Analytics<br>Report</div>
                <div class="cover-subtitle">Comprehensive Booking &amp; Revenue Overview</div>

                {{-- Meta --}}
                <div class="cover-meta">
                    <table style="border-collapse:collapse;">
                        <tr>
                            <td style="padding: 0 32px 0 0; vertical-align: top;">
                                <div class="cover-meta-label">Report Period</div>
                                <div class="cover-meta-value">{{ $from }} — {{ $to }}</div>
                            </td>
                            <td style="padding: 0 32px 0 0; vertical-align: top;">
                                <div class="cover-meta-label">Generated</div>
                                <div class="cover-meta-value">{{ $generatedAt->format('M d, Y') }}</div>
                            </td>
                            <td style="vertical-align: top;">
                                <div class="cover-meta-label">Classification</div>
                                <div class="cover-meta-value">Confidential</div>
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
                <div class="page-header-logo">Itinari</div>
                <div class="page-header-title">Business Analytics Report</div>
            </div>
            <div class="page-header-right">
                {{ $from }} — {{ $to }}<br>
                {{ $generatedAt->format('Y-m-d H:i') }}
            </div>
            <div class="page-header-clearfix"></div>
        </div>
        <div class="page-accent-line"></div>

        <h2>Executive Summary</h2>

        <table class="kpi-table">
            <tr>
                <td>
                    <div class="kpi-label">Revenue</div>
                    <div class="kpi-value">{{ number_format($kpis['revenue'], 0) }}</div>
                    <div style="font-size:9px;color:#4988C4;margin-top:2px;">{{ $kpis['currency'] ?? 'USD' }}</div>
                </td>
                <td>
                    <div class="kpi-label">Bookings</div>
                    <div class="kpi-value">{{ number_format($kpis['bookings']) }}</div>
                </td>
                <td>
                    <div class="kpi-label">Active Users</div>
                    <div class="kpi-value">{{ number_format($kpis['users']) }}</div>
                </td>
                <td>
                    <div class="kpi-label">Revenue Growth</div>
                    <div class="kpi-value {{ $kpis['growth_percent'] >= 0 ? 'kpi-positive' : 'kpi-negative' }}">
                        {{ $kpis['growth_percent'] >= 0 ? '+' : '' }}{{ number_format($kpis['growth_percent'], 1) }}%
                    </div>
                </td>
            </tr>
        </table>
    </div>

    {{-- =================== PAGE 3 — Revenue Analytics =================== --}}
    <div class="page">
        <div class="page-header">
            <div class="page-header-inner">
                <div class="page-header-logo">Itinari</div>
                <div class="page-header-title">Revenue Analytics</div>
            </div>
            <div class="page-header-right">{{ $from }} — {{ $to }}</div>
            <div class="page-header-clearfix"></div>
        </div>
        <div class="page-accent-line"></div>

        <h2>Revenue Analytics</h2>

        <h3>Monthly Revenue</h3>
        @if($monthlyRevenueChartUrl)
            <img class="chart-img" src="{{ $monthlyRevenueChartUrl }}">
        @else
            <p class="no-data">No monthly revenue data for this period.</p>
        @endif

        <h3>Weekly Revenue</h3>
        @if($weeklyRevenueChartUrl)
            <img class="chart-img" src="{{ $weeklyRevenueChartUrl }}">
        @else
            <p class="no-data">No weekly revenue data for this period.</p>
        @endif

        <h3>Revenue by Booking Type</h3>
        @if($revenueByTypeChartUrl)
            <img class="chart-img" src="{{ $revenueByTypeChartUrl }}">
        @endif
        <table class="data">
            <thead><tr><th>Type</th><th>Revenue (USD)</th></tr></thead>
            <tbody>
                @forelse($revenueByType as $row)
                    <tr>
                        <td>{{ $row['type'] }}</td>
                        <td>{{ number_format($row['revenue'], 2) }}</td>
                    </tr>
                @empty
                    <tr><td colspan="2" class="no-data">No data available.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    {{-- =================== PAGE 4 — Booking Analytics =================== --}}
    <div class="page">
        <div class="page-header">
            <div class="page-header-inner">
                <div class="page-header-logo">Itinari</div>
                <div class="page-header-title">Booking Analytics</div>
            </div>
            <div class="page-header-right">{{ $from }} — {{ $to }}</div>
            <div class="page-header-clearfix"></div>
        </div>
        <div class="page-accent-line"></div>

        <h2>Booking Analytics</h2>

        <h3>Bookings Trend</h3>
        @if($bookingsTrendChartUrl)
            <img class="chart-img" src="{{ $bookingsTrendChartUrl }}">
        @else
            <p class="no-data">No booking trend data for this period.</p>
        @endif

        <table class="two-col">
            <tr>
                <td>
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
                                <tr><td colspan="2" class="no-data">No data available.</td></tr>
                            @endforelse
                        </tbody>
                    </table>
                </td>
                <td>
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
                                <tr><td colspan="2" class="no-data">No data available.</td></tr>
                            @endforelse
                        </tbody>
                    </table>
                </td>
            </tr>
        </table>
    </div>

    {{-- =================== PAGE 5 — User Analytics =================== --}}
    <div class="page">
        <div class="page-header">
            <div class="page-header-inner">
                <div class="page-header-logo">Itinari</div>
                <div class="page-header-title">User Analytics</div>
            </div>
            <div class="page-header-right">{{ $from }} — {{ $to }}</div>
            <div class="page-header-clearfix"></div>
        </div>
        <div class="page-accent-line"></div>

        <h2>User Analytics</h2>

        <h3>New Users</h3>
        @if($newUsersChartUrl)
            <img class="chart-img" src="{{ $newUsersChartUrl }}">
        @else
            <p class="no-data">No new user data for this period.</p>
        @endif

        <h3>Active Users Trend</h3>
        @if($activeUsersChartUrl)
            <img class="chart-img" src="{{ $activeUsersChartUrl }}">
        @else
            <p class="no-data">No active user data for this period.</p>
        @endif

        <h3>Returning Users</h3>
        <table class="data">
            <thead><tr><th>Period</th><th>Returning Users</th></tr></thead>
            <tbody>
                @forelse($returningUsersTrend as $row)
                    <tr><td>{{ $row['period'] }}</td><td>{{ $row['returning_users'] }}</td></tr>
                @empty
                    <tr><td colspan="2" class="no-data">No returning user data for this period.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    {{-- =================== PAGE 6 — Business Insights =================== --}}
    <div class="page">
        <div class="page-header">
            <div class="page-header-inner">
                <div class="page-header-logo">Itinari</div>
                <div class="page-header-title">Business Insights</div>
            </div>
            <div class="page-header-right">{{ $from }} — {{ $to }}</div>
            <div class="page-header-clearfix"></div>
        </div>
        <div class="page-accent-line"></div>

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
                                <tr><td colspan="2" class="no-data">No data available.</td></tr>
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
                                <tr><td>{{ $row['name'] }}</td><td>{{ number_format($row['revenue'], 2) }}</td></tr>
                            @empty
                                <tr><td colspan="2" class="no-data">No data available.</td></tr>
                            @endforelse
                        </tbody>
                    </table>
                </td>
            </tr>
        </table>

        <h3>Peak Booking Days</h3>
        @if($peakBookingDaysChartUrl)
            <img class="chart-img" src="{{ $peakBookingDaysChartUrl }}">
        @else
            <p class="no-data">No booking data for this period.</p>
        @endif

        <div class="footer">
            {{ config('app.name', 'Voyago') }} &mdash; Confidential Report &mdash; Generated {{ $generatedAt->format('Y-m-d H:i') }}
        </div>
    </div>

</body>
</html>
