<?php

namespace App\Services\System;

use App\Queries\ReportQuery;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Writer\XLSX\Options;
use OpenSpout\Writer\XLSX\Writer;

/**
 * Generates a multi-sheet Excel (.xlsx) report using openspout v5.
 *
 * Palette:
 *   Navy       #0F2854   → AARRGGBB: FF0F2854
 *   Royal Blue #1C4D8D   → FF1C4D8D
 *   Sky Blue   #4988C4   → FF4988C4
 *   Ice Blue   #BDE8F5   → FFBDE8F5
 */
class GenerateReportExcelService
{
    // openspout v5 Style uses AARRGGBB hex strings
    private const NAVY = 'FF0F2854';

    private const ROYAL_BLUE = 'FF1C4D8D';

    private const ICE_BLUE = 'FF4988C4';

    private const WHITE = 'FFFFFFFF';

    private const LIGHT_ROW = 'FFF0F7FF';

    private const TEXT_DARK = 'FF1A2A4A';

    private const TEXT_GRAY = 'FF6B7280';

    public function __construct(private ReportQuery $reportQuery) {}

    /**
     * Build the xlsx file, store to a temp path, return the path.
     */
    public function generate(string $from, string $to): string
    {
        $tmpPath = tempnam(sys_get_temp_dir(), 'report_').'.xlsx';
        $writer = new Writer(new Options);
        $writer->openToFile($tmpPath);

        $this->writeCoverSheet($writer, $from, $to);
        $this->writeExecutiveSummarySheet($writer, $from, $to);
        $this->writeRevenueSheet($writer, $from, $to);
        $this->writeBookingsSheet($writer, $from, $to);
        $this->writeUsersSheet($writer, $from, $to);
        $this->writeBusinessInsightsSheet($writer, $from, $to);

        $writer->close();

        return $tmpPath;
    }

    // ── Cover page ─────────────────────────────────────────────────────

    private function writeCoverSheet(Writer $writer, string $from, string $to): void
    {
        $writer->getCurrentSheet()->setName('Cover');
        $generated = now()->format('Y-m-d H:i');
        $currency = 'USD';

        // Logo wordmark
        $writer->addRow($this->createRowWithStyle(['Itinera'], $this->coverLogoStyle(), 15.0));
        $writer->addRow($this->createRowWithStyle(['Smart Travel Intelligence'], $this->coverTaglineStyle(), 15.0));
        $writer->addRow($this->createRowWithStyle([''], $this->dataStyle(false), 15.0));

        // Title
        $writer->addRow($this->createRowWithStyle(['Business Analytics Report'], $this->coverTitleStyle(), 15.0));
        $writer->addRow($this->createRowWithStyle(['Comprehensive Booking & Revenue Overview'], $this->coverSubtitleStyle(), 15.0));
        $writer->addRow($this->createRowWithStyle([''], $this->dataStyle(false), 15.0));

        // Meta card
        $writer->addRow($this->createRowWithStyle(['Report Period'], $this->metaLabelStyle(), 15.0));
        $writer->addRow($this->createRowWithStyle([$from.' — '.$to], $this->metaValueStyle(), 15.0));
        $writer->addRow($this->createRowWithStyle(['Generated'], $this->metaLabelStyle(), 15.0));
        $writer->addRow($this->createRowWithStyle([$generated], $this->metaValueStyle(), 15.0));
        $writer->addRow($this->createRowWithStyle(['Classification'], $this->metaLabelStyle(), 15.0));
        $writer->addRow($this->createRowWithStyle(['Confidential'], $this->metaValueStyle(), 15.0));
    }

    // ── Executive Summary ─────────────────────────────────────────────

