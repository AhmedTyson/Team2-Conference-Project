<?php
namespace App\Enums;

enum ContactMessageStatus: string
{
    case UNREAD = 'unread';
    case READ = 'read';
    case RESOLVED = 'resolved';
}
