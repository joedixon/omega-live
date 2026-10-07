export const EMOJIS = ['🔥', '👏', '🚀', '❤️', '😂', '🤯'] as const;

export type Burst = {
    key: number;
    emoji: string;
    x: number;
    drift: number;
    spin: number;
    size: number;
    color: string;
};

export function Bursts({
    bursts,
    onDone,
}: {
    bursts: Burst[];
    onDone: (key: number) => void;
}) {
    return (
        <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
            {bursts.map((burst) => (
                <div
                    key={burst.key}
                    onAnimationEnd={() => onDone(burst.key)}
                    className="absolute bottom-28 left-(--x) animate-float-up font-emoji text-(length:--size) select-none"
                    style={
                        {
                            '--x': `${burst.x * 100}%`,
                            '--size': `${burst.size}rem`,
                            '--drift': `${burst.drift}px`,
                            '--spin': `${burst.spin}deg`,
                        } as React.CSSProperties
                    }
                >
                    <span
                        className="absolute inset-0 -z-10 m-auto size-3/4 rounded-full opacity-40 blur-xl"
                        style={{ backgroundColor: burst.color }}
                    />
                    {burst.emoji}
                </div>
            ))}
        </div>
    );
}

export function ReactionBar({
    counts,
    onReact,
}: {
    counts: Record<string, number>;
    onReact: (emoji: string, x: number) => void;
}) {
    return (
        <div className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
            <div className="flex items-center gap-0.5 rounded-full bg-white/90 p-1.5 shadow-xl ring-1 shadow-zinc-950/10 ring-zinc-950/10 backdrop-blur-xl">
                {EMOJIS.map((emoji, index) => (
                    <button
                        key={emoji}
                        type="button"
                        onClick={(event) => {
                            const box =
                                event.currentTarget.getBoundingClientRect();
                            onReact(
                                emoji,
                                (box.left + box.width / 2) / window.innerWidth,
                            );
                        }}
                        className="group relative flex size-12 items-center justify-center rounded-full font-emoji text-2xl transition-transform hover:-translate-y-1 hover:scale-110 hover:bg-zinc-950/5 focus-visible:outline-2 focus-visible:outline-brand active:scale-95 sm:size-14 sm:text-3xl"
                        aria-label={`React with ${emoji}, or press ${index + 1}`}
                    >
                        {emoji}
                        {counts[emoji] ? (
                            <span className="absolute -top-1 -right-0.5 min-w-5 rounded-full bg-brand px-1.5 text-center text-[0.625rem]/5 font-semibold text-white tabular-nums ring-2 ring-white">
                                {compact(counts[emoji])}
                            </span>
                        ) : null}
                    </button>
                ))}
            </div>
        </div>
    );
}

function compact(count: number): string {
    return count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count);
}
