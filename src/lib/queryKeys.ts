export const queryKeys = {
  serviceOrders: {
    all: ['service-orders'] as const,
    list: (page: number, size: number) => ['service-orders', 'list', page, size] as const,
  },
  myServiceOrders: {
    all: ['my-service-orders'] as const,
    list: (page: number, size: number) => ['my-service-orders', 'list', page, size] as const,
  },
  customers: {
    all: ['customers'] as const,
  },
  vehicles: {
    all: ['vehicles'] as const,
  },
  users: {
    all: ['users'] as const,
  },
} as const
