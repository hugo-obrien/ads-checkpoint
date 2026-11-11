import type {Component} from 'vue'

export interface TaskMeta {
    id: number
    slug: string
    title: string
    description: string
    component: (() => Promise<Component>) | Component
}

export const tasks: TaskMeta[] = [
    {
        id: 1,
        slug: 'tickets',
        title: 'Диспетчер заявок службы поддержки',
        description:
            'Бинарное дерево поиска для хранения и поиска заявок, двоичная куча для приоритизации и сортировка кучей для итогового отчёта.',
        component: () => import('@/views/Task1TicketsView.vue'),
    },
]