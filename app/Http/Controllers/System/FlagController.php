<?php

namespace App\Http\Controllers\System;

use App\Models\System\Flag;
use Illuminate\Http\Request;

class FlagController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
        
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreFlagRequest $request)
    {
        $flag = FlagService::create($request->validated());

        return response()->json([
            'message' => 'Flag submitted successfully',
            'flag' => $flag,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Flag $flag)
    {

        
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Flag $flag)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Flag $flag)
    {
        //
    }
}
