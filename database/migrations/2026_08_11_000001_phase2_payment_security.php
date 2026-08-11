<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // Encrypted payloads are opaque strings, not valid JSON.
            $table->text('raw_payload')->change();
            $table->text('client_secret')->nullable()->after('currency');
            $table->text('checkout_url')->nullable()->after('client_secret');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('idempotency_key', 64)->nullable()->after('status');
            $table->timestamp('expires_at')->nullable()->after('total_cents');
            $table->index(['user_id', 'idempotency_key']);
        });

        $this->encryptExistingPayloads();
        $this->maskExistingCardPan();
        $this->seedOrderExpiry();
    }

    public function down(): void
    {
        foreach (DB::table('payments')->get(['id', 'raw_payload']) as $row) {
            $value = $row->raw_payload;

            if (! is_string($value) || ! str_starts_with($value, ':')) {
                continue;
            }

            try {
                $decrypted = Crypt::decryptString($value);
                $decoded = json_decode($decrypted, true);

                DB::table('payments')->where('id', $row->id)->update([
                    'raw_payload' => $decoded !== null ? json_encode($decoded) : $decrypted,
                ]);
            } catch (Throwable) {
                // Leave undecryptable rows untouched rather than destroying history.
            }
        }

        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['client_secret', 'checkout_url']);
            $table->json('raw_payload')->change();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'idempotency_key']);
            $table->dropColumn(['idempotency_key', 'expires_at']);
        });
    }

    private function encryptExistingPayloads(): void
    {
        foreach (DB::table('payments')->get(['id', 'raw_payload']) as $row) {
            $value = $row->raw_payload;

            if (! is_string($value) || str_starts_with($value, ':')) {
                continue;
            }

            $decoded = json_decode($value, true);
            $stored = $decoded !== null ? $decoded : $value;

            DB::table('payments')->where('id', $row->id)->update([
                'raw_payload' => Crypt::encryptString(json_encode($stored)),
            ]);
        }
    }

    private function maskExistingCardPan(): void
    {
        foreach (DB::table('payments')->whereNotNull('card_pan')->get(['id', 'card_pan']) as $row) {
            $digits = preg_replace('/[^0-9]/', '', (string) $row->card_pan);
            $lastFour = $digits !== '' ? substr($digits, -4) : null;

            DB::table('payments')->where('id', $row->id)->update(['card_pan' => $lastFour]);
        }
    }

    private function seedOrderExpiry(): void
    {
        foreach (DB::table('orders')->whereNull('expires_at')->get(['id', 'created_at']) as $row) {
            $createdAt = $row->created_at ? Carbon::parse($row->created_at) : now();

            DB::table('orders')->where('id', $row->id)->update([
                'expires_at' => $createdAt->copy()->addMinutes(30),
            ]);
        }
    }
};
