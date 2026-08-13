<?php

namespace Tests\Feature\System;

use App\Enums\BudgetLevel;
use App\Models\Account\User;
use App\Models\System\Survey;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SurveyValidationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'traveler', 'guard_name' => 'api']);
        $this->user = User::factory()->create();
        $this->user->assignRole('traveler');
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'travel_style' => 'Adventure',
            'budget_level' => 'medium',
            'interests' => ['Hiking', 'Food'],
        ], $overrides);
    }

    public function test_authenticated_user_can_create_survey(): void
    {
        $response = $this->actingAs($this->user, 'api')->postJson('/api/surveys', $this->validPayload());

        $response->assertStatus(201)
            ->assertJson(['message' => 'Survey created successfully']);

        $this->assertDatabaseHas('surveys', [
            'user_id' => $this->user->id,
            'travel_style' => 'Adventure',
            'budget_level' => 'medium',
        ]);
    }

    public function test_budget_level_rejects_invalid_enum_value(): void
    {
        $response = $this->actingAs($this->user, 'api')->postJson('/api/surveys', $this->validPayload([
            'budget_level' => 'ultra-mega-rich',
        ]));

        $response->assertStatus(422)
            ->assertJsonFragment(['field' => 'budget_level']);

        $this->assertDatabaseCount('surveys', 0);
    }

    public function test_budget_level_accepts_all_enum_values(): void
    {
        foreach (BudgetLevel::cases() as $case) {
            $response = $this->actingAs($this->user, 'api')->postJson('/api/surveys', $this->validPayload([
                'budget_level' => $case->value,
            ]));

            $response->assertStatus(201);
        }

        $this->assertDatabaseCount('surveys', count(BudgetLevel::cases()));
    }

    public function test_missing_required_fields_rejected(): void
    {
        $response = $this->actingAs($this->user, 'api')->postJson('/api/surveys', []);

        $response->assertStatus(422)
            ->assertJsonFragment(['field' => 'travel_style'])
            ->assertJsonFragment(['field' => 'budget_level'])
            ->assertJsonFragment(['field' => 'interests']);
    }

    public function test_interests_must_be_array_of_strings(): void
    {
        $response = $this->actingAs($this->user, 'api')->postJson('/api/surveys', $this->validPayload([
            'interests' => ['Hiking', 42, ['nested']],
        ]));

        $response->assertStatus(422)
            ->assertJsonFragment(['field' => 'interests.1'])
            ->assertJsonFragment(['field' => 'interests.2']);
    }

    public function test_user_is_forced_into_their_own_record_on_store(): void
    {
        $otherUser = User::factory()->create();

        $response = $this->actingAs($this->user, 'api')->postJson('/api/surveys', $this->validPayload([
            'user_id' => $otherUser->id,
        ]));

        $response->assertStatus(201);

        $this->assertDatabaseHas('surveys', [
            'user_id' => $this->user->id,
            'travel_style' => 'Adventure',
        ]);

        $this->assertDatabaseMissing('surveys', ['user_id' => $otherUser->id]);
    }

    public function test_user_can_update_own_survey(): void
    {
        $survey = Survey::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user, 'api')->putJson("/api/surveys/{$survey->id}", [
            'budget_level' => 'luxury',
        ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Survey updated successfully']);

        $this->assertDatabaseHas('surveys', [
            'id' => $survey->id,
            'budget_level' => 'luxury',
        ]);
    }

    public function test_update_rejects_invalid_budget_level(): void
    {
        $survey = Survey::factory()->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user, 'api')->putJson("/api/surveys/{$survey->id}", [
            'budget_level' => 'not-a-budget',
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment(['field' => 'budget_level']);

        $this->assertDatabaseHas('surveys', ['id' => $survey->id, 'budget_level' => $survey->budget_level->value]);
    }

    public function test_user_cannot_update_others_survey(): void
    {
        $otherUser = User::factory()->create();
        $survey = Survey::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($this->user, 'api')->putJson("/api/surveys/{$survey->id}", [
            'travel_style' => 'Hacked',
        ]);

        $response->assertStatus(404);
    }

    public function test_post_survey_persists_interests_as_array(): void
    {
        $interests = ['Beaches', 'Museums'];

        $response = $this->actingAs($this->user, 'api')->postJson('/api/surveys', $this->validPayload([
            'interests' => $interests,
        ]));

        $response->assertStatus(201);

        $this->assertEquals($interests, Survey::first()->interests);
    }
}
