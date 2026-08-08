<?php

namespace App\Repositories;

use App\Models\Category;

class CategoryRepository
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
