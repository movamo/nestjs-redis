# Cluster

## Usage

**1**, we need to import the `ClusterModule` into our root module:

```TypeScript
import { Module } from '@nestjs/common';
import { ClusterModule } from '@mvmdev/nestjs-redis';

@Module({
    imports: [
        ClusterModule.forRoot({
            config: {
                nodes: [{ host: 'localhost', port: 16380 }],
                options: { redisOptions: { password: 'cluster1' } }
            }
        })
    ]
})
export class AppModule {}
```

> HINT: The `ClusterModule` is a [global module](https://docs.nestjs.com/modules#global-modules). Once defined, this module is available everywhere.

**2**, we can use cluster in two ways.

via decorator:

```TypeScript
import { Injectable } from '@nestjs/common';
import { InjectCluster, DEFAULT_CLUSTER_NAMESPACE } from '@mvmdev/nestjs-redis';
import { Cluster } from 'ioredis';

@Injectable()
export class AppService {
    constructor(
        @InjectCluster() private readonly cluster: Cluster
        // or
        // @InjectCluster(DEFAULT_CLUSTER_NAMESPACE) private readonly cluster: Cluster
    ) {}

    async ping(): Promise<string> {
        return await this.cluster.ping();
    }
}
```

via service:

```TypeScript
import { Injectable } from '@nestjs/common';
import { ClusterService, DEFAULT_CLUSTER_NAMESPACE } from '@mvmdev/nestjs-redis';
import { Cluster } from 'ioredis';

@Injectable()
export class AppService {
    private readonly cluster: Cluster;

    constructor(private readonly clusterService: ClusterService) {
        this.cluster = this.clusterService.getClient();
        // or
        // this.cluster = this.clusterService.getClient(DEFAULT_CLUSTER_NAMESPACE);
    }

    async ping(): Promise<string> {
        return await this.cluster.ping();
    }
}
```

> HINT: If you don't set the namespace for a client, its namespace is set to default. Please note that you shouldn't have multiple client without a namespace, or with the same namespace, otherwise they will get overridden.

## Configuration

### ClusterModuleOptions

| Name        | Type                                 | Default value | Description                                                                                                                                                                                                                                                                                             |
| ----------- | ------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| closeClient | boolean                              | true          | If `true`, all clients will be closed automatically on nestjs application shutdown. To use `closeClient`, you **must enable listeners** by calling `app.enableShutdownHooks()`. [Read more about the application shutdown.](https://docs.nestjs.com/fundamentals/lifecycle-events#application-shutdown) |
| readyLog    | boolean                              | false         | If `true`, will show a message when the client is ready.                                                                                                                                                                                                                                                |
| config      | `ClientOptions` or `ClientOptions`[] | undefined     | Specify single or multiple clients.                                                                                                                                                                                                                                                                     |

### ClientOptions

| Name                                                                                          | Type                                                             | Default value | Description                                                                                                                                                            |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| namespace                                                                                     | string or symbol                                                 | 'default'     | The name of the client, and must be unique. You can import `DEFAULT_CLUSTER_NAMESPACE` to reference the default value.                                                 |
| [nodes](https://github.com/luin/ioredis/blob/master/API.md#new-clusterstartupnodes-options)   | `{ host?: string; port?: number }[]` or `string[]` or `number[]` | undefined     | A list of nodes of the cluster. The **first** argument of `new Cluster(startupNodes, options).`                                                                        |
| [options](https://github.com/luin/ioredis/blob/master/API.md#new-clusterstartupnodes-options) | object                                                           | undefined     | The [cluster options](https://github.com/luin/ioredis/blob/master/lib/cluster/ClusterOptions.ts#L30). The **second** argument of `new Cluster(startupNodes, options).` |
| onClientCreated                                                                               | function                                                         | undefined     | This function will be executed as soon as the client is created.                                                                                                       |

### Asynchronous configuration

via `useFactory`:

```TypeScript
import { Module } from '@nestjs/common';
import { ClusterModule, ClusterModuleOptions } from '@mvmdev/nestjs-redis';
import { ConfigService, ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        ClusterModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService): Promise<ClusterModuleOptions> => {
                await somePromise();

                return {
                    config: {
                        nodes: [{ host: 'localhost', port: 16380 }],
                        options: { redisOptions: { password: 'cluster1' } }
                    }
                };
            }
        })
    ]
})
export class AppModule {}
```

via `useClass`:

```TypeScript
import { Module, Injectable } from '@nestjs/common';
import { ClusterModule, ClusterOptionsFactory, ClusterModuleOptions } from '@mvmdev/nestjs-redis';

@Injectable()
export class ClusterConfigService implements ClusterOptionsFactory {
    async createClusterOptions(): Promise<ClusterModuleOptions> {
        await somePromise();

        return {
            config: {
                nodes: [{ host: 'localhost', port: 16380 }],
                options: { redisOptions: { password: 'cluster1' } }
            }
        };
    }
}

@Module({
    imports: [
        ClusterModule.forRootAsync({
            useClass: ClusterConfigService
        })
    ]
})
export class AppModule {}
```

via `extraProviders`:

```TypeScript
// just a simple example

import { Module, ValueProvider } from '@nestjs/common';
import { ClusterModule, ClusterModuleOptions } from '@mvmdev/nestjs-redis';

const MyOptionsSymbol = Symbol('options');
const MyOptionsProvider: ValueProvider<ClusterModuleOptions> = {
    provide: MyOptionsSymbol,
    useValue: {
        readyLog: true,
        config: {
            nodes: [{ host: 'localhost', port: 16380 }],
            options: { redisOptions: { password: 'cluster1' } }
        }
    }
};

@Module({
    imports: [
        ClusterModule.forRootAsync({
            useFactory(options: ClusterModuleOptions) {
                return options;
            },
            inject: [MyOptionsSymbol],
            extraProviders: [MyOptionsProvider]
        })
    ]
})
export class AppModule {}
```

... or via `useExisting`, if you wish to use an existing configuration provider imported from a different module.

```TypeScript
ClusterModule.forRootAsync({
    imports: [ConfigModule],
    useExisting: ConfigService
})
```

### readyLog

```TypeScript
import { Module } from '@nestjs/common';
import { ClusterModule } from '@mvmdev/nestjs-redis';

@Module({
    imports: [
        ClusterModule.forRoot({
            readyLog: true,
            config: {
                nodes: [{ host: 'localhost', port: 16380 }],
                options: { redisOptions: { password: 'cluster1' } }
            }
        })
    ]
})
export class AppModule {}
```

The `ClusterModule` will display a message when `CLUSTER INFO` reporting the cluster is able to receive commands.

```sh
[Nest] 18886  - 09/16/2021, 6:19:56 PM     LOG [ClusterModule] default: Connected successfully to the server
```

### Single client

```TypeScript
import { Module } from '@nestjs/common';
import { ClusterModule } from '@mvmdev/nestjs-redis';

@Module({
    imports: [
        ClusterModule.forRoot({
            config: {
                nodes: [{ host: 'localhost', port: 16380 }],
                options: { redisOptions: { password: 'cluster1' } }

                // or with URL
                // nodes: ['redis://:cluster1@localhost:16380']
            }
        })
    ]
})
export class AppModule {}
```

### Multiple clients

```TypeScript
import { Module } from '@nestjs/common';
import { ClusterModule } from '@mvmdev/nestjs-redis';

@Module({
    imports: [
        ClusterModule.forRoot({
            config: [
                {
                    nodes: [{ host: 'localhost', port: 16380 }],
                    options: { redisOptions: { password: 'cluster1' } }
                },
                {
                    namespace: 'cluster2',
                    nodes: [{ host: 'localhost', port: 16480 }],
                    options: { redisOptions: { password: 'cluster2' } }
                }
            ]
        })
    ]
})
export class AppModule {}
```

with URL:

```TypeScript
import { Module } from '@nestjs/common';
import { ClusterModule } from '@mvmdev/nestjs-redis';

@Module({
    imports: [
        ClusterModule.forRoot({
            config: [
                {
                    nodes: ['redis://:cluster1@localhost:16380']
                },
                {
                    namespace: 'cluster2',
                    nodes: ['redis://:cluster2@localhost:16480']
                }
            ]
        })
    ]
})
export class AppModule {}
```

### onClientCreated

For example, we can listen to the error event of the cluster client.

```TypeScript
import { Module } from '@nestjs/common';
import { ClusterModule } from '@mvmdev/nestjs-redis';

@Module({
    imports: [
        ClusterModule.forRoot({
            config: {
                nodes: [{ host: 'localhost', port: 16380 }],
                options: { redisOptions: { password: 'cluster1' } },
                onClientCreated(client) {
                    client.on('error', err => {});
                }
            }
        })
    ]
})
export class AppModule {}
```

### Non-global

By default, the `ClusterModule` is registered in the global scope, so `ClusterService` and `all cluster clients defined` are available everywhere.

You can change the behavior by modifying `isGlobal` parameter:

```TypeScript
// shared-cluster.module.ts
import { Module } from '@nestjs/common';
import { ClusterModule } from '@mvmdev/nestjs-redis';

@Module({
    imports: [
        ClusterModule.forRoot(
            {
                readyLog: true,
                config: {
                    nodes: [{ host: 'localhost', port: 16380 }],
                    options: { redisOptions: { password: 'cluster1' } }
                }
            },
            false
        )
    ],
    exports: [ClusterModule]
})
export class SharedCluster {}
```

The next thing is import `SharedCluster` to the consumer module:

```TypeScript
// cats.module.ts
import { Module } from '@nestjs/common';
import { CatsService } from './cats.service';
import { CatsController } from './cats.controller';
import { SharedCluster } from '../shared-cluster.module';

@Module({
    imports: [SharedCluster],
    providers: [CatsService],
    controllers: [CatsController]
})
export class CatsModule {}
```
