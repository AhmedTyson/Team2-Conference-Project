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
        // We consider trips with status 'booked' or 'completed' as successful bookings
        $bookedStatuses = [
            TripStatus::BOOKED->value,
            TripStatus::COMPLETED->value,
        ];

        // Get cache key for current admin user
        $cacheKey = "admin:analytics:revenue:{$request->user()->id}";

        // Return cached analytics or generate fresh data
        return ApiResponse::success(Cache::remember($cacheKey, 300, function () use ($bookedStatuses) {
            // Total Revenue (sum of budgets for booked/completed trips)
            $totalRevenue = Trip::whereIn('status', $bookedStatuses)->sum('budget');

            // Total Bookings count
            $totalBookings = Trip::whereIn('status', $bookedStatuses)->count();

            // Average Booking Value
            $averageBookingValue = $totalBookings > 0 ? round($totalRevenue / $totalBookings, 2) : 0;

            // Monthly Revenue breakdown (SQL aggregation for performance)
            $monthlyRevenue = Trip::whereIn('status', $bookedStatuses)
                ->selectRaw('DATE(start_date) as month, SUM(budget) as total')
                ->groupBy('month')
                ->orderBy('month')
                ->pluck('total', 'month')
                ->map(fn ($val) => (float) $val);

            // Revenue by Travel Style
            $travelStyleRevenue = Trip::whereIn('status', $bookedStatuses)
                ->select('travel_style', \DB::raw('SUM(budget) as total'))
                ->groupBy('travel_style')
                ->pluck('total', 'travel_style')
                ->map(fn ($val) => (float) $val);

            // Recent Bookings list (top 5 latest)
            $recentBookings = Trip::with('user')
                ->whereIn('status', $bookedStatuses)
                ->latest()
                ->limit(5)
                ->get()
                ->map(function ($trip) {
                    return [
                        'id' => $trip->id,
                        'user' => [
                            'name' => $trip->user?->name,
                            'email' => $trip->user?->email,
                        ],
                        'title' => $trip->title,
                        'budget' => (float) $trip->budget,
                        'start_date' => $trip->start_date?->format('Y-m-d'),
                        'status' => $trip->status?->value,
                        'created_at' => $trip->created_at?->format('Y-m-d H:i:s'),
                    ];
                });

            return [
                'total_revenue' => (float) $totalRevenue,
                'total_bookings' => $totalBookings,
                'average_booking_value' => (float) $averageBookingValue,
                'revenue_by_month' => $monthlyRevenue,
                'revenue_by_travel_style' => $travelStyleRevenue,
                'recent_bookings' => $recentBookings,
            ];
        }), 'Revenue statistics retrieved successfully');
    }

    /**
     * Return aggregated analytics charts data (Users + Revenue) for the admin dashboard.
     *
     * GET /api/v1/admin/analytics
     */
    public function index(): JsonResponse
    {
        $months = 6;

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
            ->selectRaw("strftime('%Y-%m', created_at) as month, COUNT(*) as total")
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
            ->selectRaw("strftime('%Y-%m', created_at) as month, SUM(COALESCE(estimated_cost, budget)) as total")
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
