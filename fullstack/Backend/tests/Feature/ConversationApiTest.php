<?php

namespace Tests\Feature;

use App\Models\Account\User;
use App\Models\Chat\Conversation;
use App\Models\System\Flag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ConversationApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected User $agency;

    protected User $otherUser;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'user', 'guard_name' => 'api']);
        Role::create(['name' => 'traveler', 'guard_name' => 'api']);
        $agencyRole = Role::create(['name' => 'agency', 'guard_name' => 'api']);
        Role::create(['name' => 'admin', 'guard_name' => 'api']);

        $this->user = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $this->user->assignRole('user');

        $this->agency = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $this->agency->assignRole('agency');

        $this->otherUser = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $this->otherUser->assignRole('user');
    }

    public function test_user_can_create_ai_conversation(): void
    {
        $response = $this->actingAs($this->user, 'api')->postJson('/api/conversations', [
            'type' => 'ai_concierge',
            'title' => 'Trip to Kyoto AI Advice',
            'initial_message' => 'What are the top cultural landmarks in Kyoto?',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.type', 'ai_concierge');

        $this->assertDatabaseHas('conversations', [
            'user_id' => $this->user->id,
            'type' => 'ai_concierge',
        ]);

        $this->assertDatabaseHas('messages', [
            'sender_id' => $this->user->id,
            'sender_type' => 'user',
        ]);
    }

    public function test_user_can_list_their_conversations(): void
    {
        Conversation::create([
            'type' => 'ai_concierge',
            'title' => 'Rome Highlights',
            'user_id' => $this->user->id,
            'last_message_at' => now(),
        ]);

        Conversation::create([
            'type' => 'direct_support',
            'title' => 'Other User Question',
            'user_id' => $this->otherUser->id,
            'last_message_at' => now(),
        ]);

        $response = $this->actingAs($this->user, 'api')->getJson('/api/conversations');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');
    }

    public function test_user_can_send_message_in_conversation(): void
    {
        $conversation = Conversation::create([
            'type' => 'agency_inquiry',
            'title' => 'Custom Safari Itinerary',
            'user_id' => $this->user->id,
            'agency_id' => $this->agency->id,
            'last_message_at' => now(),
        ]);

        $response = $this->actingAs($this->user, 'api')
            ->postJson("/api/conversations/{$conversation->id}/messages", [
                'body' => 'Hello, could you provide pricing for a 5-day Serengeti tour?',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.message.sender_type', 'user');

        $this->assertDatabaseHas('messages', [
            'conversation_id' => $conversation->id,
            'sender_id' => $this->user->id,
            'body' => 'Hello, could you provide pricing for a 5-day Serengeti tour?',
        ]);
    }

    public function test_unauthorized_user_cannot_view_conversation(): void
    {
        $conversation = Conversation::create([
            'type' => 'direct_support',
            'title' => 'Private Issue',
            'user_id' => $this->user->id,
            'last_message_at' => now(),
        ]);

        $response = $this->actingAs($this->otherUser, 'api')
            ->getJson("/api/conversations/{$conversation->id}");

        $response->assertStatus(403);
    }

    public function test_user_can_mark_conversation_as_read(): void
    {
        $conversation = Conversation::create([
            'type' => 'agency_inquiry',
            'title' => 'Inquiry',
            'user_id' => $this->user->id,
            'agency_id' => $this->agency->id,
        ]);

        $msg = $conversation->messages()->create([
            'sender_id' => $this->agency->id,
            'sender_type' => 'agency',
            'body' => 'We have sent you the customized proposal.',
            'is_read' => false,
        ]);

        $response = $this->actingAs($this->user, 'api')
            ->patchJson("/api/conversations/{$conversation->id}/read");

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('messages', [
            'id' => $msg->id,
            'is_read' => 1,
        ]);
    }

    public function test_admin_cannot_view_unreported_conversation_unless_flagged(): void
    {
        $admin = User::factory()->create(['email_verified_at' => now()]);
        $admin->assignRole('admin');

        $conversation = Conversation::create([
            'type' => 'agency_inquiry',
            'title' => 'Private Customer-Agency Discussion',
            'user_id' => $this->user->id,
            'agency_id' => $this->agency->id,
        ]);

        // Unreported chat: Admin MUST be denied access (403 Forbidden)
        $this->actingAs($admin, 'api')
            ->getJson("/api/conversations/{$conversation->id}")
            ->assertStatus(403);

        // Once a Flag report is created on the user/agency, Admin CAN view it
        Flag::create([
            'reporter_id' => $this->user->id,
            'flaggable_type' => 'user',
            'flaggable_id' => $this->agency->id,
            'reason' => 'inappropriate_content',
            'details' => 'Customer reported agency conduct',
            'status' => 'pending',
        ]);

        $this->actingAs($admin, 'api')
            ->getJson("/api/conversations/{$conversation->id}")
            ->assertOk();
    }

    public function test_admin_index_query_excludes_unreported_conversations(): void
    {
        $admin = User::factory()->create(['email_verified_at' => now()]);
        $admin->assignRole('admin');

        $conversation = Conversation::create([
            'type' => 'agency_inquiry',
            'title' => 'Unreported Private Chat',
            'user_id' => $this->user->id,
            'agency_id' => $this->agency->id,
            'last_message_at' => now(),
        ]);

        // Unreported chat MUST NOT appear in admin's /api/conversations list
        $response = $this->actingAs($admin, 'api')->getJson('/api/conversations');
        $response->assertOk()
            ->assertJsonCount(0, 'data');

        // After flag report is submitted, it appears in admin's moderation list
        Flag::create([
            'reporter_id' => $this->user->id,
            'flaggable_type' => 'user',
            'flaggable_id' => $this->agency->id,
            'reason' => 'inappropriate_content',
            'details' => 'Reported chat',
            'status' => 'pending',
        ]);

        $responseAfterFlag = $this->actingAs($admin, 'api')->getJson('/api/conversations');
        $responseAfterFlag->assertOk()
            ->assertJsonCount(1, 'data');
    }
}
