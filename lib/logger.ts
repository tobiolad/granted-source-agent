/**
 * Minimal structured logger. No external service — this is a personal
 * portfolio project, and stdout logs are enough for local dev and for
 * whatever platform ends up hosting it (most PaaS targets capture stdout).
 */

type Level = "info" | "warn" | "error";

interface LogFields {
  [key: string]: unknown;
}

function emit(level: Level, event: string, fields: LogFields = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...fields
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (event: string, fields?: LogFields) => emit("info", event, fields),
  warn: (event: string, fields?: LogFields) => emit("warn", event, fields),
  error: (event: string, fields?: LogFields) => emit("error", event, fields)
};
