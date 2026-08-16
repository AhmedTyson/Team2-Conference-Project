<?php

namespace Tests\Feature\System;

use App\Models\Account\User;
use App\Models\Commerce\Order;
use App\Models\Commerce\OrderItem;
use App\Models\Commerce\Payment;
use App\Models\System\Report;
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

        Storage::fake('public');
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

        $response = $this->actingAs($this->admin(), 'api')->postJson('/api/admin/reports/generate', [
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

    public function test_admin_can_generate_report_without_from_and_to_dates_defaulting_to_all_time(): void
    {
        Storage::fake('public');

        // Omit 'from' and 'to' in request body
        $response = $this->actingAs($this->admin(), 'api')->postJson('/api/admin/reports/generate', []);

        $response->assertStatus(202)
            ->assertJsonStructure(['data' => ['report' => ['id', 'file_path', 'status']]]);

        $this->assertEquals('completed', $response->json('data.report.status'));
        $this->assertTrue(str_starts_with($response->json('data.report.from_date'), '2000-01-01'));
        $this->assertTrue(str_starts_with($response->json('data.report.to_date'), now()->format('Y-m-d')));
    }

    public function test_report_reflects_real_order_and_payment_data(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $order = Order::create([
            'user_id' => $user->id,
            'status' => 'fulfilled',
            'total_cents' => 50000, // $500
            'currency' => 'USD',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_type' => 'App\Models\Catalog\Hotel',
            'product_id' => 1,
            'price_cents' => 50000,
            'metadata' => [],
        ]);

        Payment::create([
            'order_id' => $order->id,
            'paymob_transaction_id' => 'abc1234',
            'amount_cents' => 50000,
            'currency' => 'USD',
            'status' => 'paid',
            'hmac_valid' => true,
            'raw_payload' => '{}',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($this->admin(), 'api')->postJson('/api/admin/reports/generate', [
            'from' => now()->subDays(2)->toDateString(),
            'to' => now()->addDays(2)->toDateString(),
        ]);

        $response->assertStatus(202);

        // Assert revenue is picked up correctly
        $this->assertEquals(500, $response->json('data.kpis.revenue'));
    }

    public function test_admin_can_download_generated_report(): void
    {
        Storage::fake('public');

        $reportPath = 'reports/booking_report_test.pdf';
        Storage::disk('public')->put($reportPath, '%PDF-1.7 fake contents');

        $report = Report::factory()->create(['file_path' => $reportPath, 'status' => 'completed']);

        $response = $this->actingAs($this->admin(), 'api')->get("/api/admin/reports/{$report->id}/download");

        $response->assertStatus(200)
            ->assertHeader('content-type', 'application/pdf');

        $this->assertStringContainsString('%PDF-1.7 fake contents', $response->streamedContent());
    }

    public function test_download_missing_report_file_returns_404_contract(): void
    {
        Storage::fake('public');

        $report = Report::factory()->create(['file_path' => 'reports/ghost.pdf']);

        $response = $this->actingAs($this->admin(), 'api')->getJson("/api/admin/reports/{$report->id}/download");

        $response->assertStatus(404)
            ->assertJsonStructure(['error' => ['type', 'status', 'message', 'timestamp']]);
    }

    public function test_download_pending_report_returns_409_contract(): void
    {
        Storage::fake('public');

        $report = Report::factory()->create(['status' => 'pending', 'file_path' => null]);

        $response = $this->actingAs($this->admin(), 'api')->getJson("/api/admin/reports/{$report->id}/download");

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
