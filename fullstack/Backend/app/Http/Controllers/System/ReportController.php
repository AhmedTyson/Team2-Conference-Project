<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\GenerateReportRequest;
use App\Jobs\GenerateReportJob;
use App\Models\System\Report;
use App\Queries\ReportQuery;
use App\Support\ApiResponse;
use Illuminate\Cache\TaggableStore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class ReportController extends Controller
{
    public function generate(
        GenerateReportRequest $request,
        ReportQuery $reportQuery
    ): JsonResponse {
        $from = $request->validated('from');
        $to = $request->validated('to');
        $format = $request->validated('format', 'pdf') ?? 'pdf';

        $report = Report::create([
            'user_id' => $request->user()->id,
            'from_date' => $from,
            'to_date' => $to,
            'format' => $format,
            'status' => 'pending',
        ]);

        GenerateReportJob::dispatch($report);

        $report->refresh();

        Cache::forget('dashboard_analytics');

        if (Cache::getStore() instanceof TaggableStore) {
            Cache::tags('analytics')->flush();
        } else {
            Cache::forget('analytics_dashboard');
        }

        Cache::forget('reports_page_1_15');

        return ApiResponse::success([
            'report' => $report,
            'kpis' => $reportQuery->kpis($from, $to),
        ], 'Report generation queued', 202);
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 15), 100);
        $page = (int) $request->query('page', 1);

        $reports = Cache::remember(
            "reports_page_{$page}_{$perPage}",
            now()->addMinutes(10),
            function () use ($perPage) {
                return Report::with('user:id,name')
                    ->latest()
                    ->paginate($perPage);
            }
        );

        return ApiResponse::success($reports, 'Reports fetched successfully', 200, [
            'meta' => [
                'current_page' => $reports->currentPage(),
                'per_page' => $reports->perPage(),
                'total' => $reports->total(),
                'last_page' => $reports->lastPage(),
            ],
        ]);
    }

    public function download($id)
    {
        $report = Report::find($id);

        if (! $report) {
            return ApiResponse::fail('Report not found', 'not_found', 404);
        }

        if ($report->status === 'pending') {
            return ApiResponse::fail('Report generation in progress', 'generation_in_progress', 409);
        }

        if ($report->status === 'failed' || ! $report->file_path || ! Storage::disk('public')->exists($report->file_path)) {
            return ApiResponse::fail('Report file not found', 'not_found', 404);
        }

        return Storage::disk('public')->download($report->file_path, basename($report->file_path));
    }

    public function myReports(Request $request): JsonResponse
    {
        return ApiResponse::success(
            Report::where('user_id', $request->user()->id)
                ->latest()
                ->get(),
            'Reports fetched successfully'
        );
    }
}
