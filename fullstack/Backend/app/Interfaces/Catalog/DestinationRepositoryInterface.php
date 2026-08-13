<?php

namespace App\Interfaces\Catalog;

interface DestinationRepositoryInterface
{
    public function getAll();

    public function getById($id);

    public function getForTripCreation();
}
