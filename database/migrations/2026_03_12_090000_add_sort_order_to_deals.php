<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('deals', function (Blueprint $table) {
            $table->integer('sort_order')->default(0)->after('status');
        });

        // Backfill: assign sequential sort_order per stage, ordered by updated_at
        $deals = DB::table('deals')
            ->orderBy('stage_code')
            ->orderBy('updated_at', 'desc')
            ->get();

        $stageCounters = [];
        foreach ($deals as $deal) {
            $key = $deal->stage_code . '_' . $deal->pipeline_type;
            if (!isset($stageCounters[$key])) {
                $stageCounters[$key] = 0;
            }
            DB::table('deals')
                ->where('id', $deal->id)
                ->update(['sort_order' => $stageCounters[$key]++]);
        }
    }

    public function down(): void
    {
        Schema::table('deals', function (Blueprint $table) {
            $table->dropColumn('sort_order');
        });
    }
};
