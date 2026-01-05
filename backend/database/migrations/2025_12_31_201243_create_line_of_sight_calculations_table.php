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
        Schema::create('line_of_sight_calculations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pole_id')->constrained('poles')->onDelete('cascade');
            $table->decimal('agent_latitude', 10, 8);
            $table->decimal('agent_longitude', 11, 8);
            $table->decimal('agent_elevation', 8, 2);
            $table->decimal('pole_elevation', 8, 2);
            $table->decimal('elevation_difference', 8, 2);
            $table->decimal('distance_from_pole', 8, 2); // in meters
            $table->enum('result', ['CLEAR', 'PARTIAL', 'BLOCKED']);
            $table->decimal('extra_height_required', 8, 2)->nullable(); // for PARTIAL
            $table->foreignId('calculated_by')->constrained('users')->onDelete('restrict');
            $table->text('calculation_notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('line_of_sight_calculations');
    }
};
