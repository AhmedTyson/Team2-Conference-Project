<?php

namespace App\Console\Commands;

use App\Models\System\PasswordResetToken;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('password:expire-tokens')]
#[Description('Delete expired password reset tokens')]
class ExpirePasswordTokens extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $expiredTokens = PasswordResetToken::where('expires_at', '<', now())->get();

        if ($expiredTokens->isEmpty()) {
            $this->info('No expired password reset tokens found.');

            return self::SUCCESS;
        }

        $count = $expiredTokens->count();
        $expiredTokens->each(function ($token) {
            $token->delete();
        });

        $this->info("Deleted {$count} expired password reset token(s).");

        return self::SUCCESS;
    }
}
