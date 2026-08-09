<?php

namespace App\Interfaces;

use App\Models\ContactMessage;
use Illuminate\Database\Eloquent\Collection;

interface ContactMessageRepositoryInterface
{
    public function getAllForAdmin(): Collection;

    public function findById($id): ContactMessage;

    public function create(array $data): ContactMessage;

    public function update(ContactMessage $message, array $data): ContactMessage;

}
