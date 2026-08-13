<?php

namespace App\Console\Commands;

use App\Models\System\PasswordResetToken;
use Illuminate\Console\Command;

class ExpirePasswordTokens extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'password:expire-tokens';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete expired password reset tokens';

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