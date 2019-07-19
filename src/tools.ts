import * as debugAgent from '@google-cloud/debug-agent';
import * as profiler from '@google-cloud/profiler';
import * as trace from '@google-cloud/trace-agent';

let toolsAreSetup = false;

/**
 * Starts Google Cloud tooling.
 * - StackDriver Trace
 * - StackDriver Profiler
 * - StackDriver Debugger
 */
export function startTooling() {
  // Ensure tools are only setup once per process.
  if (toolsAreSetup) {
    return null;
  } else {
    toolsAreSetup = true;
  }

  // Start Trace
  trace.start();

  // Start profiler
  profiler
    .start({
      serviceContext: {
        service: getServiceName(),
        version: 'v1',
      },
    })
    .catch(err => {
      console.error('Failed to start profiler', err);
    });

  // Start debugger
  const debug = debugAgent.start({
    serviceContext: {
      service: getServiceName(),
      version: 'v1',
      // version: functions.config().tsc.version
    },
  });

  // Return all tools
  return {
    trace,
    profiler,
    debug,
  };
}

/**
 * Gets the name of the function for logging.
 * @returns {string} The name of the function with a '_function' suffix.
 */
function getServiceName(): string {
  const serviceName = process.env.FUNCTION_TARGET || 'unknown_cloud';
  return `${serviceName}_function`;
}
