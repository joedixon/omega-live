/**
 * Reverb's ripple, drawn as nested omegas around a solid core.
 */
export function Logo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 48 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={className}
        >
            <path opacity="0.3" d="M8.1 37.56h5A19 19 0 1 1 34.9 37.56h5" />
            <path opacity="0.6" d="M12.54 32.65h4A13 13 0 1 1 31.46 32.65h4" />
            <path d="M16.98 27.73h3A7 7 0 1 1 28.02 27.73h3" />
            <circle
                cx="24"
                cy="22"
                r="2.25"
                fill="currentColor"
                stroke="none"
            />
        </svg>
    );
}
