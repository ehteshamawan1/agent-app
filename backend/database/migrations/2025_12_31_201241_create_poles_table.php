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
        Schema::create('poles', function (Blueprint $table) {
            $table->id();
            $table->string('pole_name');
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->decimal('pole_height', 8, 2); // in meters
            $table->decimal('restricted_radius', 8, 2); // in meters (50-5000)
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->foreignId('zone_id')->constrained('zones')->onDelete('restrict');
            $table->unsignedBigInteger('land_owner_id')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('poles');
    }
};
