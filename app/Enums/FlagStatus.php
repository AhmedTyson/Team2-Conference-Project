<?php

namespace App\Enums;

enum FlagStatus: string
{
   public const PENDING = 'pending';
   public const APPROVED = 'approved';
   public const DECLINED = 'declined';
}
