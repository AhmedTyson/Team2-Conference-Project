<?php

namespace App\Interfaces;

use App\Models\Category;
use Illuminate\Database\Eloquent\Collection;

interface CategoryRepositoryInterface
{
    public function getAll();

    public function create(array $data);

    public function getById(Category $category);

    public function update(Category $category, array $data);

    public function delete(Category $category);

}
