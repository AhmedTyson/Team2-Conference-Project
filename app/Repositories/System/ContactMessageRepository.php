<?php

namespace App\Repositories\System;

use App\Interfaces\System\ContactMessageRepositoryInterface;
use App\Models\System\ContactMessage;
use Illuminate\Database\Eloquent\Collection;

class ContactMessageRepository implements ContactMessageRepositoryInterface
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
