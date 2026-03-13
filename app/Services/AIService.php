<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIService
{
    protected $apiKey;
    protected $baseUrl = 'https://api.openai.com/v1';

    public function __construct()
    {
        $this->apiKey = config('services.openai.key') ?? env('OPENAI_API_KEY');
    }

    public function extract($text, $type = 'buyer')
    {
        $fields = $this->getFields($type);
        $fieldString = implode(', ', $fields);
        
        $prompt = "You are an AI assistant that extracts structured data from text or document content. 
        Extract the following fields from the provided text into a JSON object. 
        If a field is not found, use null or an empty string.
        Do not invent data. If you are unsure, leave it empty.
        
        Target Fields:
        $fieldString
        
        Text to process:
        $text
        
        Return ONLY valid JSON.";

        try {
            // Assuming the text might be long, we use a model with large context if possible, 
            // but for now gpt-4o-mini or gpt-4o is text-heavy capable.
            $response = Http::withToken($this->apiKey)->timeout(60)->post("$this->baseUrl/chat/completions", [
                'model' => 'gpt-4o', // or gpt-4-turbo
                'messages' => [
                    ['role' => 'system', 'content' => 'You are a helpful data extraction assistant. Output only JSON.'],
                    ['role' => 'user', 'content' => $prompt]
                ],
                'temperature' => 0.1,
                'response_format' => ['type' => 'json_object']
            ]);

            if ($response->successful()) {
                $content = $response->json('choices.0.message.content');
                return json_decode($content, true);
            }
            
            Log::error('OpenAI API Error: ' . $response->body());
            return null;

        } catch (\Exception $e) {
            Log::error('AI Service Exception: ' . $e->getMessage());
            return null;
        }
    }

    private function getFields($type)
    {
        $common = [
            'company_registered_name',
            'company_type',
            'year_founded',
            'details', // Description of the company
            'website',
            'linkedin',
            'twitter', 
            'facebook',
            'instagram',
            'youtube',
            'phone',
            'email', // Company email
            'employee_count',
            'headquarters_address',
            'shareholders', // List of names
            'contact_person_name',
            'contact_person_email',
            'contact_person_phone',
            'contact_person_designation',
            'hq_country_name', 
        ];

        if ($type === 'buyer') {
            return array_merge($common, [
                'investment_thesis', // reason_for_mna
                'preferred_industries',
            ]);
        }
        
        if ($type === 'seller') {
            return array_merge($common, [
                'selling_reason',
                'business_highlights',
            ]);
        }
        
        return $common;
    }
}
