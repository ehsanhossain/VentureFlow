<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {



    public function up()
    {
        Schema::table('employees', function (Blueprint $table) {
            // Rename old string columns (backup optional)
            $table->dropColumn(['company', 'department', 'branch', 'team', 'designation']);

            // Add foreign key columns
            $table->foreignId('company_id')->nullable()->constrained('companies')->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('team_id')->nullable()->constrained('teams')->nullOnDelete();
            $table->foreignId('designation_id')->nullable()->constrained('designations')->nullOnDelete();
        });
    }




    public function down()
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropForeign(['department_id']);
            $table->dropForeign(['branch_id']);
            $table->dropForeign(['team_id']);
            $table->dropForeign(['designation_id']);

            $table->dropColumn(['company_id', 'department_id', 'branch_id', 'team_id', 'designation_id']);

            $table->string('company')->nullable();
            $table->string('department')->nullable();
            $table->string('branch')->nullable();
            $table->string('team')->nullable();
            $table->string('designation')->nullable();
        });
    }
};
