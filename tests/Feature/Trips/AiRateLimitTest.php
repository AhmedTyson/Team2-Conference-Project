<?php

namespace Tests\Feature\Trips;

use App\Models\Account\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use LucianoTonet\GroqLaravel\Facades\Groq;
use Mockery;
use Tests\TestCase;

class AiRateLimitTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['groq.api_key' => 'test-key']);
        config(['ai.rate_limit_per_day' => 3]);

        $this->user = User::factory()->create();
    }

    public function test_enhance_allows_requests_within_limit(): void
    {
        $this->mockGroq();

        $response = $this->actingAs($this->user, 'api')->postJson('/api/enhance', [
            'content' => 'Plan a trip to Paris',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    public function test_enhance_rejects_request_over_limit(): void
    {
        $this->mockGroq();

        foreach (range(1, 3) as $i) {
            $this->actingAs($this->user, 'api')->postJson('/api/enhance', [
                'content' => "Prompt $i",
            ])->assertStatus(200);
        }

        $response = $this->actingAs($this->user, 'api')->postJson('/api/enhance', [
            'content' => 'Prompt 4',
        ]);

        $response->assertStatus(429)
            ->assertJsonStructure(['error' => ['type', 'status', 'message', 'timestamp']])
            ->assertJsonPath('error.status', 429);
    }

    public function test_rate_limit_is_per_user_not_shared(): void
    {
        $this->mockGroq();
        $otherUser = User::factory()->create();

        foreach (range(1, 3) as $i) {
            $this->actingAs($this->user, 'api')->postJson('/api/enhance', [
                'content' => "Prompt $i",
            ])->assertStatus(200);
        }

        $this->actingAs($this->user, 'api')->postJson('/api/enhance', [
            'content' => 'Over limit',
        ])->assertStatus(429);

        $this->actingAs($otherUser, 'api')->postJson('/api/enhance', [
            'content' => 'Fresh user',
        ])->assertStatus(200);
    }

    public function test_concierge_endpoint_shares_ai_limiter(): void
    {
        $this->mockGroq();

        $trip = \App\Models\Trips\Trip::factory()->create(['user_id' => $this->user->id]);

        $this->actingAs($this->user, 'api')->postJson("/api/v1/trips/{$trip->id}/concierge", [
            'message' => 'Suggest a restaurant',
        ])->assertStatus(200);

        $this->actingAs($this->user, 'api')->postJson('/api/enhance', [
            'content' => 'First',
        ])->assertStatus(200);

        $this->actingAs($this->user, 'api')->postJson('/api/enhance', [
            'content' => 'Second',
        ])->assertStatus(200);

        $this->actingAs($this->user, 'api')->postJson("/api/v1/trips/{$trip->id}/concierge", [
            'message' => 'One more',
        ])->assertStatus(429);
    }

    private function mockGroq(): void
    {
        $chain = Mockery::mock();
        $chain->shouldReceive('completions')->andReturnSelf();
        $chain->shouldReceive('create')->andReturn([
            'choices' => [
                ['message' => ['content' => 'Enhanced content']],
            ],
        ]);

        $chat = Mockery::mock();
        $chat->shouldReceive('completions')->zeroOrMoreTimes()->andReturn($chain);

        Groq::shouldReceive('chat')->zeroOrMoreTimes()->andReturn($chat);
    }
}
