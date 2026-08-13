<?php

namespace App\Services\System;

use App\Models\System\Report;
use App\Queries\ReportQuery;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class GenerateReportService
{
    public function __construct(
        private ReportQuery $reportQuery,
        private GenerateReportExcelService $excelService,
    ) {}

    public function fillReport(Report $report): bool
    {
        $originalMemory = ini_set('memory_limit', '256M');

        try {
            $from = $report->from_date->format('Y-m-d');
            $to = $report->to_date->format('Y-m-d');
            $format = $report->format ?? 'pdf';

            $baseName = 'booking_report_'.$from.'_to_'.$to.'_'.uniqid();

            if ($format === 'excel') {
                $path = $this->generateExcel($baseName, $from, $to);
            } else {
                $path = $this->generatePdf($baseName, $from, $to);
            }

            $report->update([
                'file_path' => $path,
                'status' => 'completed',
            ]);

            return true;
        } catch (\Throwable $e) {
            Log::error('Booking report generation failed', [
                'report_id' => $report->id,
                'exception' => $e->getMessage(),
            ]);

            $report->update(['status' => 'failed']);

            return false;
        } finally {
            ini_set('memory_limit', $originalMemory);
        }
    }

    private function generatePdf(string $baseName, string $from, string $to): string
    {
        $data = $this->buildReportData($from, $to);
        $pdf = Pdf::loadView('reports.booking-report', $data);
        $fileName = $baseName.'.pdf';
        $path = 'reports/'.$fileName;

        Storage::disk('public')->put($path, $pdf->output());

        return $path;
    }

    private function generateExcel(string $baseName, string $from, string $to): string
    {
        $tmpPath = $this->excelService->generate($from, $to);
        $fileName = $baseName.'.xlsx';
        $path = 'reports/'.$fileName;

        Storage::disk('public')->put($path, file_get_contents($tmpPath));
        @unlink($tmpPath);

        return $path;
    }

    /**
     * Pulls every metric from ReportQuery and shapes it (including chart
     * image URLs) for the Blade template.
     */
    private function buildReportData(string $from, string $to): array
    {
        $kpis = $this->reportQuery->kpis($from, $to);

        $monthlyRevenue = $this->reportQuery->monthlyRevenue($from, $to);
        $weeklyRevenue = $this->reportQuery->weeklyRevenue($from, $to);
        $revenueByType = $this->reportQuery->revenueByBookingType($from, $to);

        $bookingsTrend = $this->reportQuery->bookingsTrend($from, $to);
        $bookingStatus = $this->reportQuery->bookingStatusBreakdown($from, $to);
        $bookingTypes = $this->reportQuery->bookingTypesBreakdown($from, $to);

        $newUsers = $this->reportQuery->newUsers($from, $to);
        $activeUsersTrend = $this->reportQuery->activeUsersTrend($from, $to);
        $returningUsersTrend = $this->reportQuery->returningUsersTrend($from, $to);

        $topDestinations = $this->reportQuery->topDestinations($from, $to);
        $topRevenueDestinations = $this->reportQuery->topRevenueDestinations($from, $to);
        $peakBookingDays = $this->reportQuery->peakBookingDays($from, $to);

        return [
            'from' => $from,
            'to' => $to,
            'generatedAt' => now(),

            // Page 1 — Executive Summary
            'kpis' => $kpis,

            // Page 2 — Revenue Analytics
            'monthlyRevenue' => $monthlyRevenue,
            'weeklyRevenue' => $weeklyRevenue,
            'revenueByType' => $revenueByType,
            'monthlyRevenueChartUrl' => $this->lineChart(
                $monthlyRevenue->pluck('period')->all(),
                $monthlyRevenue->pluck('revenue')->all(),
                'Monthly Revenue'
            ),
            'weeklyRevenueChartUrl' => $this->barChart(
                $weeklyRevenue->pluck('week_start')->all(),
                $weeklyRevenue->pluck('revenue')->all(),
                'Weekly Revenue'
            ),
            'revenueByTypeChartUrl' => $this->pieChart(
                $revenueByType->pluck('type')->all(),
                $revenueByType->pluck('revenue')->all()
            ),

            // Page 3 — Booking Analytics
            'bookingsTrend' => $bookingsTrend,
            'bookingStatus' => $bookingStatus,
            'bookingTypes' => $bookingTypes,
            'bookingsTrendChartUrl' => $this->lineChart(
                $bookingsTrend->pluck('period')->all(),
                $bookingsTrend->pluck('bookings')->all(),
                'Bookings'
            ),
            'bookingStatusChartUrl' => $this->pieChart(
                $bookingStatus->pluck('status')->all(),
                $bookingStatus->pluck('count')->all()
            ),
            'bookingTypesChartUrl' => $this->pieChart(
                $bookingTypes->pluck('type')->all(),
                $bookingTypes->pluck('count')->all()
            ),

            // Page 4 — User Analytics
            'newUsers' => $newUsers,
            'activeUsersTrend' => $activeUsersTrend,
            'returningUsersTrend' => $returningUsersTrend,
            'newUsersChartUrl' => $this->lineChart(
                $newUsers->pluck('period')->all(),
                $newUsers->pluck('new_users')->all(),
                'New Users'
            ),
            'activeUsersChartUrl' => $this->barChart(
                $activeUsersTrend->pluck('period')->all(),
                $activeUsersTrend->pluck('active_users')->all(),
                'Active Users'
            ),

            // Page 5 — Business Insights
            'topDestinations' => $topDestinations,
            'topRevenueDestinations' => $topRevenueDestinations,
            'peakBookingDays' => $peakBookingDays,
            'topDestinationsChartUrl' => $this->horizontalBarChart(
                $topDestinations->pluck('name')->all(),
                $topDestinations->pluck('bookings_count')->all(),
                'Bookings'
            ),
            'peakBookingDaysChartUrl' => $this->barChart(
                $peakBookingDays->pluck('day')->all(),
                $peakBookingDays->pluck('bookings')->all(),
                'Bookings'
            ),
        ];
    }

    /*
    |--------------------------------------------------------------------
    | QuickChart URL builders
    |--------------------------------------------------------------------
    | Each returns a ready-to-embed <img src="..."> URL rendered server
    | side by quickchart.io, same approach as the reference report.
    */

    private function lineChart(array $labels, array $data, string $label): string
    {
        return $this->buildChartUrl('line', $labels, $data, $label);
    }

    private function barChart(array $labels, array $data, string $label): string
    {
        return $this->buildChartUrl('bar', $labels, $data, $label);
    }

    private function horizontalBarChart(array $labels, array $data, string $label): string
    {
        return $this->buildChartUrl('horizontalBar', $labels, $data, $label);
    }

    private function pieChart(array $labels, array $data): string
    {
        return $this->buildChartUrl('pie', $labels, $data, '', $this->paletteFor(count($labels)));
    }

    private function buildChartUrl(
        string $type,
        array $labels,
        array $data,
        string $label = '',
        ?array $colors = null
    ): string {
        if (empty($data) || array_sum(array_map('floatval', $data)) <= 0) {
            return '';
        }

        $chartType = $type === 'horizontalBar' ? 'bar' : $type;

        $dataset = [
            'label' => $label,
            'data' => $data,
        ];

        if ($colors) {
            $dataset['backgroundColor'] = $colors;
        }

        $chartConfig = [
            'type' => $chartType,
            'data' => [
                'labels' => $labels,
                'datasets' => [$dataset],
            ],
            'options' => [
                'legend' => ['display' => ! empty($label)],
                $type === 'horizontalBar' ? 'indexAxis' : null => 'y',
            ],
        ];

        $url = 'https://quickchart.io/chart?w=500&h=300&c='.urlencode(json_encode($chartConfig));

        try {
            // Fetch the image content from QuickChart and convert to Base64
            $imageContent = @file_get_contents($url);
            if ($imageContent) {
                $base64 = base64_encode($imageContent);

                return 'data:image/png;base64,'.$base64;
            }
        } catch (\Throwable $e) {
            // Fallback to empty string if fetching fails
        }

        return '';
    }

    private function paletteFor(int $count): array
    {
        $palette = ['#42a5f5', '#66bb6a', '#ffa726', '#ab47bc', '#ef5350', '#26a69a', '#8d6e63', '#78909c'];

        return array_slice(array_merge($palette, $palette), 0, max($count, 1));
    }
}
