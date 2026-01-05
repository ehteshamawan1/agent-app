<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LineOfSightCalculation extends Model
{
    protected $fillable = [
        'pole_id',
        'agent_latitude',
        'agent_longitude',
        'agent_elevation',
        'pole_elevation',
        'elevation_difference',
        'distance_from_pole',
        'result',
        'extra_height_required',
        'calculated_by',
        'calculation_notes',
    ];

    protected $casts = [
        'agent_latitude' => 'decimal:8',
        'agent_longitude' => 'decimal:8',
        'agent_elevation' => 'decimal:2',
        'pole_elevation' => 'decimal:2',
        'elevation_difference' => 'decimal:2',
        'distance_from_pole' => 'decimal:2',
        'extra_height_required' => 'decimal:2',
    ];

    public function pole()
    {
        return $this->belongsTo(Pole::class);
    }

    public function calculator()
    {
        return $this->belongsTo(User::class, 'calculated_by');
    }
}
