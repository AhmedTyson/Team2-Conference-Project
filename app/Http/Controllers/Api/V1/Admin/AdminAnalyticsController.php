<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AdminAnalyticsController extends Controller
{
    /**
     * Return aggregated analytics charts data (Users + Revenue) for the admin dashboard.
     *
     * GET /api/v1/admin/analytics
     */
    public function index(): JsonResponse
    {
        $months = 6;

        return response()->json([
            'success' => true,
            'data'    => [
                'users'   => $this->usersAnalytics($months),
                'revenue' => $this->revenueAnalytics($months),
            ],
        ]);
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
