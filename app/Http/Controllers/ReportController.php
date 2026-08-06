<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\GenerateReportRequest;
use App\Models\Report;
use App\Queries\ReportQuery;
use App\Services\GenerateReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class ReportController extends Controller
{
    public function generate(
        GenerateReportRequest $request,
        GenerateReportService $generationService,
        ReportQuery $reportQuery
    ) {
        $from = $request->validated('from');
        $to = $request->validated('to');
 
        $report = $generationService->generatePdfReport($from, $to, $request->user()->id);
 
        if (! $report) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate report',
                'data' => null,
            ], 500);
        }
 
        Cache::forget('dashboard_analytics');
 
        if (Cache::getStore() instanceof \Illuminate\Cache\TaggableStore) {
            Cache::tags('analytics')->flush();
        } else {
            Cache::forget('analytics_dashboard');
        }
 
        Cache::forget('reports_page_1_15');
 
        return response()->json([
            'success' => true,
            'message' => 'Report generated successfully',
            'data' => [
                'report' => $report,
                'kpis' => $reportQuery->kpis($from, $to),
            ],
        ], 201);
    }
 
    public function index(Request $request)
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
 
        return response()->json([
            'success' => true,
            'message' => 'Reports fetched successfully',
            'data' => $reports,
        ], 200);
    }
 
    public function download($id)
    {
        $report = Report::find($id);
 
        if (! $report) {
            return response()->json([
                'success' => false,
                'message' => 'Report not found',
                'data' => null,
            ], 404);
        }
 
        if (! Storage::disk('public')->exists($report->file_path)) {
            return response()->json([
                'success' => false,
                'message' => 'Report file not found',
                'data' => null,
            ], 404);
        }
 
        return Storage::disk('public')->download($report->file_path, basename($report->file_path));
    }
}
