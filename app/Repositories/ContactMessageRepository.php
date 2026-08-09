<?php

namespace App\Repositories;

use App\Models\ContactMessage;
use Illuminate\Database\Eloquent\Collection;

class ContactMessageRepository
{
    public function getAllForAdmin(): Collection
    {
        return ContactMessage::latest()->get();
    }

    public function findById($id): ContactMessage
    {
        return ContactMessage::findOrFail($id);
    }

    public function create(array $data): ContactMessage
    {
        return ContactMessage::create($data);
    }

    public function update(ContactMessage $message, array $data): ContactMessage
    {
        $message->update($data);
        return $message;
    }
}
