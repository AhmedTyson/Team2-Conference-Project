<?php

namespace App\Http\Controllers;

use App\Enums\ContactMessageStatus;
use App\Http\Requests\StoreContactMessageRequest;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;

class ContactController extends Controller
{
    /**
     * Submit a new contact inquiry.
     */
    public function store(StoreContactMessageRequest $request): JsonResponse
    {
        $message = ContactMessage::create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'subject' => $request->validated('subject'),
            'message' => $request->validated('message'),
            'status' => ContactMessageStatus::UNREAD->value,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Your message has been sent successfully.',
        ], 201);
    }
}
