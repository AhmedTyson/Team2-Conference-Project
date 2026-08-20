<?php

namespace App\Http\Controllers\Commerce;

use App\Enums\TripStatus;
use App\Http\Controllers\Controller;
use App\Models\Account\User;
use App\Models\Trips\Trip;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AdminAnalyticsController extends Controller
{
    /**
     * Get Revenue Statistics & Detailed Analytics (filtered by period).
     * GET /api/v1/admin/analytics/revenue?period=30d
     */
    public function revenue(Request $request): JsonResponse
    {
        $period = $request->query('period', '30d');
        $validStatuses = [
            TripStatus::BOOKED->value,
            TripStatus::COMPLETED->value,
            TripStatus::PLANNED->value,
            TripStatus::PLANNING->value,
            TripStatus::PENDING->value,
        ];

        $userId = $request->user()?->id ?? 'guest';
        Cache::forget("admin:analytics:revenue:{$userId}");

        [$since, $prevSince, $prevUntil] = $this->resolvePeriodDates($period);

        // Current period revenue & bookings
        $currentQuery = Trip::whereIn('status', $validStatuses);
        if ($since) {
            $currentQuery->where('created_at', '>=', $since);
        }
        $totalRevenue = (float) $currentQuery->sum(DB::raw('COALESCE(estimated_cost, budget)'));
        $totalBookings = (int) $currentQuery->count();
        $averageBookingValue = $totalBookings > 0 ? round($totalRevenue / $totalBookings, 2) : 0;

        // Previous period revenue & bookings for delta calculation
        $prevRevenue = 0;
        $prevBookings = 0;
        if ($prevSince && $prevUntil) {
            $prevQuery = Trip::whereIn('status', $validStatuses)
                ->whereBetween('created_at', [$prevSince, $prevUntil]);
            $prevRevenue = (float) $prevQuery->sum(DB::raw('COALESCE(estimated_cost, budget)'));
            $prevBookings = (int) $prevQuery->count();
        }

        $revenueDelta = $this->calculateDelta($prevRevenue, $totalRevenue);
        $bookingsDelta = $this->calculateDelta($prevBookings, $totalBookings);

        // Monthly / Period Revenue breakdown
        $monthlyRevenue = Trip::whereIn('status', $validStatuses)
            ->when($since, fn ($q) => $q->where('created_at', '>=', $since))
            ->selectRaw(match (DB::getDriverName()) {
                'pgsql' => "to_char(created_at, 'YYYY-MM') as month, SUM(COALESCE(estimated_cost, budget)) as total",
                'sqlite' => "strftime('%Y-%m', created_at) as month, SUM(COALESCE(estimated_cost, budget)) as total",
                default => "DATE_FORMAT(created_at, '%Y-%m') as month, SUM(COALESCE(estimated_cost, budget)) as total",
            })
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('total', 'month')
            ->map(fn ($val) => (float) $val);

        // Revenue by Travel Style
        $travelStyleRevenue = Trip::whereIn('status', $validStatuses)
            ->when($since, fn ($q) => $q->where('created_at', '>=', $since))
            ->select('travel_style', DB::raw('SUM(COALESCE(estimated_cost, budget)) as total'))
            ->whereNotNull('travel_style')
            ->groupBy('travel_style')
            ->pluck('total', 'travel_style')
            ->map(fn ($val) => (float) $val);

        // Top Booked Destinations
        $topDestinations = DB::table('flights')
            ->select('arrival_airport as iata', DB::raw('COUNT(*) as bookings'))
            ->groupBy('arrival_airport')
            ->orderByDesc('bookings')
            ->limit(5)
            ->get()
            ->map(function ($row) {
                $airportMap = [
                    'CAI' => ['city' => 'Cairo', 'country' => 'Egypt'],
                    'LHR' => ['city' => 'London', 'country' => 'United Kingdom'],
                    'JFK' => ['city' => 'New York', 'country' => 'United States'],
                    'CDG' => ['city' => 'Paris', 'country' => 'France'],
                    'DXB' => ['city' => 'Dubai', 'country' => 'United Arab Emirates'],
                    'FCO' => ['city' => 'Rome', 'country' => 'Italy'],
                    'HND' => ['city' => 'Tokyo', 'country' => 'Japan'],
                    'SYD' => ['city' => 'Sydney', 'country' => 'Australia'],
                ];
                $meta = $airportMap[$row->iata] ?? ['city' => $row->iata, 'country' => 'International'];

                return [
                    'city' => $meta['city'],
                    'iata' => $row->iata,
                    'country' => $meta['country'],
                    'bookings' => (int) $row->bookings,
                ];
            });

        // Recent Bookings list (top 5 latest)
        $recentBookings = Trip::with('user')
            ->whereIn('status', $validStatuses)
            ->latest()
            ->limit(5)
            ->get()
            ->map(function ($trip) {
                return [
                    'id' => $trip->id,
                    'user' => [
                        'name' => $trip->user?->name ?? 'Guest Passenger',
                        'email' => $trip->user?->email ?? 'guest@itinera.com',
                    ],
                    'title' => $trip->title,
                    'budget' => (float) ($trip->estimated_cost ?? $trip->budget),
                    'start_date' => $trip->start_date?->format('Y-m-d'),
                    'status' => $trip->status?->value ?? 'booked',
                    'created_at' => $trip->created_at?->format('Y-m-d H:i:s'),
                ];
            });

        // Peak Booking & AI Generation Hours (2-hour slots: 02:00, 04:00, ..., 00:00)
        $peakHours = $this->calculatePeakHours($since);

        return ApiResponse::success([
            'total_revenue' => (float) $totalRevenue,
            'total_bookings' => $totalBookings,
            'average_booking_value' => (float) $averageBookingValue,
            'delta' => [
                'revenue' => $revenueDelta,
                'bookings' => $bookingsDelta,
            ],
            'revenue_by_month' => $monthlyRevenue,
            'revenue_by_travel_style' => $travelStyleRevenue,
            'top_destinations' => $topDestinations,
            'recent_bookings' => $recentBookings,
            'peak_hours' => $peakHours,
        ], 'Revenue statistics retrieved successfully');
    }

    /**
     * Return aggregated analytics charts data (Users + Revenue) for the admin dashboard.
     * GET /api/v1/admin/analytics?period=30d
     */
    public function index(Request $request): JsonResponse
    {
        $period = $request->query('period', '30d');

        return ApiResponse::success([
            'users' => $this->usersAnalytics($period),
            'revenue' => $this->revenueAnalytics($period),
        ], 'Analytics data retrieved successfully');
    }

    /**
     * Users summary + growth chart filtered by period.
     */
    protected function usersAnalytics(string $period): array
    {
        [$since, $prevSince, $prevUntil] = $this->resolvePeriodDates($period);

        $totalUsers = User::count();
        $newUsersCount = User::when($since, fn ($q) => $q->where('created_at', '>=', $since))->count();

        $prevUsersCount = 0;
        if ($prevSince && $prevUntil) {
            $prevUsersCount = User::whereBetween('created_at', [$prevSince, $prevUntil])->count();
        }
        $delta = $this->calculateDelta($prevUsersCount, $newUsersCount);

        return [
            'total_users' => $totalUsers,
            'new_users_last_30_days' => $newUsersCount,
            'delta' => $delta,
            'chart' => $this->buildPeriodSeries('users', $period),
        ];
    }

    /**
     * Revenue summary + growth chart filtered by period.
     */
    protected function revenueAnalytics(string $period): array
    {
        [$since, $prevSince, $prevUntil] = $this->resolvePeriodDates($period);

        $totalRevenue = (float) Trip::sum(DB::raw('COALESCE(estimated_cost, budget)'));
        $periodRevenue = (float) Trip::when($since, fn ($q) => $q->where('created_at', '>=', $since))
            ->sum(DB::raw('COALESCE(estimated_cost, budget)'));

        $prevRevenue = 0;
        if ($prevSince && $prevUntil) {
            $prevRevenue = (float) Trip::whereBetween('created_at', [$prevSince, $prevUntil])
                ->sum(DB::raw('COALESCE(estimated_cost, budget)'));
        }
        $delta = $this->calculateDelta($prevRevenue, $periodRevenue);

        return [
            'total_revenue' => $totalRevenue,
            'revenue_last_30_days' => $periodRevenue,
            'delta' => $delta,
            'chart' => $this->buildPeriodSeries('revenue', $period),
        ];
    }

    /**
     * Build dynamic series buckets for 7d (daily), 30d (weekly), 90d (monthly), all (monthly).
     */
    protected function buildPeriodSeries(string $type, string $period): array
    {
        $series = [];

        if ($period === '7d') {
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i);
                $dayLabel = $date->format('D');

                if ($type === 'users') {
                    $val = User::whereDate('created_at', $date->toDateString())->count();
                } else {
                    $val = (float) Trip::whereDate('created_at', $date->toDateString())
                        ->sum(DB::raw('COALESCE(estimated_cost, budget)'));
                }

                $series[] = [
                    'month' => $dayLabel,
                    'value' => $type === 'revenue' ? round($val, 2) : (int) $val,
                ];
            }
        } elseif ($period === '30d') {
            for ($w = 3; $w >= 0; $w--) {
                $start = Carbon::now()->subDays(($w + 1) * 7 - 1)->startOfDay();
                $end = Carbon::now()->subDays($w * 7)->endOfDay();
                $label = 'Week ' . (4 - $w);

                if ($type === 'users') {
                    $val = User::whereBetween('created_at', [$start, $end])->count();
                } else {
                    $val = (float) Trip::whereBetween('created_at', [$start, $end])
                        ->sum(DB::raw('COALESCE(estimated_cost, budget)'));
                }

                $series[] = [
                    'month' => $label,
                    'value' => $type === 'revenue' ? round($val, 2) : (int) $val,
                ];
            }
        } elseif ($period === '90d') {
            for ($m = 2; $m >= 0; $m--) {
                $date = Carbon::now()->subMonths($m);
                $start = $date->copy()->startOfMonth();
                $end = $date->copy()->endOfMonth();
                $label = $date->format('M');

                if ($type === 'users') {
                    $val = User::whereBetween('created_at', [$start, $end])->count();
                } else {
                    $val = (float) Trip::whereBetween('created_at', [$start, $end])
                        ->sum(DB::raw('COALESCE(estimated_cost, budget)'));
                }

                $series[] = [
                    'month' => $label,
                    'value' => $type === 'revenue' ? round($val, 2) : (int) $val,
                ];
            }
        } else {
            // 'all' or default -> 6-12 months
            $monthsCount = $period === 'all' ? 12 : 6;
            for ($m = $monthsCount - 1; $m >= 0; $m--) {
                $date = Carbon::now()->subMonths($m);
                $start = $date->copy()->startOfMonth();
                $end = $date->copy()->endOfMonth();
                $label = $date->format('M');

                if ($type === 'users') {
                    $val = User::whereBetween('created_at', [$start, $end])->count();
                } else {
                    $val = (float) Trip::whereBetween('created_at', [$start, $end])
                        ->sum(DB::raw('COALESCE(estimated_cost, budget)'));
                }

                $series[] = [
                    'month' => $label,
                    'value' => $type === 'revenue' ? round($val, 2) : (int) $val,
                ];
            }
        }

        return $series;
    }

    /**
     * Resolve date ranges for current period and matching previous period.
     */
    protected function resolvePeriodDates(string $period): array
    {
        $now = Carbon::now();
        switch ($period) {
            case '7d':
                $since = $now->copy()->subDays(6)->startOfDay();
                $prevSince = $now->copy()->subDays(13)->startOfDay();
                $prevUntil = $now->copy()->subDays(7)->endOfDay();
                break;
            case '30d':
                $since = $now->copy()->subDays(29)->startOfDay();
                $prevSince = $now->copy()->subDays(59)->startOfDay();
                $prevUntil = $now->copy()->subDays(30)->endOfDay();
                break;
            case '90d':
                $since = $now->copy()->subDays(89)->startOfDay();
                $prevSince = $now->copy()->subDays(179)->startOfDay();
                $prevUntil = $now->copy()->subDays(90)->endOfDay();
                break;
            case 'all':
            default:
                $since = null;
                $prevSince = null;
                $prevUntil = null;
                break;
        }

        return [$since, $prevSince, $prevUntil];
    }

    /**
     * Calculate growth percentage between previous and current period.
     */
    protected function calculateDelta(float|int $previous, float|int $current): float
    {
        if ($previous <= 0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    /**
     * Calculate hourly breakdown of trip bookings / AI itinerary creation.
     */
    protected function calculatePeakHours(?Carbon $since): array
    {
        $slots = ["02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00", "00:00"];
        $hourlyCounts = [];

        $driver = DB::getDriverName();
        $hourExpr = match ($driver) {
            'pgsql' => "EXTRACT(HOUR FROM created_at)",
            'sqlite' => "CAST(strftime('%H', created_at) AS INTEGER)",
            default => "HOUR(created_at)",
        };

        $rawCounts = Trip::query()
            ->when($since, fn ($q) => $q->where('created_at', '>=', $since))
            ->selectRaw("{$hourExpr} as hr_num, COUNT(*) as cnt")
            ->groupBy('hr_num')
            ->pluck('cnt', 'hr_num');

        foreach ($slots as $slot) {
            $h = (int) explode(':', $slot)[0];
            $val = ($rawCounts[$h] ?? 0) + ($rawCounts[($h + 1) % 24] ?? 0);
            $hourlyCounts[] = [
                'hr' => $slot,
                'val' => (int) $val,
            ];
        }

        return $hourlyCounts;
    }
}
