import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportsService {
  summary() {
    return {
      message: 'Reports summary ready',
    };
  }
}
