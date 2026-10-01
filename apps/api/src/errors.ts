import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
@Catch()
export class SafeErrors implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    if (error instanceof HttpException) {
      response.status(error.getStatus()).json(error.getResponse());
      return;
    }
    // Database error details may contain personal account fields. Never log
    // query text, parameters, request bodies, passwords or raw exceptions.
    Logger.error(`Backend operation failed (${(error as {code?:string})?.code || 'UNKNOWN'})`,'API');
    response.status(503).json({statusCode:503,message:'Service temporarily unavailable. Please try again.'});
  }
}
