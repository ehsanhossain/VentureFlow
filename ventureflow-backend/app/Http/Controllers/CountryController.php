<?php

namespace App\Http\Controllers;

use App\Models\Country;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class CountryController extends Controller
{
    // Get all countries
    public function index()
    {
        $countries = Country::all()->map(function ($country) {
            return [
                'id' => $country->id,
                'name' => $country->name,
                'alpha_2_code' => $country->alpha_2_code,
                'alpha_3_code' => $country->alpha_3_code,
                'numeric_code' => $country->numeric_code,
                'svg_icon_url' => "https://flagcdn.com/" . strtolower($country->alpha_2_code) . ".svg",
            ];
        });

        return response()->json($countries, Response::HTTP_OK);
    }

    // Get a specific country by ID
    public function show($id)
    {
        $country = Country::find($id);

        if (!$country) {
            return response()->json(['message' => 'Country not found'], Response::HTTP_NOT_FOUND);
        }

        return response()->json($country, Response::HTTP_OK);
    }

    // Store a new country
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'alpha_2_code' => 'required|string|max:2',
            'alpha_3_code' => 'required|string|max:3',
            'numeric_code' => 'required|integer',
            'svg_icon' => 'required|string|max:255',
        ]);

        $country = Country::create($request->all());

        return response()->json($country, Response::HTTP_CREATED);
    }

    // Update an existing country
    public function update(Request $request, $id)
    {
        $country = Country::find($id);

        if (!$country) {
            return response()->json(['message' => 'Country not found'], Response::HTTP_NOT_FOUND);
        }

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'alpha_2_code' => 'sometimes|required|string|max:2',
            'alpha_3_code' => 'sometimes|required|string|max:3',
            'numeric_code' => 'sometimes|required|integer',
            'svg_icon' => 'sometimes|required|string|max:255',
        ]);

        $country->update($request->all());

        return response()->json($country, Response::HTTP_OK);
    }

    // Delete a country
    public function destroy($id)
    {
        $country = Country::find($id);

        if (!$country) {
            return response()->json(['message' => 'Country not found'], Response::HTTP_NOT_FOUND);
        }

        $country->delete();

        return response()->json(['message' => 'Country deleted successfully'], Response::HTTP_NO_CONTENT);
    }
}
