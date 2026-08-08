<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Booking Report</title>
    <style>
        @page { margin: 28px 32px; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1a1a1a; }

        .page { page-break-after: always; }
        .page:last-child { page-break-after: auto; }

        h1 { font-size: 20px; margin: 0 0 4px; }
        h2 { font-size: 16px; margin: 0 0 12px; border-bottom: 2px solid #42a5f5; padding-bottom: 6px; }
        h3 { font-size: 13px; margin: 18px 0 8px; color: #333; }

        .subtitle { color: #666; font-size: 11px; margin-bottom: 20px; }

        .kpi-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .kpi-table td {
            width: 25%;
            padding: 14px;
            border: 1px solid #ddd;
            text-align: center;
            vertical-align: top;
        }
        .kpi-label { font-size: 10px; color: #777; text-transform: uppercase; }
        .kpi-value { font-size: 20px; font-weight: bold; margin-top: 4px; }
        .kpi-positive { color: #2e7d32; }
        .kpi-negative { color: #c62828; }

        table.data { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        table.data th, table.data td {
            border: 1px solid #ddd;
            padding: 6px 8px;
            text-align: left;
            font-size: 11px;
        }
        table.data th { background: #f5f5f5; }

        .chart-img { width: 100%; max-width: 460px; margin: 8px 0 18px; }
        .two-col td { width: 50%; vertical-align: top; padding: 0 8px 0 0; }

        .footer { font-size: 9px; color: #999; text-align: center; margin-top: 24px; }
    </style>
</head>
<body>

    {{-- =================== PAGE 1 — Executive Summary =================== --}}
    <div class="page">
        <h1>Booking Report</h1>
        <div class="subtitle">
            Period: {{ $from }} &mdash; {{ $to }} &nbsp;|&nbsp; Generated: {{ $generatedAt->format('Y-m-d H:i') }}
        </div>

        <h2>Executive Summary</h2>

        <table class="kpi-table">
            <tr>
                <td>
                    <div class="kpi-label">Revenue</div>
                    <div class="kpi-value">{{ number_format($kpis['revenue'], 2) }} {{ $kpis['currency'] ?? 'EGP' }}</div>
                </td>
                <td>
                    <div class="kpi-label">Bookings</div>
                    <div class="kpi-value">{{ number_format($kpis['bookings']) }}</div>
                </td>
                <td>
                    <div class="kpi-label">Users</div>
                    <div class="kpi-value">{{ number_format($kpis['users']) }}</div>
                </td>
                <td>
                    <div class="kpi-label">Growth</div>
                    <div class="kpi-value {{ $kpis['growth_percent'] >= 0 ? 'kpi-positive' : 'kpi-negative' }}">
                        {{ $kpis['growth_percent'] >= 0 ? '+' : '' }}{{ number_format($kpis['growth_percent'], 1) }}%
                    </div>
                </td>
            </tr>
        </table>
    </div>

    {{-- =================== PAGE 2 — Revenue Analytics =================== --}}
    <div class="page">
        <h2>Revenue Analytics</h2>

        <h3>Monthly Revenue</h3>
        @if($monthlyRevenueChartUrl)
            <img class="chart-img" src="{{ $monthlyRevenueChartUrl }}">
        @else
            <p>No revenue data for this period.</p>
        @endif

        <h3>Weekly Revenue</h3>
        @if($weeklyRevenueChartUrl)
            <img class="chart-img" src="{{ $weeklyRevenueChartUrl }}">
        @else
            <p>No revenue data for this period.</p>
        @endif

        <h3>Revenue by Booking Type</h3>
        @if($revenueByTypeChartUrl)
            <img class="chart-img" src="{{ $revenueByTypeChartUrl }}">
        @endif
        <table class="data">
            <tr><th>Type</th><th>Revenue</th></tr>
            @forelse($revenueByType as $row)
                <tr>
                    <td>{{ $row['type'] }}</td>
                    <td>{{ number_format($row['revenue'], 2) }}</td>
                </tr>
            @empty
                <tr><td colspan="2">No data available.</td></tr>
            @endforelse
        </table>
    </div>

    {{-- =================== PAGE 3 — Booking Analytics =================== --}}
    <div class="page">
        <h2>Booking Analytics</h2>

        <h3>Bookings Trend</h3>
        @if($bookingsTrendChartUrl)
            <img class="chart-img" src="{{ $bookingsTrendChartUrl }}">
        @else
            <p>No booking data for this period.</p>
        @endif

        <table class="two-col">
            <tr>
                <td>
                    <h3>Booking Status</h3>
                    @if($bookingStatusChartUrl)
                        <img class="chart-img" src="{{ $bookingStatusChartUrl }}">
                    @endif
                    <table class="data">
                        <tr><th>Status</th><th>Count</th></tr>
                        @forelse($bookingStatus as $row)
                            <tr><td>{{ ucfirst($row['status']) }}</td><td>{{ $row['count'] }}</td></tr>
                        @empty
                            <tr><td colspan="2">No data available.</td></tr>
                        @endforelse
                    </table>
                </td>
                <td>
                    <h3>Booking Types</h3>
                    @if($bookingTypesChartUrl)
                        <img class="chart-img" src="{{ $bookingTypesChartUrl }}">
                    @endif
                    <table class="data">
                        <tr><th>Type</th><th>Count</th></tr>
                        @forelse($bookingTypes as $row)
                            <tr><td>{{ $row['type'] }}</td><td>{{ $row['count'] }}</td></tr>
                        @empty
                            <tr><td colspan="2">No data available.</td></tr>
                        @endforelse
                    </table>
                </td>
            </tr>
        </table>
    </div>

    {{-- =================== PAGE 4 — User Analytics =================== --}}
    <div class="page">
        <h2>User Analytics</h2>

        <h3>New Users</h3>
        @if($newUsersChartUrl)
            <img class="chart-img" src="{{ $newUsersChartUrl }}">
        @else
            <p>No new users in this period.</p>
        @endif

        <h3>Active Users</h3>
        @if($activeUsersChartUrl)
            <img class="chart-img" src="{{ $activeUsersChartUrl }}">
        @else
            <p>No active users in this period.</p>
        @endif

        <h3>Returning Users</h3>
        <table class="data">
            <tr><th>Period</th><th>Returning Users</th></tr>
            @forelse($returningUsersTrend as $row)
                <tr><td>{{ $row['period'] }}</td><td>{{ $row['returning_users'] }}</td></tr>
            @empty
                <tr><td colspan="2">No returning users in this period.</td></tr>
            @endforelse
        </table>
    </div>

    {{-- =================== PAGE 5 — Business Insights =================== --}}
    <div class="page">
        <h2>Business Insights</h2>

        <table class="two-col">
            <tr>
                <td>
                    <h3>Top Destinations</h3>
                    @if($topDestinationsChartUrl)
                        <img class="chart-img" src="{{ $topDestinationsChartUrl }}">
                    @endif
                    <table class="data">
                        <tr><th>Destination</th><th>Bookings</th></tr>
                        @forelse($topDestinations as $row)
                            <tr><td>{{ $row->name }}</td><td>{{ $row->bookings_count }}</td></tr>
                        @empty
                            <tr><td colspan="2">No data available.</td></tr>
                        @endforelse
                    </table>
                </td>
                <td>
                    <h3>Top Revenue Destinations</h3>
                    <table class="data">
                        <tr><th>Destination</th><th>Revenue</th></tr>
                        @forelse($topRevenueDestinations as $row)
                            <tr><td>{{ $row['name'] }}</td><td>{{ number_format($row['revenue'], 2) }}</td></tr>
                        @empty
                            <tr><td colspan="2">No data available.</td></tr>
                        @endforelse
                    </table>
                </td>
            </tr>
        </table>

        <h3>Peak Booking Days</h3>
        @if($peakBookingDaysChartUrl)
            <img class="chart-img" src="{{ $peakBookingDaysChartUrl }}">
        @else
            <p>No booking data for this period.</p>
        @endif

        <div class="footer">Generated automatically &mdash; {{ $generatedAt->format('Y-m-d H:i') }}</div>
    </div>

</body>
</html>