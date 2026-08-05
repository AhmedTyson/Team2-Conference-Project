<?php

namespace Tests\Unit;

use App\Enums\BudgetLevel;
use App\Enums\ContactMessageStatus;
use App\Enums\FlightStatus;
use App\Enums\ReviewStatus;
use App\Enums\TripStatus;
use BackedEnum;
use PHPUnit\Framework\TestCase;

class EnumTest extends TestCase
{
    public function test_trip_status_cases_and_values(): void
    {
        $this->assertSame(
            ['PENDING', 'PLANNING', 'BOOKED', 'COMPLETED', 'CANCELLED'],
            array_column(TripStatus::cases(), 'name')
        );
        $this->assertSame(
            ['pending', 'planning', 'booked', 'completed', 'cancelled'],
            array_column(TripStatus::cases(), 'value')
        );
        $this->assertInstanceOf(BackedEnum::class, TripStatus::PENDING);
        $this->assertSame('pending', TripStatus::PENDING->value);
        $this->assertSame('planning', TripStatus::PLANNING->value);
        $this->assertSame('booked', TripStatus::BOOKED->value);
        $this->assertSame('completed', TripStatus::COMPLETED->value);
        $this->assertSame('cancelled', TripStatus::CANCELLED->value);
        $this->assertSame(TripStatus::COMPLETED, TripStatus::from('completed'));
    }

    public function test_review_status_cases_and_values(): void
    {
        $this->assertSame(
            ['PENDING', 'APPROVED', 'REJECTED'],
            array_column(ReviewStatus::cases(), 'name')
        );
        $this->assertSame(
            ['pending', 'approved', 'rejected'],
            array_column(ReviewStatus::cases(), 'value')
        );
        $this->assertInstanceOf(BackedEnum::class, ReviewStatus::PENDING);
        $this->assertSame('pending', ReviewStatus::PENDING->value);
        $this->assertSame('approved', ReviewStatus::APPROVED->value);
        $this->assertSame('rejected', ReviewStatus::REJECTED->value);
        $this->assertSame(ReviewStatus::APPROVED, ReviewStatus::from('approved'));
    }

    public function test_contact_message_status_cases_and_values(): void
    {
        $this->assertSame(
            ['UNREAD', 'READ', 'RESOLVED'],
            array_column(ContactMessageStatus::cases(), 'name')
        );
        $this->assertSame(
            ['unread', 'read', 'resolved'],
            array_column(ContactMessageStatus::cases(), 'value')
        );
        $this->assertInstanceOf(BackedEnum::class, ContactMessageStatus::UNREAD);
        $this->assertSame('unread', ContactMessageStatus::UNREAD->value);
        $this->assertSame('read', ContactMessageStatus::READ->value);
        $this->assertSame('resolved', ContactMessageStatus::RESOLVED->value);
        $this->assertSame(ContactMessageStatus::RESOLVED, ContactMessageStatus::from('resolved'));
    }

    public function test_budget_level_cases_and_values(): void
    {
        $this->assertSame(
            ['LOW', 'MEDIUM', 'HIGH', 'LUXURY'],
            array_column(BudgetLevel::cases(), 'name')
        );
        $this->assertSame(
            ['low', 'medium', 'high', 'luxury'],
            array_column(BudgetLevel::cases(), 'value')
        );
        $this->assertInstanceOf(BackedEnum::class, BudgetLevel::LOW);
        $this->assertSame('low', BudgetLevel::LOW->value);
        $this->assertSame('medium', BudgetLevel::MEDIUM->value);
        $this->assertSame('high', BudgetLevel::HIGH->value);
        $this->assertSame('luxury', BudgetLevel::LUXURY->value);
        $this->assertSame(BudgetLevel::LUXURY, BudgetLevel::from('luxury'));
    }

    public function test_flight_status_cases_and_values(): void
    {
        $this->assertSame(
            ['PENDING', 'CONFIRMED', 'CANCELLED'],
            array_column(FlightStatus::cases(), 'name')
        );
        $this->assertSame(
            ['pending', 'confirmed', 'cancelled'],
            array_column(FlightStatus::cases(), 'value')
        );
        $this->assertInstanceOf(BackedEnum::class, FlightStatus::PENDING);
        $this->assertSame('pending', FlightStatus::PENDING->value);
        $this->assertSame('confirmed', FlightStatus::CONFIRMED->value);
        $this->assertSame('cancelled', FlightStatus::CANCELLED->value);
        $this->assertSame(FlightStatus::CONFIRMED, FlightStatus::from('confirmed'));
    }
}
