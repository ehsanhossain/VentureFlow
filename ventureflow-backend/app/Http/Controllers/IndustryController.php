<?php

namespace App\Http\Controllers;

use App\Models\Industry;
use Illuminate\Http\Request;

class IndustryController extends Controller
{
    public function index()
    {
        $industries = Industry::with('subIndustries')->get();

        return response()->json($industries);
    }


    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'status' => 'boolean',
        ]);

        $industry = Industry::create($data);

        return response()->json($industry, 201);
    }

    public function show(Industry $industry)
    {
        return response()->json($industry);
    }

    public function update(Request $request, Industry $industry)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'status' => 'boolean',
        ]);

        $industry->update($data);

        return response()->json($industry);
    }

    public function destroy(Industry $industry)
    {
        $industry->delete();

        return response()->json(['message' => 'Industry deleted successfully.']);
    }
}
