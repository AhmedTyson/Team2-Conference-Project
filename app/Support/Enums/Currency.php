<?php

namespace App\Support\Enums;

final enum Currency: string
{
    case EGP = 'EGP';
    case USD = 'USD';
    case EUR = 'EUR';
    case SAR = 'SAR';
    case AED = 'AED';

    public static function supported(): array
    {
        return [
            self::EGP->value,
            self::USD->value,
            self::EUR->value,
            self::SAR->value,
            self::AED->value,
        ];
    }

    public function isMajor(): bool
    {
        return in_array($this->value, [self::USD->value, self::EUR->value]);
    }
}