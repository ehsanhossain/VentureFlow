<?php

namespace App\Http\Controllers;

use App\Services\AIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AIController extends Controller
{
    protected $aiService;

    public function __construct(AIService $aiService)
    {
        $this->aiService = $aiService;
    }

    public function extract(Request $request)
    {
        $request->validate([
            'text' => 'required_without:url|string',
            'url' => 'required_without:text|url',
            'type' => 'required|in:buyer,seller'
        ]);

        $text = $request->text;

        if ($request->url) {
            try {
                // Fetch URL content
                // Fake a browser user agent to avoid 403s from some sites
                $response = Http::withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                ])->timeout(30)->get($request->url);

                if ($response->successful()) {
                    $html = $response->body();
                    
                    // Simple cleaning
                    $html = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', " ", $html);
                    $html = preg_replace('/<style\b[^>]*>(.*?)<\/style>/is', " ", $html);
                    $html = preg_replace('/<[^>]*>/', ' ', $html); // Strip tags replacing with space
                    $html = preg_replace('/\s+/', ' ', $html); // Collpase whitespace
                    
                    $text = trim($html);
                    // Limit text to ~30k chars to be safe for token limits while keeping enough info
                    $text = substr($text, 0, 30000); 
                } else {
                    return response()->json(['message' => 'Failed to fetch URL content. Status: ' . $response->status()], 400);
                }
            } catch (\Exception $e) {
                return response()->json(['message' => 'Error fetching URL: ' . $e->getMessage()], 400);
            }
        }

        if (empty($text)) {
             return response()->json(['message' => 'No text content found to process.'], 400);
        }

        $data = $this->aiService->extract($text, $request->type);

        if (!$data) {
            return response()->json(['message' => 'Failed to extract data via AI service.'], 500);
        }

        return response()->json(['data' => $data]);
    }
}
