<?php

namespace Tests\Unit;

use App\Models\Attraction;
use App\Models\Destination;
use App\Models\Flight;
use App\Models\Hotel;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\Relation;
use Tests\TestCase;

class MorphMapTest extends TestCase
{
    public function test_aliases_resolve_to_models(): void
    {
        $map = [
            'user' => User::class,
            'hotel' => Hotel::class,
            'restaurant' => Restaurant::class,
            'attraction' => Attraction::class,
            'destination' => Destination::class,
            'flight' => Flight::class,
        ];

        foreach ($map as $alias => $class) {
            $this->assertSame(
                $class,
                Relation::getMorphedModel($alias),
                "Alias '{$alias}' should resolve to {$class}"
            );
        }
    }

    public function test_model_classes_resolve_to_aliases(): void
    {
        $this->assertSame('user', Relation::getMorphAlias(User::class));
        $this->assertSame('hotel', Relation::getMorphAlias(Hotel::class));
        $this->assertSame('restaurant', Relation::getMorphAlias(Restaurant::class));
        $this->assertSame('attraction', Relation::getMorphAlias(Attraction::class));
        $this->assertSame('destination', Relation::getMorphAlias(Destination::class));
        $this->assertSame('flight', Relation::getMorphAlias(Flight::class));
    }

    public function test_full_class_names_are_not_accepted_as_aliases(): void
    {
        $this->assertNull(Relation::getMorphedModel(Hotel::class));
        $this->assertNull(Relation::getMorphedModel(User::class));
        $this->assertNull(Relation::getMorphedModel('App\\Models\\Flight'));
    }
}
