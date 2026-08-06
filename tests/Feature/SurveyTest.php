<?php

namespace Tests\Feature;

use App\Models\Survey;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SurveyTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_survey(): void
    {
        $user = User::factory()->create();

        $payload = [
            'travel_style' => 'Adventure',
            'budget_level' => 'low',
            'interests' => ['Beaches', 'Hiking'],
        ];

        $response = $this->actingAs($user, 'api')
            ->postJson('/api/surveys', $payload);

        $response->assertStatus(201)
                 ->assertJsonPath('message', 'Survey created successfully')
                 ->assertJsonPath('data.travel_style', 'Adventure');

        $this->assertDatabaseHas('surveys', [
            'user_id' => $user->id,
            'travel_style' => 'Adventure',
            'budget_level' => 'low',
        ]);
    }

    public function test_index_returns_only_own_surveys(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        $own = Survey::factory()->create(['user_id' => $user->id]);
        Survey::factory()->create(['user_id' => $other->id]);

        $response = $this->actingAs($user, 'api')->getJson('/api/surveys');

        $response->assertStatus(200)
                 ->assertJsonPath('message', 'Surveys retrieved successfully');

        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertContains($own->id, $ids);
        $this->assertCount(1, $ids);
    }

    public function test_user_can_view_own_survey(): void
    {
        $user = User::factory()->create();
        $survey = Survey::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user, 'api')
            ->getJson("/api/surveys/{$survey->id}")
            ->assertStatus(200)
            ->assertJsonPath('message', 'Survey retrieved successfully')
            ->assertJsonPath('data.id', $survey->id);
    }

    public function test_user_can_update_own_survey(): void
    {
        $user = User::factory()->create();
        $survey = Survey::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user, 'api')
            ->putJson("/api/surveys/{$survey->id}", ['travel_style' => 'Luxury'])
            ->assertStatus(200)
            ->assertJsonPath('message', 'Survey updated successfully');

        $this->assertDatabaseHas('surveys', [
            'id' => $survey->id,
            'travel_style' => 'Luxury',
        ]);
    }

    public function test_user_can_delete_own_survey(): void
    {
        $user = User::factory()->create();
        $survey = Survey::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user, 'api')
            ->deleteJson("/api/surveys/{$survey->id}")
            ->assertStatus(200)
            ->assertJsonPath('message', 'Survey deleted successfully');

        $this->assertDatabaseMissing('surveys', ['id' => $survey->id]);
    }

    public function test_unauthenticated_user_cannot_access_surveys(): void
    {
        $this->getJson('/api/surveys')->assertStatus(401);
        $this->postJson('/api/surveys', ['travel_style' => 'Adventure'])->assertStatus(401);
    }
}
