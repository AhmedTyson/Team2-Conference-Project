<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Route;
use ReflectionMethod;
use Illuminate\Foundation\Http\FormRequest;

class ExportPostman extends Command
{
    protected $signature = 'export:postman';
    protected $description = 'Export custom Postman collection without Scramble';

    public function handle()
    {
        $collection = [
            'info' => [
                'name' => 'ThreeDOS API - Fully Organized',
                'description' => 'Auto-generated Postman collection reading directly from Laravel routes and Form Requests. Organized by folders with pre-filled JSON bodies and placeholders.',
                'schema' => 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
            ],
            'auth' => [
                'type' => 'bearer',
                'bearer' => [['key' => 'token', 'value' => '{{token}}', 'type' => 'string']]
            ],
            'variable' => [
                ['key' => 'base_url', 'value' => 'http://localhost:8000', 'type' => 'string'],
                ['key' => 'token', 'value' => '', 'type' => 'string']
            ],
            'item' => []
        ];

        $folders = [];
        $count = 0;

        foreach (Route::getRoutes() as $route) {
            $uri = $route->uri();
            if (!str_starts_with($uri, 'api/v1')) continue;

            $method = $route->methods()[0];
            if ($method === 'HEAD' || $method === 'OPTIONS') continue;
            
            $count++;

            // Grouping logic
            $segments = explode('/', $uri);
            $folderName = isset($segments[2]) ? ucfirst($segments[2]) : 'General';
            if ($folderName === 'Admin' && isset($segments[3])) {
                 $folderName = 'Admin (' . ucfirst($segments[3]) . ')';
            }
            if ($folderName === 'Me' && isset($segments[3])) {
                 $folderName = 'User Profile';
            }

            $body = null;
            if (in_array($method, ['POST', 'PUT', 'PATCH'])) {
                $action = $route->getAction();
                $rules = [];
                if (isset($action['controller']) && is_string($action['controller']) && str_contains($action['controller'], '@')) {
                    list($controller, $methodName) = explode('@', $action['controller']);
                    try {
                        $ref = new ReflectionMethod($controller, $methodName);
                        foreach ($ref->getParameters() as $param) {
                            $type = $param->getType();
                            if ($type && !$type->isBuiltin() && is_subclass_of($type->getName(), FormRequest::class)) {
                                $class = $type->getName();
                                // Resolve via container to handle dependencies
                                $requestObj = app()->make($class);
                                if (method_exists($requestObj, 'rules')) {
                                    $rules = $requestObj->rules();
                                }
                            }
                        }
                    } catch (\Exception $e) {
                        // fallback if fails
                    }
                }

                // Generate Dummy JSON from Rules
                $sampleJson = [];
                foreach ($rules as $field => $rule) {
                    $fieldParts = explode('.', $field);
                    if (count($fieldParts) > 1) {
                         // Simple nested array handling
                         $parent = $fieldParts[0];
                         $child = $fieldParts[1];
                         if (!isset($sampleJson[$parent])) $sampleJson[$parent] = [];
                         if (!is_array($sampleJson[$parent])) $sampleJson[$parent] = [];
                         $sampleJson[$parent][$child] = $this->guessValue($rule, $child);
                    } else {
                         $sampleJson[$field] = $this->guessValue($rule, $field);
                    }
                }

                if (!empty($sampleJson)) {
                    $body = [
                        'mode' => 'raw',
                        'raw' => json_encode($sampleJson, JSON_PRETTY_PRINT),
                        'options' => ['raw' => ['language' => 'json']]
                    ];
                } else {
                    // Empty JSON fallback for POST/PUT without FormRequest
                    $body = [
                        'mode' => 'raw',
                        'raw' => "{\n    \n}",
                        'options' => ['raw' => ['language' => 'json']]
                    ];
                }
            }

            $item = [
                'name' => '['.$method.'] ' . $uri,
                'request' => [
                    'method' => $method,
                    'header' => [
                        ['key' => 'Accept', 'value' => 'application/json']
                    ]
                ]
            ];

            // Setup URL paths and placeholders for variables like {id}
            $rawUrl = '{{base_url}}/' . str_replace(['{', '}'], [':', ''], $uri);
            $pathArr = explode('/', str_replace(['{', '}'], [':', ''], $uri));
            
            $item['request']['url'] = [
                'raw' => $rawUrl,
                'host' => ['{{base_url}}'],
                'path' => $pathArr
            ];

            if ($body) {
                $item['request']['body'] = $body;
            }

            if (preg_match_all('/\{([a-zA-Z0-9_]+)\}/', $uri, $matches)) {
                 $item['request']['url']['variable'] = array_map(function($var) {
                     return ['key' => $var, 'value' => '1'];
                 }, $matches[1]);
            }

            $folders[$folderName][] = $item;
        }

        ksort($folders);
        
        foreach ($folders as $folderName => $items) {
            $collection['item'][] = [
                'name' => $folderName,
                'item' => $items
            ];
        }

        file_put_contents(base_path('postman_collection.json'), json_encode($collection, JSON_PRETTY_PRINT));
        $this->info("Successfully generated pristine postman_collection.json with $count endpoints!");
    }

    private function guessValue($rule, $fieldName)
    {
        $ruleStr = is_array($rule) ? implode('|', $rule) : (string)$rule;
        
        if (str_contains($ruleStr, 'integer') || str_contains($ruleStr, 'numeric')) return 1;
        if (str_contains($ruleStr, 'boolean')) return true;
        if (str_contains($ruleStr, 'email')) return 'test@example.com';
        if (str_contains($ruleStr, 'date')) return '2026-10-01';
        if (str_contains($ruleStr, 'array')) return [];
        if ($fieldName === 'password' || $fieldName === 'password_confirmation') return 'password123';
        if (str_contains($fieldName, 'name')) return 'Example Name';
        
        return 'string_value';
    }
}
