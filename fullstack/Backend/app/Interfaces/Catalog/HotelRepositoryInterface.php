<?php

namespace App\Interfaces\Catalog;

interface HotelRepositoryInterface
{
    public function getAll();

    public function getById($id);

    public function create(array $data);

    public function update($id, array $data);

    public function delete($id);
}
