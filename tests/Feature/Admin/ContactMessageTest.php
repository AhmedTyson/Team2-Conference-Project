<?php

namespace Tests\Feature\Admin;

use App\Enums\ContactMessageStatus;
use App\Models\ContactMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ContactMessageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'traveler', 'guard_name' => 'api']);
        $adminRole = Role::create(['name' => 'admin', 'guard_name' => 'api']);

        Permission::create(['name' => 'manage contacts', 'guard_name' => 'api']);
        $adminRole->syncPermissions(['manage contacts']);
    }

    private function makeMessage(array $overrides = []): ContactMessage
    {
        return ContactMessage::create(array_merge([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'subject' => 'Booking help',
            'message' => 'Need assistance with a booking.',
            'status' => ContactMessageStatus::UNREAD->value,
        ], $overrides));
    }

    public function test_admin_can_list_contact_messages(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->makeMessage(['email' => 'first@example.com']);
        $this->makeMessage(['email' => 'second@example.com']);

        $response = $this->actingAs($admin, 'api')->getJson('/api/v1/admin/contacts');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_admin_can_mark_contact_message_as_read(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $message = $this->makeMessage();

        $response = $this->actingAs($admin, 'api')
            ->patchJson("/api/v1/admin/contacts/{$message->id}/read");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Message marked as read.')
            ->assertJsonPath('data.status', 'read');

        $this->assertDatabaseHas('contact_messages', [
            'id' => $message->id,
            'status' => ContactMessageStatus::READ->value,
        ]);
    }

    public function test_admin_can_mark_contact_message_as_resolved(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $message = $this->makeMessage();

        $response = $this->actingAs($admin, 'api')
            ->patchJson("/api/v1/admin/contacts/{$message->id}/resolve");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Message marked as resolved.')
            ->assertJsonPath('data.status', 'resolved');

        $this->assertDatabaseHas('contact_messages', [
            'id' => $message->id,
            'status' => ContactMessageStatus::RESOLVED->value,
        ]);
    }

    public function test_traveler_cannot_access_contact_inbox(): void
    {
        $user = User::factory()->create();
        $user->assignRole('traveler');

        $message = $this->makeMessage();

        $this->actingAs($user, 'api')->getJson('/api/v1/admin/contacts')->assertStatus(403);
        $this->actingAs($user, 'api')->patchJson("/api/v1/admin/contacts/{$message->id}/read")->assertStatus(403);
        $this->actingAs($user, 'api')->patchJson("/api/v1/admin/contacts/{$message->id}/resolve")->assertStatus(403);
    }
}