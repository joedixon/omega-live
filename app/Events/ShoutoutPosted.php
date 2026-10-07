<?php

namespace App\Events;

use App\Models\Shoutout;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class ShoutoutPosted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    /**
     * @param  string|null  $nonce  The sender's own marker, so their page can time the round trip.
     */
    public function __construct(public Shoutout $shoutout, public ?string $nonce = null) {}

    public function broadcastOn(): Channel
    {
        return new Channel('wall');
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [...$this->shoutout->toWall(), 'nonce' => $this->nonce];
    }
}
