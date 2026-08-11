export type ClientFilters = {
  status?: string;
};

export const queryKeys = {
  clients: {
    all: ["clients"] as const,
    list: (filters: ClientFilters = {}) =>
      [...queryKeys.clients.all, "list", filters] as const,
    detail: (id: number) => [...queryKeys.clients.all, "detail", id] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    byClient: (clientId: number) =>
      [...queryKeys.tasks.all, "byClient", clientId] as const,
  },
} as const;
