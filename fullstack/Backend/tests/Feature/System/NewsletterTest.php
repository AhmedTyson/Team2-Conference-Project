<?php

namespace Tests\Feature\System;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NewsletterTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_email_subscribes_with_201(): void
    {
        $response = $this->postJson('/api/newsletter/subscribe', [
            'email' => 'john@example.com',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Successfully subscribed to the newsletter.',
            ]);

        $this->assertDatabaseHas('newsletter_subscribers', [
            'email' => 'john@example.com',
        ]);
    }

    public function test_duplicate_email_returns_409_single_row(): void
    {
        $this->postJson('/api/newsletter/subscribe', [
            'email' => 'john@example.com',
        ])->assertStatus(201);

        $this->postJson('/api/newsletter/subscribe', [
            'email' => 'john@example.com',
        ])->assertStatus(409)
            ->assertJsonPath('error.type', 'ConflictError');

        $this->assertDatabaseCount('newsletter_subscribers', 1);
    }

    public function test_email_is_normalized_to_lowercase(): void
    {
        $this->postJson('/api/newsletter/subscribe', [
            'email' => '  USER@Example.COM ',
        ])->assertStatus(201);

        $this->assertDatabaseHas('newsletter_subscribers', [
            'email' => 'user@example.com',
        ]);
    }

    public function test_invalid_email_returns_422(): void
    {
        $this->postJson('/api/newsletter/subscribe', [
            'email' => 'not-an-email',
        ])->assertStatus(422)
            ->assertJsonMissing(['success' => true])
            ->assertJsonStructure(['error' => ['type', 'status', 'message', 'timestamp', 'validation_errors']]);
    }

    public function test_missing_email_returns_422(): void
    {
        $this->postJson('/api/newsletter/subscribe', [])
            ->assertStatus(422);
    }
}