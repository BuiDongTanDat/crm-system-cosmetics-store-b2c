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
