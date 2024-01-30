
import pino from "pino";
const { BETTER_STACK_SOURCE_TOKEN } = process.env;
const transport = pino.transport({
  targets: [
    {
      target: "@logtail/pino",
      options: { sourceToken: BETTER_STACK_SOURCE_TOKEN }
    },
    {
      target: 'pino-pretty',
    }
  ]

});
export const logger = pino(transport);
