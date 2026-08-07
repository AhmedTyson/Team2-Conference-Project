<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Services\CategoryService;
use Illuminate\Http\Request;

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

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:100',
        ]);

        $category = $this->categoryService->store($request->all());

        return new CategoryResource($category);
    }

    public function update(Request $request, Category $category)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:100',
        ]);

        $category = $this->categoryService->update($category, $request->all());

        return new CategoryResource($category);
    }

    public function destroy(Category $category)
    {
        $this->categoryService->destroy($category);

        return response()->json([
            'message' => 'Category deleted successfully'
        ]);
    }
}