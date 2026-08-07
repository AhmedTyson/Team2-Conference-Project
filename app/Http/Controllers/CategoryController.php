<?php

namespace App\Http\Controllers;

use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Services\CategoryService;

class CategoryController extends Controller
{
    protected $categoryService;

    public function __construct(CategoryService $categoryService)
    {
        $this->categoryService = $categoryService;
    }

    public function index()
    {
        return CategoryResource::collection($this->categoryService->index());
    }

    public function show(Category $category)
    {
        return new CategoryResource($this->categoryService->show($category));
    }
}
