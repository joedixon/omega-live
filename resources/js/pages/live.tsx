import { Head, usePoll } from '@inertiajs/react';
import { useConnectionStatus, useEchoPublic } from '@laravel/echo-react';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { Composer } from '@/components/live/composer';
import type { Cursor } from '@/components/live/cursors';
import { Cursors } from '@/components/live/cursors';
import { Feed } from '@/components/live/feed';
import { Logo } from '@/components/live/logo';
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
            <Head />

            <div className="relative isolate min-h-dvh overflow-x-hidden pb-36">
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

                <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-6 lg:px-8">
                    <a
                        href="/"
                        aria-label="Homepage"
                        className="flex items-center gap-3"
                    >
                        <div className="flex size-10 items-center justify-center rounded-xl bg-brand text-white shadow-md shadow-brand/30">
                            <Logo className="size-8" />
                        </div>
                        <div>
                            <p className="text-base/5 font-semibold whitespace-nowrap sm:text-sm/5">
                                Omega Reverb
                            </p>
                            <StatusPill status={status} />
                        </div>
                    </a>
                    <Presence
                        members={members.length ? members : [me]}
                        me={me}
                    />
                </header>

                <main className="relative z-20 mx-auto grid max-w-7xl gap-10 px-6 pt-6 lg:grid-cols-[7fr_5fr] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-16 lg:px-8 lg:pt-12">
                    <section>
                        <div>
                            <Composer
                                onSend={(nonce) =>
                                    pending.current.set(
                                        nonce,
                                        performance.now(),
                                    )
                                }
                            />
                        </div>
                    </section>

                    <section className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
                        <Feed shoutouts={feed} fresh={fresh} now={now} />
                    </section>

                    <section>
                        <StatsPanel
                            stats={stats}
                            roundTrip={roundTrip}
                            reactions={reactions}
                        />
                        <Diagram reverbHost={reverbHost} />
                    </section>
                </main>

                <ReactionBar counts={counts} onReact={react} />
            </div>
        </>
    );
}

function Backdrop({ energy }: { energy: number }) {
    return (
        <div className="pointer-events-none fixed inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(var(--color-zinc-950)_1px,transparent_1px)] mask-radial-from-40% mask-radial-at-top bg-size-[24px_24px] opacity-[0.07]" />
            <div
                className="absolute -top-80 left-1/2 size-[64rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,var(--color-orange-300)_0%,var(--color-rose-200)_35%,transparent_65%)] opacity-(--glow) blur-3xl transition-opacity duration-300"
                style={
                    { '--glow': 0.35 + energy * 0.65 } as React.CSSProperties
                }
            />
        </div>
    );
}

function StatusPill({ status }: { status: string }) {
    const connected = status === 'connected';

    return (
        <p className="flex items-center gap-1.5 text-sm/5 text-zinc-500 sm:text-xs/5">
            <span className="relative flex size-1.5">
                {connected && (
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                )}
                <span
                    className={cn(
                        'relative inline-flex size-1.5 rounded-full',
                        connected ? 'bg-emerald-500' : 'bg-amber-500',
                    )}
                />
            </span>
            {connected
                ? 'Connected'
                : status.charAt(0).toUpperCase() + status.slice(1)}
        </p>
    );
}

function Diagram({ reverbHost }: { reverbHost: string | null }) {
    const steps = [
        { title: 'Your browser', body: 'Laravel Echo' },
        { title: 'WebSockets', body: 'Reverb Omega' },
        { title: 'Application', body: 'Laravel 13' },
    ];

    return (
        <div className="mt-6 rounded-2xl bg-zinc-950/[0.03] p-5">
            <h2 className="text-sm/6 font-semibold text-zinc-950">
                How it works
            </h2>
            <ol
                role="list"
                className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center"
            >
                {steps.map((step, index) => (
                    <Fragment key={step.title}>
                        <li className="rounded-xl bg-white px-4 py-3 shadow-xs ring-1 ring-zinc-950/5">
                            <p className="text-sm/6 font-medium whitespace-nowrap text-zinc-950">
                                {step.title}
                            </p>
                            <p className="truncate font-mono text-xs/5 text-zinc-500">
                                {step.body}
                            </p>
                        </li>
                        {index < steps.length - 1 && (
                            <li
                                aria-hidden="true"
                                className="text-center text-zinc-400 max-sm:hidden"
                            >
                                ⇄
                            </li>
                        )}
                    </Fragment>
                ))}
            </ol>
            {reverbHost && (
                <p className="mt-3 flex flex-wrap items-baseline gap-x-2 text-sm/6 text-zinc-500">
                    Connected to
                    <code className="font-mono [overflow-wrap:anywhere] text-zinc-700">
                        {reverbHost}
                    </code>
                </p>
            )}
            <p className="mt-4 text-base/7 text-pretty text-zinc-600 sm:text-sm/6">
                Cursors and reactions are whispers, sent browser to browser
                through Reverb without touching PHP. Shoutouts are saved by
                Laravel, then broadcast through Reverb’s HTTP API to everyone at
                once.
            </p>
        </div>
    );
}
