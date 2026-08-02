<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SeedFresh extends Command
{
    protected $signature = 'db:seed:fresh {--only= : Comma-separated list of entities to sync first} {--limit=20 : Maximum number of records to fetch per entity}';
    protected $description = 'Refresh external API fixtures and run database migrations & seeding.';

    public function handle()
    {
        $only = $this->option('only');
        $limit = $this->option('limit');

        $this->info("Step 1: Fetching fresh fixtures from external APIs...");
        $syncExitCode = $this->call('fixtures:sync', [
            '--only' => $only,
            '--limit' => $limit
        ]);

        if ($syncExitCode !== 0) {
            $this->error('Fixture sync failed! Aborting database seeding.');
            return 1;
        }

        $this->newLine();
        $this->info("Step 2: Wiping database tables, running migrations, and seeding standard database...");
        $seedExitCode = $this->call('migrate:fresh', [
            '--seed' => true
        ]);

        if ($seedExitCode !== 0) {
            $this->error('Database migration/seeding failed!');
            return 1;
        }

        $this->info('db:seed:fresh completed successfully!');
        return 0;
    }
}
