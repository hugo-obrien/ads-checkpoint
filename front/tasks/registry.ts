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
    {
        id: 2,
        slug: 'hash',
        title: 'Реестр оборудования: от хеш-функции до открытой адресации',
        description:
            'Хеш-таблица для реестра учебного оборудования: хеш-функции, метод цепочек (закрытая адресация) и открытая адресация (линейное, квадратичное, двойное пробирование), поиск и удаление, статистика коллизий.',
        component: () => import('@/views/Task2HashView.vue'),
    },
    {
        id: 3,
        slug: 'graph',
        title: 'Сеть маршрутов учебного кампуса',
        description:
            'Представление и анализ сети маршрутов между объектами кампуса с помощью графов: список смежности, BFS/DFS, Дейкстра, связность, циклы и остовное дерево (Краскал).',
        component: () => import('@/views/Task3GraphView.vue'),
    },
]