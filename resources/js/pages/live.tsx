import { Head, usePoll } from '@inertiajs/react';
import { useConnectionStatus, useEchoPublic } from '@laravel/echo-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Composer } from '@/components/live/composer';
import type { Cursor } from '@/components/live/cursors';
import { Cursors } from '@/components/live/cursors';
import { Feed } from '@/components/live/feed';
import { Presence } from '@/components/live/presence';
import type { Burst } from '@/components/live/reactions';
import { Bursts, EMOJIS, ReactionBar } from '@/components/live/reactions';
import { StatsPanel } from '@/components/live/stats';
import { useRoom } from '@/hooks/use-room';
import { cn } from '@/lib/utils';
import type {
    CursorWhisper,
    Member,
    ReactionWhisper,
    Shoutout,
    ShoutoutPosted,
    Stats,
} from '@/types';

type Props = {
    me: Member;
    shoutouts: Shoutout[];
    stats: Stats;
    reverbHost: string | null;
};

const CURSOR_INTERVAL = 50;
const CURSOR_TIMEOUT = 5000;
const MAX_BURSTS = 150;

export default function Live({ me, shoutouts, stats, reverbHost }: Props) {
    const [cursors, setCursors] = useState<Record<number, Cursor>>({});
    const [bursts, setBursts] = useState<Burst[]>([]);
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [feed, setFeed] = useState(shoutouts);
    const [fresh, setFresh] = useState<Set<number>>(new Set());
    const [roundTrip, setRoundTrip] = useState<number | null>(null);
    const [energy, setEnergy] = useState(0);
    const [now, setNow] = useState(() => Date.now());
    const pending = useRef(new Map<string, number>());
    const burstKey = useRef(0);

    const colorOf = useRef(new Map<number, string>());

    const spawn = useCallback((emoji: string, x: number, color: string) => {
        const key = ++burstKey.current;

        setBursts((current) =>
            [
                ...current,
                {
                    key,
                    emoji,
                    x: Math.min(
                        0.97,
                        Math.max(0.03, x + (Math.random() - 0.5) * 0.04),
                    ),
                    drift: (Math.random() - 0.5) * 160,
                    spin: (Math.random() - 0.5) * 50,
                    size: 1.8 + Math.random() * 1.6,
                    color,
                },
            ].slice(-MAX_BURSTS),
        );
        setCounts((current) => ({
            ...current,
            [emoji]: (current[emoji] ?? 0) + 1,
        }));
        setEnergy((current) => Math.min(1, current + 0.08));
    }, []);

    const { members, whisper } = useRoom({
        cursor: (data: CursorWhisper) =>
            setCursors((current) => {
                if (data.hidden) {
                    const { [data.id]: _gone, ...rest } = current;

                    return rest;
                }

                return {
                    ...current,
                    [data.id]: { x: data.x, y: data.y, seen: Date.now() },
                };
            }),
        react: (data: ReactionWhisper) =>
            spawn(
                data.emoji,
                data.x,
                colorOf.current.get(data.id) ?? '#ffffff',
            ),
    });

    useEffect(() => {
        colorOf.current = new Map(
            members.map((member) => [member.id, member.color]),
        );
        setCursors((current) =>
            Object.fromEntries(
                Object.entries(current).filter(([id]) =>
                    members.some((member) => member.id === Number(id)),
                ),
            ),
        );
    }, [members]);

    useEchoPublic<ShoutoutPosted>(
        'wall',
        'ShoutoutPosted',
        (shoutout) => {
            const sent = shoutout.nonce
                ? pending.current.get(shoutout.nonce)
                : undefined;

            if (sent !== undefined) {
                setRoundTrip(Math.round(performance.now() - sent));
                pending.current.delete(shoutout.nonce!);
            }

            setFeed((current) =>
                [
                    shoutout,
                    ...current.filter(({ id }) => id !== shoutout.id),
                ].slice(0, 30),
            );
            setFresh((current) => new Set(current).add(shoutout.id));
            setTimeout(
                () =>
                    setFresh((current) => {
                        const next = new Set(current);
                        next.delete(shoutout.id);

                        return next;
                    }),
                4000,
            );
            setEnergy((current) => Math.min(1, current + 0.35));
        },
        [],
    );

    usePoll(5000, { only: ['stats'] });

    const status = useConnectionStatus();

    // Pointer positions, whispered at most every 50ms.
    useEffect(() => {
        let last = 0;

        function move(event: PointerEvent) {
            if (
                event.pointerType !== 'mouse' ||
                performance.now() - last < CURSOR_INTERVAL
            ) {
                return;
            }

            last = performance.now();
            whisper('cursor', {
                id: me.id,
                x: event.clientX / window.innerWidth,
                y: event.clientY / window.innerHeight,
            } satisfies CursorWhisper);
        }

        function leave() {
            whisper('cursor', {
                id: me.id,
                x: 0,
                y: 0,
                hidden: true,
            } satisfies CursorWhisper);
        }

        window.addEventListener('pointermove', move);
        document.documentElement.addEventListener('pointerleave', leave);

        return () => {
            window.removeEventListener('pointermove', move);
            document.documentElement.removeEventListener('pointerleave', leave);
        };
    }, [me.id, whisper]);

    const react = useCallback(
        (emoji: string, x: number) => {
            spawn(emoji, x, me.color);
            whisper('react', { id: me.id, emoji, x } satisfies ReactionWhisper);
        },
        [me.color, me.id, spawn, whisper],
    );

    // Number keys 1–6 react, unless typing.
    useEffect(() => {
        function press(event: KeyboardEvent) {
            const target = event.target as HTMLElement;

            if (
                target.closest('input, textarea') ||
                event.metaKey ||
                event.ctrlKey
            ) {
                return;
            }

            const emoji = EMOJIS[Number(event.key) - 1];

            if (emoji) {
                react(emoji, 0.15 + Math.random() * 0.7);
            }
        }

        window.addEventListener('keydown', press);

        return () => window.removeEventListener('keydown', press);
    }, [react]);

    // Decay the glow, forget idle cursors, and keep relative times fresh.
    useEffect(() => {
        const decay = setInterval(
            () => setEnergy((current) => current * 0.94),
            100,
        );
        const sweep = setInterval(() => {
            setNow(Date.now());
            setCursors((current) =>
                Object.fromEntries(
                    Object.entries(current).filter(
                        ([, cursor]) =>
                            Date.now() - cursor.seen < CURSOR_TIMEOUT,
                    ),
                ),
            );
        }, 1000);

        return () => {
            clearInterval(decay);
            clearInterval(sweep);
        };
    }, []);

    const reactions = Object.values(counts).reduce(
        (sum, count) => sum + count,
        0,
    );

    return (
        <>
            <Head title="This page is live" />

            <div className="relative min-h-dvh overflow-x-hidden pb-32">
                <Backdrop energy={energy} />
                <Cursors cursors={cursors} members={members} />
                <Bursts
                    bursts={bursts}
                    onDone={(key) =>
                        setBursts((current) =>
                            current.filter((burst) => burst.key !== key),
                        )
                    }
                />

                <header className="relative z-20 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 pt-6 sm:px-8">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-[#f53003] text-2xl font-semibold shadow-[0_0_30px_-4px] shadow-[#f53003]">
                            Ω
                        </div>
                        <div className="leading-tight">
                            <div className="font-semibold tracking-tight">
                                Omega Live
                            </div>
                            <StatusPill status={status} />
                        </div>
                    </div>
                    <Presence
                        members={members.length ? members : [me]}
                        me={me}
                    />
                </header>

                <main className="relative z-20 mx-auto mt-12 grid max-w-6xl gap-10 px-5 sm:px-8 lg:mt-20 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
                    <section>
                        <p className="text-sm font-medium tracking-wide text-[#f53003] uppercase">
                            Laravel Reverb, rewritten in Rust
                        </p>
                        <h1 className="mt-3 text-5xl font-semibold tracking-tight text-balance sm:text-7xl">
                            This page is{' '}
                            <span className="text-[#f53003] [text-shadow:0_0_40px_rgba(245,48,3,0.55)]">
                                live.
                            </span>
                        </h1>
                        <p className="mt-5 max-w-xl text-lg leading-relaxed text-pretty text-white/60">
                            Everyone here is connected to a WebSocket server
                            written in Rust, running inside Laravel Omega on
                            Laravel Cloud. Move your mouse, hit a reaction, say
                            hi.
                        </p>

                        <div className="mt-8">
                            <Composer
                                onSend={(nonce) =>
                                    pending.current.set(
                                        nonce,
                                        performance.now(),
                                    )
                                }
                            />
                        </div>

                        <div className="mt-8">
                            <StatsPanel
                                stats={stats}
                                roundTrip={roundTrip}
                                reactions={reactions}
                            />
                        </div>

                        <Diagram reverbHost={reverbHost} />
                    </section>

                    <section>
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-white/70">
                                Shoutouts
                            </h2>
                            <span className="text-xs text-white/35">
                                newest first
                            </span>
                        </div>
                        <Feed shoutouts={feed} fresh={fresh} now={now} />
                    </section>
                </main>

                <ReactionBar counts={counts} onReact={react} />
            </div>
        </>
    );
}

function Backdrop({ energy }: { energy: number }) {
    return (
        <div className="pointer-events-none fixed inset-0 z-0">
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:24px_24px]" />
            <div
                className="absolute -top-1/3 left-1/2 size-[70rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#f53003_0%,transparent_60%)] blur-3xl transition-opacity duration-300"
                style={{ opacity: 0.16 + energy * 0.5 }}
            />
            <div className="absolute -bottom-1/2 left-1/4 size-[50rem] rounded-full bg-[radial-gradient(circle,#8b5cf6_0%,transparent_60%)] opacity-15 blur-3xl" />
        </div>
    );
}

