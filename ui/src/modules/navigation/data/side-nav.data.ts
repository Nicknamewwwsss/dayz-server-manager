import { SideNavItems, SideNavSection } from '@modules/navigation/models';

export const sideNavSections: SideNavSection[] = [
    {
        text: 'CORE',
        items: ['dashboard'],
    },
    {
        text: 'DETAIL',
        items: [
            'system',
            'players',
            'audit',
            'logs',
            'maintenance',
            'settings',
        ],
    },
];

export const sideNavItems: SideNavItems = {
    dashboard: {
        icon: 'tachometer-alt',
        text: 'Dashboard',
        link: '/dashboard',
    },
    system: {
        icon: 'chart-area',
        text: 'System',
        link: '/dashboard/system',
    },
    players: {
        icon: 'user',
        text: 'Players',
        link: '/dashboard/players',
    },
    audit: {
        icon: 'exclamation-triangle',
        text: 'Audit',
        link: '/dashboard/audit',
    },
    logs: {
        icon: 'clipboard-list',
        text: 'Logs',
        link: '/dashboard/logs',
    },
    maintenance: {
        icon: 'tools',
        text: 'Maintenance',
        link: '/dashboard/maintenance',
    },
    settings: {
        icon: 'cogs',
        text: 'Settings',
        link: '/dashboard/settings',
    },
};