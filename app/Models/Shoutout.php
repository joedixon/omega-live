<?php

namespace App\Models;

use Database\Factories\ShoutoutFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $body
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 */
#[Fillable(['body'])]
class Shoutout extends Model
{
    /** @use HasFactory<ShoutoutFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The shape the page and the broadcast share.
     *
     * @return array{id: int, body: string, name: string, color: string, at: string|null}
     */
    public function toWall(): array
    {
        return [
            'id' => $this->id,
            'body' => $this->body,
            'name' => $this->user->name,
            'color' => $this->user->color,
            'at' => $this->created_at?->toIso8601String(),
        ];
    }
}
