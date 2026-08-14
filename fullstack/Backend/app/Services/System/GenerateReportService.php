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
            'logoDataUri' => $this->logoDataUri(),

            // Page 1 — Executive Summary
            'kpis' => $kpis,
            'summaryTable' => $this->reportQuery->executiveSummary($from, $to),

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
                $revenueByType->pluck('revenue')->all(),
                height: 535
            ),

            // Page 3 — Booking Analytics
            'bookingsTrend' => $bookingsTrend,
            'bookingStatus' => $bookingStatus,
            'bookingTypes' => $bookingTypes,
            'bookingsTrendChartUrl' => $this->lineChart(
                $bookingsTrend->pluck('period')->all(),
                $bookingsTrend->pluck('bookings')->all(),
                'Bookings',
                height: 320
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
                'Bookings',
                height: 320
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

    private function logoDataUri(): string
    {
        $path = public_path('images/logo.png');

        if (! file_exists($path)) {
            return '';
        }

        $mime = mime_content_type($path) ?: 'image/png';
        $data = (string) file_get_contents($path);

        // DomPDF does not respect PNG alpha, so transparent pixels render as
        // white. Re-render the logo on a solid navy (#0F2854) background and
        // recolor the artwork to white / ice-blue (#BDE8F5) using its alpha
        // channel as a mask, so it is fully visible on the navy cover and
        // page-header strips without any white box.
        if (function_exists('imagecreatefrompng') && str_starts_with($mime, 'image/png')) {
            try {
                $source = imagecreatefromstring($data);

                if ($source !== false) {
                    $width = imagesx($source);
                    $height = imagesy($source);

                    $flat = imagecreatetruecolor($width, $height);
                    $navy = imagecolorallocate($flat, 15, 40, 84);
                    imagefill($flat, 0, 0, $navy);

                    // Ice-blue (#BDE8F5) tint used for the feathered edges.
                    $ice = [189, 232, 245];
                    $white = [255, 255, 255];

                    for ($y = 0; $y < $height; $y++) {
                        for ($x = 0; $x < $width; $x++) {
                            $rgba = imagecolorat($source, $x, $y);
                            $alpha = ($rgba >> 24) & 0x7F;

                            if ($alpha >= 127) {
                                continue; // fully transparent: keep navy
                            }

                            if ($alpha <= 60) {
                                // Opaque core: white fading to ice-blue.
                                $k = (60 - $alpha) / 60;
                            } else {
                                // Feather edge: ice-blue fading to navy.
                                $k = (127 - $alpha) / 67;
                                $r = (int) round($ice[0] * $k + 15 * (1 - $k));
                                $g = (int) round($ice[1] * $k + 40 * (1 - $k));
                                $b = (int) round($ice[2] * $k + 84 * (1 - $k));
                                imagesetpixel($flat, $x, $y, imagecolorallocate($flat, $r, $g, $b));

                                continue;
                            }

                            $r = (int) round($white[0] * $k + $ice[0] * (1 - $k));
                            $g = (int) round($white[1] * $k + $ice[1] * (1 - $k));
                            $b = (int) round($white[2] * $k + $ice[2] * (1 - $k));
                            imagesetpixel($flat, $x, $y, imagecolorallocate($flat, $r, $g, $b));
                        }
                    }

                    ob_start();
                    imagepng($flat);
                    $data = (string) ob_get_clean();
                }
            } catch (\Throwable) {
                // Fall back to the original bytes if recoloring fails.
            }
        }

        return 'data:'.$mime.';base64,'.base64_encode($data);
    }

    private function lineChart(array $labels, array $data, string $label, int $height = 400): string
    {
        return $this->buildChartUrl('line', $labels, $data, $label, height: $height);
    }

    private function barChart(array $labels, array $data, string $label, int $height = 400): string
    {
        return $this->buildChartUrl('bar', $labels, $data, $label, height: $height);
    }

    private function horizontalBarChart(array $labels, array $data, string $label): string
    {
        return $this->buildChartUrl('horizontalBar', $labels, $data, $label, height: 364);
    }

    private function pieChart(array $labels, array $data, int $height = 500): string
    {
        return $this->buildChartUrl('pie', $labels, $data, '', $this->paletteFor(count($labels)), $height);
    }

    private function buildChartUrl(
        string $type,
        array $labels,
        array $data,
        string $label = '',
        ?array $colors = null,
        int $height = 400
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
            ],
        ];

        if ($type === 'horizontalBar') {
            $chartConfig['options']['indexAxis'] = 'y';
        }

        $url = 'https://quickchart.io/chart?w=800&h='.$height.'&c='.urlencode(json_encode($chartConfig));

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
