import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { CircuitBreakerService } from 'src/common/circuit-breaker/circuit-breaker.service';
import { serviceConfig } from 'src/config/gateway.config';
import { UserInfo } from 'src/interfaces/user-info';

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

@Injectable()
export class ProxyService {
    private readonly logger = new Logger(ProxyService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly circuitBreakerService: CircuitBreakerService,
    ) { }

    async proxyRequest(
        serviceName: keyof typeof serviceConfig,
        method: string,
        path: string,
        data?: unknown,
        headers?: Record<string, string>,
        userInfo?: UserInfo,
    ) {
        const service = serviceConfig[serviceName];
        const url = `${service.url}${path}`;

        this.logger.log(`Proxying ${method} request to ${serviceName}: ${url}`);

        return this.circuitBreakerService.executeWithCircuitBreaker(
            async () => {
                const enhancedHeaders = {
                    ...headers,
                    'x-user-id': userInfo?.userId,
                    'x-user-email': userInfo?.email,
                    'x-user-role': userInfo?.role,
                };

                const response = await firstValueFrom(
                    this.httpService.request({
                        method: method.toLocaleLowerCase() as HttpMethod,
                        url: url,
                        headers: enhancedHeaders,
                        data: data,
                        timeout: service.timeout,
                    }),
                );
                return response
            },
            `proxy-${serviceName}`,
            () => {
                this.logger.error(`Error proxying ${method} request to ${serviceName}: ${url}`);
                throw new Error(`Service ${serviceName} is temporarily unavailable`);
            },
            { failureThreshold: 5, resetTimeout: 30000, timeout: 30000 }
        )
    }

    async getServiceHealth(serviceName: keyof typeof serviceConfig) {
        try {
            const service = serviceConfig[serviceName];
            const response = await firstValueFrom(
                this.httpService.get(`${service.url}/health`, {
                    timeout: service.timeout,
                }),
            );
            return { status: 'healthy', data: response.data };
        } catch (error: Error | any) {
            return { status: 'unhealthy', error: error.message }
        }
    }
}
