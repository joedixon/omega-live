import { createInertiaApp } from '@inertiajs/react';
import '@/lib/echo';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    progress: {
        color: '#f53003',
    },
});
