import {Request, Response} from './functions';
import {NextFunction} from 'express';

const FUNCTION_EXECUTION_ID_HEADER_KEY = 'function-execution-id';
const TRACE_CONTEXT_HEADER_KEY = 'X-Cloud-Trace-Context';

const TRACE_CONTEXT_PATTERN =
  /^(?<traceId>\w+)\/(?<spanId>\d+);o=(?<options>.+)$/;

function generateExecutionId() {
  const timestampPart = Date.now().toString(36).slice(-6);
  const randomPart = Math.random().toString(36).slice(-6);
  return timestampPart + randomPart;
}

export const executionContextMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let executionId = req.header(FUNCTION_EXECUTION_ID_HEADER_KEY);
  if (!executionId) {
    executionId = generateExecutionId();
  }
  req.executionId = executionId;

  const cloudTraceContext = req.header(TRACE_CONTEXT_HEADER_KEY);
  if (cloudTraceContext) {
    const match = cloudTraceContext.match(TRACE_CONTEXT_PATTERN);
    if (match?.groups) {
      const {traceId, spanId} = match.groups;
      req.traceId = traceId;
      req.spanId = spanId;
    }
  }
  next();
};
