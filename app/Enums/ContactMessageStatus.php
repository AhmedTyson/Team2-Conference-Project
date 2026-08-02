<?php
namespace App\Enums;

enum ContactMessageStatus: string
{
    case PENDING = 'pending';
    case RESOLVED = 'resolved';
}
