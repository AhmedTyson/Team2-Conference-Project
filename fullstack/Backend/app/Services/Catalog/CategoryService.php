<?php

namespace App\Services\Catalog;

use App\Interfaces\Catalog\CategoryRepositoryInterface;
use App\Models\Catalog\Category;

class CategoryService
{
    protected $categoryRepository;

    public function __construct(CategoryRepositoryInterface $categoryRepository)
    {
        $this->categoryRepository = $categoryRepository;
    }

    public function index(bool $trashed = false)
    {
        return $this->categoryRepository->getAll($trashed);
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
