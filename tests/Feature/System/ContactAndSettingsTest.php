<?php

namespace Tests\Feature\System;

use App\Enums\ContactMessageStatus;
use App\Models\Account\User;
use App\Models\System\ContactMessage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ContactAndSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create standard and admin roles
        Role::create(['name' => 'traveler', 'guard_name' => 'api']);
        $adminRole = Role::create(['name' => 'admin', 'guard_name' => 'api']);

        Permission::create(['name' => 'manage contacts', 'guard_name' => 'api']);
        Permission::create(['name' => 'manage settings', 'guard_name' => 'api']);

        $adminRole->syncPermissions(['manage contacts', 'manage settings']);
    }

    public function test_public_user_can_submit_contact_message()
    {
        $payload = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'subject' => 'Test Inquiry',
            'message' => 'This is a test message.',
        ];

        $response = $this->postJson('/api/v1/contacts', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Your message has been sent successfully.',
            ]);

        $this->assertDatabaseHas('contact_messages', [
            'email' => 'john@example.com',
            'status' => ContactMessageStatus::UNREAD->value,
        ]);
    }

    public function test_admin_can_view_and_manage_contact_messages()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $message = ContactMessage::create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'subject' => 'Help',
            'message' => 'Need help',
            'status' => ContactMessageStatus::UNREAD->value,
        ]);

        // List messages
        $response = $this->actingAs($admin, 'api')->getJson('/api/v1/admin/contacts');
        $response->assertStatus(200)
            ->assertJsonPath('data.0.email', 'jane@example.com');

        // Mark as read
        $responseRead = $this->actingAs($admin, 'api')->patchJson("/api/v1/admin/contacts/{$message->id}/read");
        $responseRead->assertStatus(200)
            ->assertJsonPath('data.status', 'read');

        $this->assertDatabaseHas('contact_messages', ['id' => $message->id, 'status' => 'read']);

        // Mark as resolved
        $responseResolved = $this->actingAs($admin, 'api')->patchJson("/api/v1/admin/contacts/{$message->id}/resolve");
        $responseResolved->assertStatus(200)
            ->assertJsonPath('data.status', 'resolved');

        $this->assertDatabaseHas('contact_messages', ['id' => $message->id, 'status' => 'resolved']);
    }

    public function test_admin_can_manage_settings()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $payload = [
            'settings' => [
                ['key' => 'site_name', 'value' => 'ThreeDOS'],
                ['key' => 'support_email', 'value' => 'support@threedos.com'],
            ],
        ];

        // Put settings
        $response = $this->actingAs($admin, 'api')->putJson('/api/v1/admin/settings', $payload);
        $response->assertStatus(200)
            ->assertJsonPath('data.site_name', 'ThreeDOS')
            ->assertJsonPath('data.support_email', 'support@threedos.com');

        $this->assertDatabaseHas('settings', ['key' => 'site_name', 'value' => 'ThreeDOS']);

        // Get settings
        $getResponse = $this->actingAs($admin, 'api')->getJson('/api/v1/admin/settings');
        $getResponse->assertStatus(200)
            ->assertJsonPath('data.site_name', 'ThreeDOS');
    }

    public function test_normal_user_cannot_access_admin_endpoints()
    {
        $user = User::factory()->create();
        $user->assignRole('traveler');

        // Inbox
        $this->actingAs($user, 'api')->getJson('/api/v1/admin/contacts')->assertStatus(403);

        // Settings
        $this->actingAs($user, 'api')->getJson('/api/v1/admin/settings')->assertStatus(403);
    }
}
