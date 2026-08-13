<?php

namespace App\Interfaces\Catalog;

use App\Models\Catalog\Category;

interface CategoryRepositoryInterface
{
    public function getAll(bool $trashed = false);

    public function create(array $data);

    public function getById(Category $category);

    public function update(Category $category, array $data);

    public function delete(Category $category);
}
