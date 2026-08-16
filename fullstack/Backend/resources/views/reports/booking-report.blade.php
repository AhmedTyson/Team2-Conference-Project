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
            font-size: 13px;
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
            height: 297mm;
            background-color: #0F2854;
            position: relative;
            overflow: hidden;
            page-break-after: always;
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
            top: 259pt;
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
            color: #BDE8F5;
        }

        /* Logo image on the navy cover (transparent, no box) */
        .cover-logo-wrap {
            text-align: center;
            margin-bottom: 18px;
        }
        .cover-logo-img {
            height: 64px;
        }

        /* Admin report badge */
        .cover-badge {
            display: inline-block;
            font-size: 10px;
            font-weight: bold;
            color: #0F2854;
            background: #BDE8F5;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            padding: 7px 16px;
            border-radius: 999px;
            margin-bottom: 28px;
        }

        /* Tagline under logo */
        .cover-tagline {
            font-size: 11px;
            color: #9dc4e8;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            margin-bottom: 20px;
        }

        /* Horizontal rule */
        .cover-rule {
            width: 80px;
            height: 3px;
            background: #4988C4;
            margin: 0 auto 32px;
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
            padding: 14px 32px;
            overflow: hidden;
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
            color: #BDE8F5;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            vertical-align: middle;
        }
        .page-header-right {
            float: right;
            text-align: right;
            font-size: 10px;
            color: #4988C4;
            padding-top: 5px;
        }
        .page-header-clearfix { clear: both; }
        .page-accent-line {
            height: 2px;
            background: #4988C4;
            margin: 0 -32px 20px -32px;
        }

        /* Section headings */
        h2 {
            font-size: 19px;
            margin: 0 0 18px;
            color: #ffffff;
            background: #1C4D8D;
            padding: 12px 18px;
            border-radius: 4px;
        }
        h3 {
            font-size: 15px;
            margin: 18px 0 12px;
            color: #1C4D8D;
            border-bottom: 1px solid #BDE8F5;
            padding-bottom: 5px;
        }

        /* KPI cards */
        .kpi-table { width: 100%; border-collapse: collapse; margin-bottom: 26px; }
        .kpi-table td {
            width: 25%;
            padding: 18px 14px;
            text-align: center;
            vertical-align: top;
            border: 2px solid #BDE8F5;
            background: #f0f7ff;
            border-radius: 4px;
        }
        .kpi-label { font-size: 11px; color: #4988C4; text-transform: uppercase; letter-spacing: 0.06em; }
        .kpi-value { font-size: 24px; font-weight: bold; margin-top: 6px; color: #0F2854; }
        .kpi-positive { color: #047857; }
        .kpi-negative { color: #b91c1c; }

        /* Data tables */
        table.data { width: 100%; border-collapse: collapse; margin-bottom: 22px; font-size: 12.5px; }
        table.data thead tr { background: #0F2854; }
        table.data th {
            color: #BDE8F5;
            padding: 9px 12px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        table.data td { padding: 8px 12px; border-bottom: 1px solid #dbeafe; color: #1a2a4a; }
        table.data tr:nth-child(even) td { background: #f0f7ff; }
        table.data tr:last-child td { border-bottom: none; }

        /* Charts */
        .chart-img { width: 100%; margin: 12px 0 22px; }

        /* Two-column layout */
        .two-col { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .two-col > tr > td { width: 50%; vertical-align: top; padding-right: 14px; }
        .two-col > tr > td:last-child { padding-right: 0; padding-left: 14px; }

        /* Equal-height side-by-side columns */
        .side-by-side { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 22px; }
        .side-by-side td { width: 50%; vertical-align: top; }
        .side-by-side td.side-left { padding-right: 7px; }
        .side-by-side td.side-right { padding-left: 7px; }
        .side-cell {
            border: 1px solid #dbeafe;
            border-radius: 4px;
            background: #fbfdff;
            padding: 12px 16px 14px;
            page-break-inside: avoid;
        }
        .side-cell h3 { margin-top: 4px; }
        .side-cell table.data { font-size: 12px; }
        .side-cell table.data td { padding: 6px 8px; }

        /* Keep table rows intact across page breaks */
        table.data tr { page-break-inside: avoid; }

        /* Metric change badges */
        .change-up { color: #047857; font-weight: bold; }
        .change-down { color: #b91c1c; font-weight: bold; }
        .change-flat { color: #6b7280; }

        /* No-data placeholder */
        .no-data { color: #9ca3af; font-style: italic; font-size: 11px; padding: 8px 0; }

        /* Footer */
        .footer {
            font-size: 10px;
            color: #4988C4;
            text-align: center;
            margin-top: 20px;
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

                {{-- Admin badge --}}
                <div class="cover-badge">Admin Report</div>

                {{-- Logo --}}
                @if($logoDataUri)
                    <div class="cover-logo-wrap">
                        <img class="cover-logo-img" src="{{ $logoDataUri }}">
                    </div>
                @else
                    <div class="cover-logo">
                        Iti<span>nari</span>
                    </div>
                @endif
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
                @if($logoDataUri)
                    <img class="page-logo-img" src="{{ $logoDataUri }}">
                @else
                    <span class="page-header-title">Itinari</span>
                @endif
                <span class="page-header-title">Business Analytics Report</span>
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
                    <div style="font-size:10px;color:#4988C4;margin-top:2px;">{{ $kpis['currency'] ?? 'USD' }}</div>
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

        <h3>Key Metrics Analysis</h3>
        <table class="data">
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Current Period</th>
                    <th>Previous Period</th>
                    <th>Change</th>
                </tr>
            </thead>
            <tbody>
                @forelse($summaryTable as $row)
                    @php $isMoney = str_contains($row['metric'], 'USD'); @endphp
                    <tr>
                        <td>{{ $row['metric'] }}</td>
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
                @else
                    <span class="page-header-title">Itinari</span>
                @endif
                <span class="page-header-title">Business Analytics Report</span>
            </div>
            <div class="page-header-right">{{ $from }} — {{ $to }}</div>
            <div class="page-header-clearfix"></div>
        </div>
        <div class="page-accent-line"></div>

        <h2>Revenue by Booking Type</h2>

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

    {{-- =================== PAGE 4 — Revenue Analytics =================== --}}
    <div class="page">
        <div class="page-header">
            <div class="page-header-inner">
                @if($logoDataUri)
                    <img class="page-logo-img" src="{{ $logoDataUri }}">
                @else
                    <span class="page-header-title">Itinari</span>
                @endif
                <span class="page-header-title">Business Analytics Report</span>
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
    </div>

    {{-- =================== PAGE 5 — Booking Analytics =================== --}}
    <div class="page">
        <div class="page-header">
            <div class="page-header-inner">
                @if($logoDataUri)
                    <img class="page-logo-img" src="{{ $logoDataUri }}">
                @else
                    <span class="page-header-title">Itinari</span>
                @endif
                <span class="page-header-title">Business Analytics Report</span>
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
                                    <tr><td colspan="2" class="no-data">No data available.</td></tr>
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
                                    <tr><td colspan="2" class="no-data">No data available.</td></tr>
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
                @else
                    <span class="page-header-title">Itinari</span>
                @endif
                <span class="page-header-title">Business Analytics Report</span>
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
    </div>

    {{-- =================== PAGE 7 — Returning Users =================== --}}
    <div class="page">
        <div class="page-header">
            <div class="page-header-inner">
                @if($logoDataUri)
                    <img class="page-logo-img" src="{{ $logoDataUri }}">
                @else
                    <span class="page-header-title">Itinari</span>
                @endif
                <span class="page-header-title">Business Analytics Report</span>
            </div>
            <div class="page-header-right">{{ $from }} — {{ $to }}</div>
            <div class="page-header-clearfix"></div>
        </div>
        <div class="page-accent-line"></div>

        <h2>Returning Users</h2>

        <h3>Returning Users by Period</h3>
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

    {{-- =================== PAGE 8 — Business Insights =================== --}}
    <div class="page">
        <div class="page-header">
            <div class="page-header-inner">
                @if($logoDataUri)
                    <img class="page-logo-img" src="{{ $logoDataUri }}">
                @else
                    <span class="page-header-title">Itinari</span>
                @endif
                <span class="page-header-title">Business Analytics Report</span>
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
