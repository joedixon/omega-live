<?php

namespace App\Support;

use App\Models\Shoutout;
use Illuminate\Broadcasting\Broadcasters\PusherBroadcaster;
use Illuminate\Support\Facades\Broadcast;
use Throwable;

/**
 * Live numbers from Reverb's HTTP API, the same API the broadcaster uses.
 */
class ReverbStats
{
    /**
     * @return array{connections: int|null, members: int|null, shoutouts: int, online: bool}
     */
    public function snapshot(): array
    {
        $connections = $members = null;

        try {
            $broadcaster = Broadcast::connection('reverb');

            if ($broadcaster instanceof PusherBroadcaster) {
                $pusher = $broadcaster->getPusher();
                $connections = $pusher->get('/connections', [], true)['connections'] ?? null;
                $members = $pusher->get('/channels/presence-room', ['info' => 'user_count'], true)['user_count'] ?? 0;
            }
        } catch (Throwable $e) {
            report($e);
        }

        return [
            'connections' => $connections,
            'members' => $members,
            'shoutouts' => Shoutout::count(),
            'online' => $connections !== null,
        ];
    }
}
