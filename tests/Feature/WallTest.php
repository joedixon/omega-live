<?php

use App\Events\ShoutoutPosted;
use App\Models\Shoutout;
use App\Models\User;
use App\Support\ReverbStats;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->withoutVite();
    $this->mock(ReverbStats::class)->allows('snapshot')->andReturn([
        'connections' => 3, 'members' => 2, 'shoutouts' => 0, 'online' => true,
    ]);
});

test('visitors get a guest identity', function () {
    $this->get('/')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('live')
            ->where('me.id', User::sole()->id)
            ->where('stats.connections', 3)
        );

    $this->get('/')->assertOk();

    expect(User::count())->toBe(1);
});

test('health checks do not create guests', function () {
    $this->get('/up')->assertOk();

    expect(User::count())->toBe(0);
});

test('the wall shows the latest shoutouts first', function () {
    Shoutout::factory()->create(['body' => 'First']);
    Shoutout::factory()->create(['body' => 'Second']);

    $this->get('/')->assertInertia(fn (Assert $page) => $page
        ->where('shoutouts.0.body', 'Second')
        ->where('shoutouts.1.body', 'First')
    );
});

test('shoutouts are saved and broadcast to the wall', function () {
    Event::fake([ShoutoutPosted::class]);
    $user = User::factory()->create(['name' => 'Swift Otter']);

    $this->actingAs($user)
        ->from('/')
        ->post('/shoutouts', ['body' => 'Hello from Rust', 'nonce' => 'abc'])
        ->assertRedirect('/');

    Event::assertDispatched(ShoutoutPosted::class, function (ShoutoutPosted $event) {
        return $event->broadcastOn()->name === 'wall'
            && $event->broadcastWith()['body'] === 'Hello from Rust'
            && $event->broadcastWith()['name'] === 'Swift Otter'
            && $event->broadcastWith()['nonce'] === 'abc';
    });
});

test('shoutouts are validated', function (string $body) {
    Event::fake([ShoutoutPosted::class]);

    $this->actingAs(User::factory()->create())
        ->post('/shoutouts', ['body' => $body])
        ->assertSessionHasErrors('body');

    Event::assertNotDispatched(ShoutoutPosted::class);
})->with(['empty' => '', 'too long' => str_repeat('a', 141)]);

test('guests are authorized for the room with their presence data', function () {
    config([
        'broadcasting.default' => 'reverb',
        'broadcasting.connections.reverb.key' => 'key',
        'broadcasting.connections.reverb.secret' => 'secret',
        'broadcasting.connections.reverb.app_id' => 'app',
    ]);
    Broadcast::forgetDrivers();
    require base_path('routes/channels.php');
    $user = User::factory()->create(['name' => 'Brave Panda', 'color' => '#22c55e']);

    $response = $this->actingAs($user)
        ->post('/broadcasting/auth', ['socket_id' => '1.1', 'channel_name' => 'presence-room'])
        ->assertOk();

    $data = json_decode($response->json('channel_data'), true);
    expect($data['user_id'])->toBe((string) $user->id)
        ->and($data['user_info'])->toBe(['id' => $user->id, 'name' => 'Brave Panda', 'color' => '#22c55e'])
        ->and($response->json('auth'))->toStartWith('key:');
});