function StatusPill({ status }: { status: string }) {
    const connected = status === 'connected';

    return (
        <div className="flex items-center gap-1.5 text-xs text-white/50">
            <span className="relative flex size-2">
                {connected && (
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                    className={cn(
                        'relative inline-flex size-2 rounded-full',
                        connected ? 'bg-emerald-400' : 'bg-amber-400',
                    )}
                />
            </span>
            {connected
                ? 'Connected'
                : status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
    );
}

function Diagram({ reverbHost }: { reverbHost: string | null }) {
    const steps = [
        { title: 'Your browser', body: 'Laravel Echo' },
        { title: 'Reverb in Rust', body: reverbHost ?? 'Laravel Omega' },
        { title: 'This app', body: 'Laravel 13' },
    ];

    return (
        <div className="mt-8 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="text-xs font-medium text-white/45">
                How it works
            </div>
            <ol className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                {steps.map((step, index) => (
                    <li
                        key={step.title}
                        className="flex items-center gap-2 sm:flex-1"
                    >
                        <div className="min-w-0 flex-1 rounded-xl bg-white/[0.04] px-3 py-2">
                            <div className="text-sm font-medium">
                                {step.title}
                            </div>
                            <div className="truncate font-mono text-[11px] text-white/40">
                                {step.body}
                            </div>
                        </div>
                        {index < steps.length - 1 && (
                            <span className="hidden text-[#f53003] sm:block">
                                ⇄
                            </span>
                        )}
                    </li>
                ))}
            </ol>
            <p className="mt-3 text-xs leading-relaxed text-white/40">
                Cursors and reactions are whispers: browser to browser through
                Reverb, never touching PHP. Shoutouts are saved by Laravel, then
                broadcast through Reverb’s HTTP API to everyone at once.
            </p>
        </div>
    );
}
