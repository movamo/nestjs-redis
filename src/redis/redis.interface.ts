import { Redis } from 'ioredis';
import { ClientNamespace } from './redis-module-options.interface';

export type RedisClients = Map<ClientNamespace, Redis>;

export interface RedisClientsService {
    /**
     * All clients.
     */
    clients: ReadonlyMap<ClientNamespace, Redis>;

    /**
     * Gets client via namespace.
     */
    getClient: (namespace: ClientNamespace) => Redis;
}
