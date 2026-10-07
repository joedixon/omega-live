import type { Member } from '@/types';

export type Cursor = {
    x: number;
    y: number;
    seen: number;
};

export function Cursors({
    cursors,
    members,
}: {
    cursors: Record<number, Cursor>;
    members: Member[];
}) {
    const people = new Map(members.map((member) => [member.id, member]));

    return (
        <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
            {Object.entries(cursors).map(([id, cursor]) => {
                const member = people.get(Number(id));

                if (!member) {
                    return null;
                }

                return (
                    <div
                        key={id}
                        className="absolute top-0 left-0 transition-transform duration-100 ease-linear will-change-transform"
                        style={{
                            transform: `translate(calc(${cursor.x} * 100vw), calc(${cursor.y} * 100vh))`,
                        }}
                    >
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
                        >
                            <path
                                d="M4 2.5 20 11l-7.2 1.8L9 20 4 2.5Z"
                                fill={member.color}
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <span
                            className="ml-4 inline-block -translate-y-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap text-white shadow-lg"
                            style={{ backgroundColor: member.color }}
                        >
                            {member.name}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
