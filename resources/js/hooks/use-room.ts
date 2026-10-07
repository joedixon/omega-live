import { echo } from '@laravel/echo-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Member } from '@/types';

type Whispers = Record<string, (data: never) => void>;

/**
 * Join the presence channel: who's here, and whispers between visitors,
 * which go browser to browser through Reverb without touching the app.
 */
export function useRoom(whispers: Whispers) {
    const [members, setMembers] = useState<Member[]>([]);
    const handlers = useRef(whispers);

    useEffect(() => {
        handlers.current = whispers;
    });

    useEffect(() => {
        const channel = echo()
            .join('room')
            .here((here: Member[]) => setMembers(here))
            .joining((member: Member) =>
                setMembers((current) => [
                    ...current.filter(({ id }) => id !== member.id),
                    member,
                ]),
            )
            .leaving((member: Member) =>
                setMembers((current) =>
                    current.filter(({ id }) => id !== member.id),
                ),
            );

        for (const event of Object.keys(handlers.current)) {
            channel.listenForWhisper(event, (data: never) =>
                handlers.current[event]?.(data),
            );
        }

        return () => echo().leave('room');
    }, []);

    const whisper = useCallback((event: string, data: object) => {
        echo().join('room').whisper(event, data);
    }, []);

    return { members, whisper };
}
