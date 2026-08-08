<?php

namespace App\Queries;

use App\Models\Booking;
use App\Models\Hotel;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Expression;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReportQuery
{
    /**
     * Statuses that count as "revenue-generating" bookings.
     * Mirrors the reference's COMPLETED_STATUS pattern.
     */
    protected const REVENUE_STATUS = 'paid';

    /*
    |--------------------------------------------------------------------
    | PAGE 1 — Executive Summary / KPIs
    |--------------------------------------------------------------------
    */

    public function kpis(?string $from, ?string $to): array
    {
        $base = $this->paidBookings($from, $to);

        $revenueCents = (clone $base)->sum('amount_cents');
        $bookingsCount = (clone $base)->count();

        $usersCount = User::query()
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to))
            ->count();

        [$prevFrom, $prevTo] = $this->previousPeriod($from, $to);

        $prevRevenueCents = $this->paidBookings($prevFrom, $prevTo)->sum('amount_cents');

        return [
            'revenue' => $revenueCents / 100,
            'bookings' => $bookingsCount,
            'users' => $usersCount,
            'growth_percent' => $this->growthPercent($prevRevenueCents, $revenueCents),
        ];
    }

    /*
    |--------------------------------------------------------------------
    | PAGE 2 — Revenue Analytics
    |--------------------------------------------------------------------
    */

    public function monthlyRevenue(?string $from, ?string $to): Collection
    {
        return $this->paidBookings($from, $to)
            ->select(
                $this->monthExpr(),
                DB::raw('SUM(amount_cents) as total_cents')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(fn ($row) => [
                'period' => $row->period,
                'revenue' => $row->total_cents / 100,
            ]);
    }

    public function weeklyRevenue(?string $from, ?string $to): Collection
    {
        return $this->paidBookings($from, $to)
            ->select(
                $this->weekExpr(),
                DB::raw('MIN(DATE(created_at)) as week_start'),
                DB::raw('SUM(amount_cents) as total_cents')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(fn ($row) => [
                'week_start' => $row->week_start,
                'revenue' => $row->total_cents / 100,
            ]);
    }

    public function revenueByBookingType(?string $from, ?string $to): Collection
    {
        $rows = DB::table('booking_items')
            ->join('bookings', 'bookings.id', '=', 'booking_items.booking_id')
            ->where('bookings.status', self::REVENUE_STATUS)
            ->when($from, fn ($q) => $q->whereDate('bookings.created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('bookings.created_at', '<=', $to))
            ->select(
                'booking_items.itemable_type as type',
                DB::raw('SUM(booking_items.quantity * booking_items.unit_price_cents) as total_cents')
            )
            ->groupBy('booking_items.itemable_type')
            ->get();

        return $rows->map(fn ($row) => [
            'type' => $this->shortTypeName($row->type),
            'revenue' => $row->total_cents / 100,
        ]);
    }

    /*
    |--------------------------------------------------------------------
    | PAGE 3 — Booking Analytics
    |--------------------------------------------------------------------
    */

    public function bookingsTrend(?string $from, ?string $to): Collection
    {
        return Booking::query()
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to))
            ->select(
                $this->monthExpr(),
                DB::raw('COUNT(*) as total')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(fn ($row) => ['period' => $row->period, 'bookings' => $row->total]);
    }

    public function bookingStatusBreakdown(?string $from, ?string $to): Collection
    {
        return Booking::query()
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to))
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->get()
            ->map(fn ($row) => ['status' => $row->status, 'count' => $row->total]);
    }

    public function bookingTypesBreakdown(?string $from, ?string $to): Collection
    {
        $rows = DB::table('booking_items')
            ->join('bookings', 'bookings.id', '=', 'booking_items.booking_id')
            ->when($from, fn ($q) => $q->whereDate('bookings.created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('bookings.created_at', '<=', $to))
            ->select('booking_items.itemable_type as type', DB::raw('COUNT(*) as total'))
            ->groupBy('booking_items.itemable_type')
            ->get();

        return $rows->map(fn ($row) => [
            'type' => $this->shortTypeName($row->type),
            'count' => $row->total,
        ]);
    }

    /*
    |--------------------------------------------------------------------
    | PAGE 4 — User Analytics
    |--------------------------------------------------------------------
    */

    public function newUsers(?string $from, ?string $to): Collection
    {
        return User::query()
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to))
            ->select(
                $this->monthExpr(),
                DB::raw('COUNT(*) as total')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(fn ($row) => ['period' => $row->period, 'new_users' => $row->total]);
    }

    /**
     * "Active" = made at least one booking in the period.
     */
    public function activeUsers(?string $from, ?string $to): int
    {
        return Booking::query()
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to))
            ->distinct('user_id')
            ->count('user_id');
    }

    /**
     * "Returning" = users with more than one booking in the period.
     */
    public function returningUsers(?string $from, ?string $to): int
    {
        return Booking::query()
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to))
            ->select('user_id')
            ->groupBy('user_id')
            ->havingRaw('COUNT(*) > 1')
            ->get()
            ->count();
    }

    /**
     * Monthly trend of distinct active users (for the "Active Users" bar chart).
     */
    public function activeUsersTrend(?string $from, ?string $to): Collection
    {
        return Booking::query()
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to))
            ->select(
                $this->monthExpr(),
                DB::raw('COUNT(DISTINCT user_id) as total')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(fn ($row) => ['period' => $row->period, 'active_users' => $row->total]);
    }

    /**
     * Monthly trend of returning users (users with >1 booking within that month).
     */
    public function returningUsersTrend(?string $from, ?string $to): Collection
    {
        return DB::table('bookings')
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to))
            ->select(
                $this->monthExpr(),
                'user_id',
                DB::raw('COUNT(*) as bookings_in_period')
            )
            ->groupBy('period', 'user_id')
            ->havingRaw('COUNT(*) > 1')
            ->get()
            ->groupBy('period')
            ->map(fn ($rows, $period) => ['period' => $period, 'returning_users' => $rows->count()])
            ->values();
    }

    /*
    |--------------------------------------------------------------------
    | PAGE 5 — Business Insights
    |--------------------------------------------------------------------
    */

    /**
     * Top destinations by number of bookings.
     * Currently unions Hotel + Restaurant items (the only itemables with
     * destination_id in the current schema). Add Attraction/Experience
     * subqueries below in the same shape once/if those tables carry
     * destination_id too.
     */
    public function topDestinations(?string $from, ?string $to, int $limit = 10): Collection
    {
        $union = $this->destinationLinkedItemsQuery($from, $to);

        return DB::table(DB::raw("({$union->toSql()}) as di"))
            ->mergeBindings($union)
            ->join('destinations', 'destinations.id', '=', 'di.destination_id')
            ->select('destinations.id', 'destinations.name', DB::raw('COUNT(*) as bookings_count'))
            ->groupBy('destinations.id', 'destinations.name')
            ->orderByDesc('bookings_count')
            ->limit($limit)
            ->get();
    }

    public function topRevenueDestinations(?string $from, ?string $to, int $limit = 10): Collection
    {
        $union = $this->destinationLinkedItemsQuery($from, $to);

        return DB::table(DB::raw("({$union->toSql()}) as di"))
            ->mergeBindings($union)
            ->join('destinations', 'destinations.id', '=', 'di.destination_id')
            ->select('destinations.id', 'destinations.name', DB::raw('SUM(di.line_total_cents) as total_cents'))
            ->groupBy('destinations.id', 'destinations.name')
            ->orderByDesc('total_cents')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'id' => $row->id,
                'name' => $row->name,
                'revenue' => $row->total_cents / 100,
            ]);
    }

    public function peakBookingDays(?string $from, ?string $to): Collection
    {
        return Booking::query()
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to))
            ->select(
                $this->dayOfWeekExpr(),
                DB::raw('COUNT(*) as total')
            )
            ->groupBy('day_index')
            ->orderBy('day_index')
            ->get()
            ->map(fn ($row) => [
                'day' => $this->dayName((int) $row->day_index),
                'bookings' => $row->total,
            ]);
    }

    /*
    |--------------------------------------------------------------------
    | Shared helpers
    |--------------------------------------------------------------------
    */

    /**
     * Portable "group by month" expression (SQLite has no DATE_FORMAT()).
     */
    protected function monthExpr(string $column = 'created_at'): Expression
    {
        return DB::raw(match (DB::getDriverName()) {
            'sqlite' => "strftime('%Y-%m', {$column})",
            default => "DATE_FORMAT({$column}, '%Y-%m')",
        }.' as period');
    }

    /**
     * Portable "group by ISO-ish week" expression.
     */
    protected function weekExpr(string $column = 'created_at'): Expression
    {
        return DB::raw(match (DB::getDriverName()) {
            'sqlite' => "strftime('%Y-%W', {$column})",
            default => "YEARWEEK({$column}, 1)",
        }.' as period');
    }

    /**
     * Portable "day of week as 0 (Sun) - 6 (Sat)" expression.
     */
    protected function dayOfWeekExpr(string $column = 'created_at'): Expression
    {
        return DB::raw(match (DB::getDriverName()) {
            'sqlite' => "CAST(strftime('%w', {$column}) AS INTEGER)",
            default => "DAYOFWEEK({$column}) - 1",
        }.' as day_index');
    }

    protected function dayName(int $dayIndex): string
    {
        return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][$dayIndex] ?? 'Unknown';
    }

    protected function paidBookings(?string $from, ?string $to): Builder
    {
        return Booking::query()
            ->where('status', self::REVENUE_STATUS)
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to));
    }

    /**
     * Builds a UNION of booking_items joined to their destination-bearing
     * itemables (Hotel, Restaurant), scoped to paid bookings in the range.
     * Extend with additional unionAll() calls for Attraction/Experience
     * once they expose a destination_id column.
     */
    protected function destinationLinkedItemsQuery(?string $from, ?string $to)
    {
        $hotels = DB::table('booking_items')
            ->join('bookings', 'bookings.id', '=', 'booking_items.booking_id')
            ->join('hotels', 'hotels.id', '=', 'booking_items.itemable_id')
            ->where('booking_items.itemable_type', Hotel::class)
            ->where('bookings.status', self::REVENUE_STATUS)
            ->when($from, fn ($q) => $q->whereDate('bookings.created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('bookings.created_at', '<=', $to))
            ->select(
                'hotels.destination_id as destination_id',
                DB::raw('booking_items.quantity * booking_items.unit_price_cents as line_total_cents')
            );

        $restaurants = DB::table('booking_items')
            ->join('bookings', 'bookings.id', '=', 'booking_items.booking_id')
            ->join('restaurants', 'restaurants.id', '=', 'booking_items.itemable_id')
            ->where('booking_items.itemable_type', Restaurant::class)
            ->where('bookings.status', self::REVENUE_STATUS)
            ->when($from, fn ($q) => $q->whereDate('bookings.created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('bookings.created_at', '<=', $to))
            ->select(
                'restaurants.destination_id as destination_id',
                DB::raw('booking_items.quantity * booking_items.unit_price_cents as line_total_cents')
            );

        return $hotels->unionAll($restaurants);
    }

    protected function shortTypeName(string $fqcn): string
    {
        return class_basename($fqcn);
    }

    protected function growthPercent(int $previousCents, int $currentCents): float
    {
        if ($previousCents <= 0) {
            return $currentCents > 0 ? 100.0 : 0.0;
        }

        return round((($currentCents - $previousCents) / $previousCents) * 100, 2);
    }

    /**
     * Mirrors the current [from, to] window immediately before it,
     * used to compute the growth % in kpis().
     */
    protected function previousPeriod(?string $from, ?string $to): array
    {
        if (! $from || ! $to) {
            return [null, null];
        }

        $start = Carbon::parse($from);
        $end = Carbon::parse($to);
        $days = $start->diffInDays($end) + 1;

        return [
            $start->copy()->subDays($days)->toDateString(),
            $start->copy()->subDay()->toDateString(),
        ];
    }
}