    private function writeExecutiveSummarySheet(Writer $writer, string $from, string $to): void
    {
        $writer->addNewSheetAndMakeItCurrent()->setName('Executive Summary');

        $kpis = $this->reportQuery->kpis($from, $to);

        $writer->addRow($this->createRowWithStyle(['Booking Report — Executive Summary'], $this->titleStyle(), 15.0));
        $writer->addRow($this->createRowWithStyle(["Period: {$from}  →  {$to}    Generated: ".now()->format('Y-m-d H:i')], $this->subtitleStyle(), 15.0));
        $writer->addRow($this->createRowWithStyle([''], $this->dataStyle(false), 15.0));

        $writer->addRow($this->createRowWithStyle(['KPI', 'Value'], $this->headerStyle(), 15.0));
        $writer->addRow($this->createRowWithStyle(['Total Revenue', number_format($kpis['revenue'], 2).' '.($kpis['currency'] ?? 'USD')], $this->dataStyle(true), 15.0));
        $writer->addRow($this->createRowWithStyle(['Total Bookings', $kpis['bookings']], $this->dataStyle(false), 15.0));
        $writer->addRow($this->createRowWithStyle(['Active Users', $kpis['users']], $this->dataStyle(true), 15.0));
        $writer->addRow($this->createRowWithStyle(['Revenue Growth %', number_format($kpis['growth_percent'], 1).'%'], $this->dataStyle(false), 15.0));
    }

    // ── Revenue ───────────────────────────────────────────────────────

    private function writeRevenueSheet(Writer $writer, string $from, string $to): void
    {
        $writer->addNewSheetAndMakeItCurrent()->setName('Revenue');

        $monthly = $this->reportQuery->monthlyRevenue($from, $to);
        $weekly = $this->reportQuery->weeklyRevenue($from, $to);
        $byType = $this->reportQuery->revenueByBookingType($from, $to);

        $writer->addRow($this->createRowWithStyle([''], $this->pageHeaderStyle(), 25.0));
        $writer->addRow($this->createRowWithStyle(['Revenue Analytics'], $this->titleStyle(), 15.0));
        $writer->addRow($this->createRowWithStyle([''], $this->dataStyle(false), 15.0));

        $writer->addRow($this->createRowWithStyle(['Monthly Revenue'], $this->sectionStyle(), 15.0));
        $writer->addRow($this->createRowWithStyle(['Period', 'Revenue (USD)'], $this->headerStyle(), 15.0));
        $alt = false;
        foreach ($monthly as $row) {
            $writer->addRow($this->createRowWithStyle([$row['period'], (float) $row['revenue']], $this->dataStyle($alt), 15.0));
            $alt = ! $alt;
        }

        $writer->addRow($this->createRowWithStyle([''], $this->dataStyle(false), 15.0));
        $writer->addRow($this->createRowWithStyle(['Weekly Revenue'], $this->sectionStyle(), 15.0));
        $writer->addRow($this->createRowWithStyle(['Week Start', 'Revenue (USD)'], $this->headerStyle(), 15.0));
        $alt = false;
        foreach ($weekly as $row) {
            $writer->addRow($this->createRowWithStyle([$row['week_start'], (float) $row['revenue']], $this->dataStyle($alt), 15.0));
            $alt = ! $alt;
        }

        $writer->addRow($this->createRowWithStyle([''], $this->dataStyle(false), 15.0));
        $writer->addRow($this->createRowWithStyle(['Revenue by Booking Type'], $this->sectionStyle(), 15.0));
        $writer->addRow($this->createRowWithStyle(['Type', 'Revenue (USD)'], $this->headerStyle(), 15.0));
        $alt = false;
        foreach ($byType as $row) {
            $writer->addRow($this->createRowWithStyle([$row['type'], (float) $row['revenue']], $this->dataStyle($alt), 15.0));
            $alt = ! $alt;
        }
    }

    // ── Bookings ─────────────────────────────────────────────────────

