import cronstrue from "cronstrue";
import "cronstrue/locales/vi";

export function buildCronExpr({ type, hour, minute, daysOfWeek }) {
  const h = Number(hour);
  const m = Number(minute);

  if (type === "daily") {
    return `${m} ${h} * * *`;
  }

  if (type === "weekly") {
    // daysOfWeek: [1,2,3]
    return `${m} ${h} * * ${daysOfWeek.join(",")}`;
  }

  if (type === "monthly") {
    return `${m} ${h} 1 * *`;
  }

  return "* * * * *";
}

export function formatCron(expr) {
  try {
    return cronstrue.toString(expr, { locale: "vi" });
  } catch {
    return expr;
  }
}

export function parseCronExpr(expr) {
  if (!expr) return { type: "daily", hour: "9", minute: "0", daysOfWeek: [] };

  const parts = expr.split(" ");
  if (parts.length < 5) return { type: "daily", hour: "9", minute: "0", daysOfWeek: [] };

  const minute = parts[0];
  const hour = parts[1];
  const dayOfMonth = parts[2];
  const month = parts[3];
  const dayOfWeek = parts[4];

  if (dayOfWeek !== "*" && dayOfWeek !== "?") {
    const days = dayOfWeek.split(",").map(Number);
    return { type: "weekly", hour, minute, daysOfWeek: days };
  }

  if (dayOfMonth !== "*" && dayOfMonth !== "?") {
    return { type: "monthly", hour, minute, daysOfWeek: [] };
  }

  return { type: "daily", hour, minute, daysOfWeek: [] };
}
