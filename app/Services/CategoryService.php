<?php

namespace App\Services;

use App\Repositories\CategoryRepository;
use App\Models\Category;

class CategoryService
{
    protected $categoryRepository;

    public function __construct(CategoryRepository $categoryRepository)
    {
        $this->categoryRepository = $categoryRepository;
    }

    public function index()
    {
        return $this->categoryRepository->getAll();
    }

    public function store(array $data)
    {
        return $this->categoryRepository->create($data);
    }

    public function show(Category $category)
    {
        return $this->categoryRepository->getById($category);
    }

    public function update(Category $category, array $data)
    {
        return $this->categoryRepository->update($category, $data);
    }

    public function destroy(Category $category)
    {
        return $this->categoryRepository->delete($category);
    }
}