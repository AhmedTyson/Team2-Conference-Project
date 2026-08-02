<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Enums\ContactMessageStatus;

class ContactMessage extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'email', 'subject', 'message', 'status'];

    protected function casts(): array
    {
        return [
            'status' => ContactMessageStatus::class,
        ];
    }
}
