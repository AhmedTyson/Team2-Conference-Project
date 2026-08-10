<?php

namespace App\Repositories\Catalog;

use App\Interfaces\Catalog\CategoryRepositoryInterface;
use App\Models\Catalog\Category;

class CategoryRepository implements CategoryRepositoryInterface
{
    public function getAll()
    {
        return Category::all();
    }

    public function create(array $data)
    {
        return Category::create($data);
    }

    public function getById(Category $category)
    {
        return $category;
    }

    public function update(Category $category, array $data)
    {
        $category->update($data);

        return $category;
    }

    public function delete(Category $category)
    {
        $category->delete();

        return true;
    }
}
