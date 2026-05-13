import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Personalize a chave de rastreamento para incluir o IP e o User-Agent
    return `${req.ip}-${req.headers['user-agent']}`;
  }

}
