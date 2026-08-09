<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Resources\CategoryResource;
use App\Models\Catalog\Category;
use App\Services\Catalog\CategoryService;

class CategoryController extends Controller
{
    protected $categoryService;

    public function __construct(CategoryService $categoryService)
    {
        $this->categoryService = $categoryService;
    }

    public function index()
    {
        return response()->json([
            'success' => true,
            'message' => 'Categories fetched successfully',
            'data' => CategoryResource::collection($this->categoryService->index()),
        ]);
    }

    public function show(Category $category)
    {
        return response()->json([
            'success' => true,
            'message' => 'Category fetched successfully',
            'data' => new CategoryResource($this->categoryService->show($category)),
        ]);
    }
}
