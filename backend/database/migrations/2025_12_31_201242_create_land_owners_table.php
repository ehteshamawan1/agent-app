<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('land_owners', function (Blueprint $table) {
            $table->id();
            $table->string('owner_name');
            $table->string('mobile_number');
            $table->text('address');
            $table->text('notes')->nullable();
            $table->foreignId('zone_id')->constrained('zones')->onDelete('restrict');
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('land_owners');
    }
};
