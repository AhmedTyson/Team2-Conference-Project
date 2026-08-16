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
    // Get Revenue Statistics (Analytics)

    public function revenue(Request $request): JsonResponse
    {
        $validStatuses = [
            TripStatus::BOOKED->value,
            TripStatus::COMPLETED->value,
            TripStatus::PLANNED->value,
            TripStatus::PLANNING->value,
            TripStatus::PENDING->value,
        ];

        $userId = $request->user()?->id ?? 'guest';
        Cache::forget("admin:analytics:revenue:{$userId}");

        // Total Revenue (sum of budgets)
        $totalRevenue = Trip::whereIn('status', $validStatuses)->sum('budget');
        $totalBookings = Trip::whereIn('status', $validStatuses)->count();
        $averageBookingValue = $totalBookings > 0 ? round($totalRevenue / $totalBookings, 2) : 0;

        // Monthly Revenue breakdown
        $monthlyRevenue = Trip::whereIn('status', $validStatuses)
            ->selectRaw(match (DB::getDriverName()) {
                'pgsql' => "to_char(start_date, 'YYYY-MM') as month, SUM(budget) as total",
                'sqlite' => "strftime('%Y-%m', start_date) as month, SUM(budget) as total",
                default => "DATE_FORMAT(start_date, '%Y-%m') as month, SUM(budget) as total",
            })
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('total', 'month')
            ->map(fn ($val) => (float) $val);

        // Revenue by Travel Style
        $travelStyleRevenue = Trip::whereIn('status', $validStatuses)
            ->select('travel_style', DB::raw('SUM(budget) as total'))
            ->groupBy('travel_style')
            ->pluck('total', 'travel_style')
            ->map(fn ($val) => (float) $val);

        // Top Booked Destinations (by flight arrival airport count)
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
                        'email' => $trip->user?->email ?? 'guest@itinari.com',
                    ],
                    'title' => $trip->title,
                    'budget' => (float) $trip->budget,
                    'start_date' => $trip->start_date?->format('Y-m-d'),
                    'status' => $trip->status?->value ?? 'booked',
                    'created_at' => $trip->created_at?->format('Y-m-d H:i:s'),
                ];
            });

        return ApiResponse::success([
            'total_revenue' => (float) $totalRevenue,
            'total_bookings' => $totalBookings,
            'average_booking_value' => (float) $averageBookingValue,
            'revenue_by_month' => $monthlyRevenue,
            'revenue_by_travel_style' => $travelStyleRevenue,
            'top_destinations' => $topDestinations,
            'recent_bookings' => $recentBookings,
        ], 'Revenue statistics retrieved successfully');
    }

    /**
     * Return aggregated analytics charts data (Users + Revenue) for the admin dashboard.
     *
     * GET /api/admin/analytics
     */
    public function index(Request $request): JsonResponse
    {
        $period = $request->query('period', '30d');
        $months = match ($period) {
            '7d' => 1,
            '30d' => 1,
            '90d' => 3,
            'all' => 12,
            default => 6,
        };

        return ApiResponse::success([
            'users' => $this->usersAnalytics($months),
            'revenue' => $this->revenueAnalytics($months),
        ], 'Analytics data retrieved successfully');
    }

    /**
     * Users summary + monthly signup growth for the last $months months.
     */
    protected function usersAnalytics(int $months): array
    {
        $since = Carbon::now()->subMonths($months - 1)->startOfMonth();

        $monthly = User::query()
            ->where('created_at', '>=', $since)
            ->selectRaw(match (DB::getDriverName()) {
                'pgsql' => "to_char(created_at, 'YYYY-MM') as month, COUNT(*) as total",
                'sqlite' => "strftime('%Y-%m', created_at) as month, COUNT(*) as total",
                default => "DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as total",
            })
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('total', 'month');

        return [
            'total_users' => User::count(),
            'new_users_last_30_days' => User::where('created_at', '>=', Carbon::now()->subDays(30))->count(),
            'chart' => $this->fillMonthlySeries($monthly, $months),
        ];
    }

    /**
     * Revenue summary + monthly revenue (based on trips budget) for the last $months months.
     */
    protected function revenueAnalytics(int $months): array
    {
        $since = Carbon::now()->subMonths($months - 1)->startOfMonth();

        $monthly = Trip::query()
            ->where('created_at', '>=', $since)
            ->selectRaw(match (DB::getDriverName()) {
                'pgsql' => "to_char(created_at, 'YYYY-MM') as month, SUM(COALESCE(estimated_cost, budget)) as total",
                'sqlite' => "strftime('%Y-%m', created_at) as month, SUM(COALESCE(estimated_cost, budget)) as total",
                default => "DATE_FORMAT(created_at, '%Y-%m') as month, SUM(COALESCE(estimated_cost, budget)) as total",
            })
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('total', 'month');

        return [
            'total_revenue' => (float) Trip::sum(DB::raw('COALESCE(estimated_cost, budget)')),
            'revenue_last_30_days' => (float) Trip::where('created_at', '>=', Carbon::now()->subDays(30))
                ->sum(DB::raw('COALESCE(estimated_cost, budget)')),
            'chart' => $this->fillMonthlySeries($monthly, $months, true),
        ];
    }

    /**
     * Build a zero-filled monthly series (oldest -> newest) so the frontend
     * chart always gets a continuous set of points, even for empty months.
     */
    protected function fillMonthlySeries($grouped, int $months, bool $asFloat = false): array
    {
        $series = [];
        $cursor = Carbon::now()->subMonths($months - 1)->startOfMonth();

        for ($i = 0; $i < $months; $i++) {
            $key = $cursor->format('Y-m');
            $value = $grouped[$key] ?? 0;

            $series[] = [
                'month' => $cursor->format('M Y'),
                'value' => $asFloat ? round((float) $value, 2) : (int) $value,
            ];

            $cursor->addMonth();
        }

        return $series;
    }
}
