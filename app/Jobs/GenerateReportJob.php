<?php

namespace App\Jobs;

use App\Models\Report;
use App\Services\GenerateReportService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class GenerateReportJob implements ShouldQueue
{
    use Queueable;

    public int $timeout = 300;

    public function __construct(public readonly Report $report) {}

    public function handle(GenerateReportService $generationService): void
    {
        $generationService->fillReport($this->report);
    }
}
