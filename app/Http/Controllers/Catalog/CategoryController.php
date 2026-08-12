<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Catalog\Category;
use App\Services\Catalog\CategoryService;
use App\Support\ApiResponse;

class CategoryController extends Controller
{
    protected $categoryService;

    public function __construct(CategoryService $categoryService)
    {
        $this->categoryService = $categoryService;
    }

    public function index()
    {
        return ApiResponse::success(CategoryResource::collection($this->categoryService->index()), 'Categories fetched successfully');
    }

    public function show(Category $category)
    {
        return ApiResponse::success(new CategoryResource($this->categoryService->show($category)), 'Category fetched successfully');
    }
}
