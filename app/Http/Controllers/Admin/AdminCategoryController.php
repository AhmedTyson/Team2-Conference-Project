<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Services\CategoryService;

class AdminCategoryController extends Controller
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

    public function store(StoreCategoryRequest $request)
    {
        $category = $this->categoryService->store($request->validated());

        return new CategoryResource($category);
    }

    public function update(UpdateCategoryRequest $request, Category $category)
    {
        $category = $this->categoryService->update($category, $request->validated());

        return new CategoryResource($category);
    }

    public function destroy(Category $category)
    {
        $this->categoryService->destroy($category);

        return response()->json([
            'message' => 'Category deleted successfully',
        ]);
    }
}
