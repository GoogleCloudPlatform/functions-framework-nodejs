import {Request, Response} from '../functions';
import {NextFunction} from 'express';

export const timeoutMiddleware = (timeoutMilliseconds: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // In modern versions of Node.js that support the AbortController API we add one to
    // signal function timeout.
    if (timeoutMilliseconds > 0 && 'AbortController' in global) {
      req.abortController = new AbortController();
      req.setTimeout(timeoutMilliseconds);
      let executionComplete = false;
      res.on('timeout', () => {
        // This event is triggered when the underlying socket times out due to inactivity.
        if (!executionComplete) {
          executionComplete = true;
          req.abortController?.abort('timeout');
        }
      });
      req.on('close', () => {
        // This event is triggered when the underlying HTTP connection is closed. This can
        // happen if the data plane times out the request, the client disconnects or the
        // response is complete.
        if (!executionComplete) {
          executionComplete = true;
          req.abortController?.abort('request closed');
        }
      });
      req.on('end', () => {
        // This event is triggered when the function execution completes and we
        // write an HTTP response.
        executionComplete = true;
      });
    }
    // Always call next to continue middleware processing.
    next();
  };
};
