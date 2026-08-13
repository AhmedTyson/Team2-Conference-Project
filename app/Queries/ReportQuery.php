<?php

namespace App\Queries;

use App\Enums\OrderStatus;
use App\Models\Account\User;
use App\Models\Catalog\Hotel;
use App\Models\Catalog\Restaurant;
use App\Models\Commerce\Order;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Expression;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReportQuery
{
    /**
     * Paid payments status
     */
    protected const REVENUE_STATUS = 'paid';

    public function kpis(?string $from, ?string $to): array
    {
        $base = $this->paidOrders($from, $to);

        $revenueCents = (clone $base)->sum('orders.total_cents');

        [$prevFrom, $prevTo] = $this->previousPeriod($from, $to);

        $prevRevenueCents = $this->paidOrders($prevFrom, $prevTo)->sum('orders.total_cents');

        return [
            'revenue' => $revenueCents / 100,
            'currency' => 'USD',
            'bookings' => (clone $base)->count(),
            'users' => $this->activeUsers($from, $to),
            'growth_percent' => $this->growthPercent($prevRevenueCents, $revenueCents),
        ];
    }

    public function monthlyRevenue(?string $from, ?string $to): Collection
    {
        return $this->paidOrders($from, $to)
            ->select(
                $this->monthExpr('orders.created_at'),
                DB::raw('SUM(orders.total_cents) as total_cents')
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
        return $this->paidOrders($from, $to)
            ->select(
                $this->weekExpr('orders.created_at'),
                DB::raw('SUM(orders.total_cents) as total_cents')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(fn ($row) => [
                'week_start' => $row->period,
                'revenue' => $row->total_cents / 100,
            ]);
    }

    public function revenueByBookingType(?string $from, ?string $to): Collection
    {
        $rows = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('payments', 'orders.id', '=', 'payments.order_id')
            ->where('payments.status', self::REVENUE_STATUS)
            ->when($from, fn ($q) => $q->whereDate('orders.created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('orders.created_at', '<=', $to))
            ->select(
                'order_items.product_type as type',
                DB::raw('SUM(order_items.price_cents) as total_cents')
            )
            ->groupBy('order_items.product_type')
            ->get();

        return $rows->map(fn ($row) => [
            'type' => $this->shortTypeName($row->type),
            'revenue' => $row->total_cents / 100,
        ]);
    }

    public function bookingsTrend(?string $from, ?string $to): Collection
    {
        return Order::query()
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to))
            ->select(
                $this->monthExpr('created_at'),
                DB::raw('COUNT(*) as total')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(fn ($row) => [
                'period' => $row->period,
                'bookings' => $row->total,
            ]);
    }

    public function bookingStatusBreakdown(?string $from, ?string $to): Collection
    {
        return Order::query()
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to))
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->get()
            ->map(fn ($row) => [
                'status' => $row->status instanceof OrderStatus ? $row->status->value : $row->status,
                'count' => $row->total,
            ]);
    }

    public function bookingTypesBreakdown(?string $from, ?string $to): Collection
    {
        $rows = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->when($from, fn ($q) => $q->whereDate('orders.created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('orders.created_at', '<=', $to))
            ->select('order_items.product_type as type', DB::raw('COUNT(*) as total'))
            ->groupBy('order_items.product_type')
            ->get();

        return $rows->map(fn ($row) => [
            'type' => $this->shortTypeName($row->type),
            'count' => $row->total,
        ]);
    }

    public function activeUsers(?string $from, ?string $to): int
    {
        return Order::query()
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to))
            ->distinct('user_id')
            ->count('user_id');
    }

    public function returningUsers(?string $from, ?string $to): int
    {
        return Order::query()
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to))
            ->select('user_id')
            ->groupBy('user_id')
            ->havingRaw('COUNT(*) > 1')
            ->get()
            ->count();
    }

    public function activeUsersTrend(?string $from, ?string $to): Collection
    {
        return Order::query()
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to))
            ->select(
                $this->monthExpr('created_at'),
                DB::raw('COUNT(DISTINCT user_id) as total')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(fn ($row) => [
                'period' => $row->period,
                'active_users' => $row->total,
            ]);
    }

    public function newUsersTrend(?string $from, ?string $to): Collection
    {
        return User::query()
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to))
            ->select(
                $this->monthExpr('created_at'),
                DB::raw('COUNT(*) as new_users')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get();
    }

    public function returningUsersTrend(?string $from, ?string $to): Collection
    {
        // Simple mock returning users trend based on Orders
        return Order::query()
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to))
            ->select(
                $this->monthExpr('created_at'),
                DB::raw('COUNT(DISTINCT user_id) as returning_users')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get();
    }

    public function newUsers(?string $from, ?string $to): Collection
    {
        return User::query()
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to))
            ->select(
                $this->monthExpr('created_at'),
                DB::raw('COUNT(*) as new_users')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get();
    }

    public function topDestinations(?string $from, ?string $to): Collection
    {
        return DB::table('destinations')
            ->joinSub($this->destinationLinkedItemsQuery($from, $to), 'line_items', function ($join) {
                $join->on('destinations.id', '=', 'line_items.destination_id');
            })
            ->select('destinations.id', 'destinations.name', DB::raw('COUNT(*) as bookings_count'))
            ->groupBy('destinations.id', 'destinations.name')
            ->orderByDesc('bookings_count')
            ->limit(5)
            ->get();
    }

    public function topRevenueDestinations(?string $from, ?string $to): Collection
    {
        return DB::table('destinations')
            ->joinSub($this->destinationLinkedItemsQuery($from, $to), 'line_items', function ($join) {
                $join->on('destinations.id', '=', 'line_items.destination_id');
            })
            ->select('destinations.id', 'destinations.name', DB::raw('SUM(line_items.line_total_cents) as total_cents'))
            ->groupBy('destinations.id', 'destinations.name')
            ->orderByDesc('total_cents')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'id' => $row->id,
                'name' => $row->name,
                'revenue' => $row->total_cents / 100,
            ]);
    }

    public function peakBookingDays(?string $from, ?string $to): Collection
    {
        return Order::query()
            ->join('payments', 'orders.id', '=', 'payments.order_id')
            ->when($from, fn ($q) => $q->whereDate('payments.created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('payments.created_at', '<=', $to))
            ->select(
                $this->dayOfWeekExpr('payments.created_at'),
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

    protected function monthExpr(string $column = 'created_at'): Expression
    {
        return DB::raw(match (DB::getDriverName()) {
            'sqlite' => "strftime('%Y-%m', {$column})",
            default => "DATE_FORMAT({$column}, '%Y-%m')",
        }.' as period');
    }

    protected function weekExpr(string $column = 'created_at'): Expression
    {
        return DB::raw(match (DB::getDriverName()) {
            'sqlite' => "strftime('%Y-%W', {$column})",
            default => "YEARWEEK({$column}, 1)",
        }.' as period');
    }

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

    protected function paidOrders(?string $from, ?string $to): Builder
    {
        return Order::query()
            ->join('payments', 'orders.id', '=', 'payments.order_id')
            ->where('payments.status', self::REVENUE_STATUS)
            ->when($from, fn ($q) => $q->whereDate('orders.created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('orders.created_at', '<=', $to))
            ->select('orders.*');
    }

    protected function destinationLinkedItemsQuery(?string $from, ?string $to)
    {
        $hotels = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('payments', 'orders.id', '=', 'payments.order_id')
            ->join('hotels', 'hotels.id', '=', 'order_items.product_id')
            ->where('order_items.product_type', Hotel::class)
            ->where('payments.status', self::REVENUE_STATUS)
            ->when($from, fn ($q) => $q->whereDate('orders.created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('orders.created_at', '<=', $to))
            ->select(
                'hotels.destination_id as destination_id',
                DB::raw('order_items.price_cents as line_total_cents')
            );

        $restaurants = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('payments', 'orders.id', '=', 'payments.order_id')
            ->join('restaurants', 'restaurants.id', '=', 'order_items.product_id')
            ->where('order_items.product_type', Restaurant::class)
            ->where('payments.status', self::REVENUE_STATUS)
            ->when($from, fn ($q) => $q->whereDate('orders.created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('orders.created_at', '<=', $to))
            ->select(
                'restaurants.destination_id as destination_id',
                DB::raw('order_items.price_cents as line_total_cents')
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
