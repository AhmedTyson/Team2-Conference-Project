<?php

namespace Tests\Feature\System;

use App\Models\System\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'admin', 'guard_name' => 'api']);
    }

    private function admin(): User
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        return $admin;
    }

    public function test_admin_can_generate_pdf_report_to_fake_storage(): void
    {
        Storage::fake('public');

        $response = $this->actingAs($this->admin(), 'api')->postJson('/api/v1/admin/reports/generate', [
            'from' => now()->subMonth()->toDateString(),
            'to' => now()->toDateString(),
        ]);

        $response->assertStatus(202)
            ->assertJsonStructure(['data' => ['report' => ['id', 'file_path', 'status']]]);

        $this->assertEquals('completed', $response->json('data.report.status'));
        $this->assertArrayHasKey('kpis', $response->json('data'));

        $path = $response->json('data.report.file_path');

        $this->assertNotNull($path);
        Storage::disk('public')->assertExists($path);
    }

    public function test_admin_can_download_generated_report(): void
    {
        Storage::fake('public');

        $reportPath = 'reports/booking_report_test.pdf';
        Storage::disk('public')->put($reportPath, '%PDF-1.7 fake contents');

        $report = Report::factory()->create(['file_path' => $reportPath]);

        $response = $this->actingAs($this->admin(), 'api')->getJson("/api/v1/admin/reports/{$report->id}/download");

        $response->assertStatus(200)
            ->assertHeader('content-type', 'application/pdf');

        $this->assertStringContainsString('%PDF-1.7 fake contents', $response->streamedContent());
    }

    public function test_download_missing_report_file_returns_404_contract(): void
    {
        Storage::fake('public');

        $report = Report::factory()->create(['file_path' => 'reports/ghost.pdf']);

        $response = $this->actingAs($this->admin(), 'api')->getJson("/api/v1/admin/reports/{$report->id}/download");

        $response->assertStatus(404)
            ->assertJsonStructure(['error' => ['type', 'status', 'message', 'timestamp']]);
    }

    public function test_download_pending_report_returns_409_contract(): void
    {
        Storage::fake('public');

        $report = Report::factory()->create(['status' => 'pending', 'file_path' => null]);

        $response = $this->actingAs($this->admin(), 'api')->getJson("/api/v1/admin/reports/{$report->id}/download");

        $response->assertStatus(409)
            ->assertJsonPath('error.type', 'generation_in_progress')
            ->assertJsonStructure(['error' => ['type', 'status', 'message', 'timestamp']]);
    }

    public function test_user_can_poll_own_reports_via_me_endpoint(): void
    {
        $admin = $this->admin();
        $other = User::factory()->create();

        Report::factory()->count(2)->create(['user_id' => $admin->id]);
        Report::factory()->create(['user_id' => $other->id]);

        $this->actingAs($admin, 'api')->getJson('/api/me/reports')
            ->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }
}
