<?php
namespace App\Enums;

enum NotificationStatus: string
{
    case READ = 'read';
    case UNREAD = 'unread';
}
