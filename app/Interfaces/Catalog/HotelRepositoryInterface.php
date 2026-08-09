<?php

namespace App\Interfaces\Catalog;

use App\Models\Catalog\Hotel;
use Illuminate\Database\Eloquent\Collection;

interface HotelRepositoryInterface
{
    public function getAll();

    public function getById($id);

    public function create(array $data);

    public function update($id, array $data);

    public function delete($id);

}