    private function writeBookingsSheet(Writer $writer, string $from, string $to): void
    {
        $writer->addNewSheetAndMakeItCurrent()->setName('Bookings');

        $trend = $this->reportQuery->bookingsTrend($from, $to);
        $status = $this->reportQuery->bookingStatusBreakdown($from, $to);
        $types = $this->reportQuery->bookingTypesBreakdown($from, $to);

        $writer->addRow($this->createRowWithStyle([''], $this->pageHeaderStyle(), 25.0));
        $writer->addRow($this->createRowWithStyle(['Booking Analytics'], $this->titleStyle(), 15.0));
        $writer->addRow($this->createRowWithStyle([''], $this->dataStyle(false), 15.0));

        $writer->addRow($this->createRowWithStyle(['Bookings Trend'], $this->sectionStyle(), 15.0));
        $writer->addRow($this->createRowWithStyle(['Period', 'Bookings'], $this->headerStyle(), 15.0));
        $alt = false;
        foreach ($trend as $row) {
            $writer->addRow($this->createRowWithStyle([$row['period'], (int) $row['bookings']], $this->dataStyle($alt), 15.0));
            $alt = ! $alt;
        }

        $writer->addRow($this->createRowWithStyle([''], $this->dataStyle(false), 15.0));
        $writer->addRow($this->createRowWithStyle(['Booking Status Breakdown'], $this->sectionStyle(), 15.0));
        $writer->addRow($this->createRowWithStyle(['Status', 'Count'], $this->headerStyle(), 15.0));
        $alt = false;
        foreach ($status as $row) {
            $writer->addRow($this->createRowWithStyle([ucfirst($row['status']), (int) $row['count']], $this->dataStyle($alt), 15.0));
            $alt = ! $alt;
        }

        $writer->addRow($this->createRowWithStyle([''], $this->dataStyle(false), 15.0));
        $writer->addRow($this->createRowWithStyle(['Booking Types Breakdown'], $this->sectionStyle(), 15.0));
        $writer->addRow($this->createRowWithStyle(['Type', 'Count'], $this->headerStyle(), 15.0));
        $alt = false;
        foreach ($types as $row) {
            $writer->addRow($this->createRowWithStyle([$row['type'], (int) $row['count']], $this->dataStyle($alt), 15.0));
            $alt = ! $alt;
        }
    }

    // ── Users ───────────────────────────────────────────────────────

    private function writeUsersSheet(Writer $writer, string $from, string $to): void
    {
        $writer->addNewSheetAndMakeItCurrent()->setName('Users');

        $newUsers = $this->reportQuery->newUsers($from, $to);
        $activeTrend = $this->reportQuery->activeUsersTrend($from, $to);
        $returning = $this->reportQuery->returningUsersTrend($from, $to);

        $writer->addRow($this->createRowWithStyle([''], $this->pageHeaderStyle(), 25.0));
        $writer->addRow($this->createRowWithStyle(['User Analytics'], $this->titleStyle(), 15.0));
        $writer->addRow($this->createRowWithStyle([''], $this->dataStyle(false), 15.0));

        $writer->addRow($this->createRowWithStyle(['New Users Over Time'], $this->sectionStyle(), 15.0));
        $writer->addRow($this->createRowWithStyle(['Period', 'New Users'], $this->headerStyle(), 15.0));
        $alt = false;
        foreach ($newUsers as $row) {
            $writer->addRow($this->createRowWithStyle([$row['period'], (int) $row['new_users']], $this->dataStyle($alt), 15.0));
            $alt = ! $alt;
        }

        $writer->addRow($this->createRowWithStyle([''], $this->dataStyle(false), 15.0));
        $writer->addRow($this->createRowWithStyle(['Active Users Trend'], $this->sectionStyle(), 15.0));
        $writer->addRow($this->createRowWithStyle(['Period', 'Active Users'], $this->headerStyle(), 15.0));
        $alt = false;
        foreach ($activeTrend as $row) {
            $writer->addRow($this->createRowWithStyle([$row['period'], (int) $row['active_users']], $this->dataStyle($alt), 15.0));
            $alt = ! $alt;
        }

        $writer->addRow($this->createRowWithStyle([''], $this->dataStyle(false), 15.0));
        $writer->addRow($this->createRowWithStyle(['Returning Users Trend'], $this->sectionStyle(), 15.0));
        $writer->addRow($this->createRowWithStyle(['Period', 'Returning Users'], $this->headerStyle(), 15.0));
        $alt = false;
        foreach ($returning as $row) {
            $writer->addRow($this->createRowWithStyle([$row['period'], (int) $row['returning_users']], $this->dataStyle($alt), 15.0));
            $alt = ! $alt;
        }
    }

    // ── Business Insights ───────────────────────────────────────────

    private function writeBusinessInsightsSheet(Writer $writer, string $from, string $to): void
    {
        $writer->addNewSheetAndMakeItCurrent()->setName('Business Insights');

        $topDestinations = $this->reportQuery->topDestinations($from, $to);
        $topRevenueDestinations = $this->reportQuery->topRevenueDestinations($from, $to);
        $peakBookingDays = $this->reportQuery->peakBookingDays($from, $to);

        $this->writeTable($writer, 'Top Destinations', ['Destination', 'Bookings'], $topDestinations, fn ($row) => [$row->name, (int) $row->bookings_count]);

        $this->writeTable($writer, 'Top Revenue Destinations', ['Destination', 'Revenue (USD)'], $topRevenueDestinations, fn ($row) => [$row->name, (float) $row->revenue]);

        $this->writeTable($writer, 'Peak Booking Days', ['Day', 'Bookings'], $peakBookingDays, fn ($row) => [$row['day'] ?? $row->day, (int) ($row['bookings'] ?? $row->bookings)]);
    }

    // ── Helper methods ───────────────────────────────────────────────

    private function createRowWithStyle(array $values, Style $style, float $height = 15.0): Row
    {
        return Row::fromValuesWithStyle($values, $style, $height);
    }

    private function writeTable(Writer $writer, string $title, array $headers, array $data, callable $rowFormatter): void
    {
        $writer->addRow($this->createRowWithStyle([$title], $this->sectionStyle(), 15.0));
        $writer->addRow($this->createRowWithStyle($headers, $this->headerStyle(), 15.0));

        $alt = false;
        foreach ($data as $row) {
            $writer->addRow($this->createRowWithStyle($rowFormatter($row), $this->dataStyle($alt), 15.0));
            $alt = ! $alt;
        }
    }

    private function titleStyle(): Style
    {
        return (new Style)
            ->withFontSize(16)
            ->withFontColor(self::NAVY)
            ->withBackgroundColor(self::LIGHT_ROW);
    }

    private function subtitleStyle(): Style
    {
        return (new Style)
            ->withFontSize(10)
            ->withFontColor(self::TEXT_GRAY);
    }

    private function sectionStyle(): Style
    {
        return (new Style)
            ->withFontBold(true)
            ->withFontSize(12)
            ->withFontColor(self::WHITE)
            ->withBackgroundColor(self::ROYAL_BLUE);
    }

    private function headerStyle(): Style
    {
        return (new Style)
            ->withFontBold(true)
            ->withFontSize(11)
            ->withFontColor(self::ICE_BLUE)
            ->withBackgroundColor(self::NAVY);
    }

    private function dataStyle(bool $alternate): Style
    {
        return (new Style)
            ->withFontSize(10)
            ->withFontColor(self::TEXT_DARK)
            ->withBackgroundColor($alternate ? self::LIGHT_ROW : self::WHITE);
    }

    // ── Cover page styles ─────────────────────────────────────────────────────

    private function coverLogoStyle(): Style
    {
        return (new Style)
            ->withFontBold(true)
            ->withFontSize(26)
            ->withFontColor(self::WHITE)
            ->withBackgroundColor(self::NAVY);
    }

    private function coverTaglineStyle(): Style
    {
        return (new Style)
            ->withFontSize(9)
            ->withFontColor(self::ICE_BLUE)
            ->withBackgroundColor(self::NAVY);
    }

    private function coverTitleStyle(): Style
    {
        return (new Style)
            ->withFontBold(true)
            ->withFontSize(18)
            ->withFontColor(self::WHITE)
            ->withBackgroundColor(self::ROYAL_BLUE);
    }

    private function coverSubtitleStyle(): Style
    {
        return (new Style)
            ->withFontSize(10)
            ->withFontColor(self::ICE_BLUE)
            ->withBackgroundColor(self::ROYAL_BLUE);
    }

    private function metaLabelStyle(): Style
    {
        return (new Style)
            ->withFontSize(9)
            ->withFontColor(self::ICE_BLUE)
            ->withBackgroundColor(self::WHITE);
    }

    private function metaValueStyle(): Style
    {
        return (new Style)
            ->withFontSize(11)
            ->withFontColor(self::WHITE)
            ->withBackgroundColor(self::ROYAL_BLUE);
    }

    private function pageHeaderStyle(): Style
    {
        return (new Style)
            ->withFontBold(true)
            ->withFontSize(10)
            ->withFontColor(self::WHITE)
            ->withBackgroundColor(self::NAVY);
    }
}
