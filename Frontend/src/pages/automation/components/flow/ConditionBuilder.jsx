import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";

const DEFAULT_OPS_BY_TYPE = {
  number: ["eq", "neq", "gt", "gte", "lt", "lte", "exists"],
  text: ["eq", "neq", "contains", "in", "not_in", "exists"],
  enum: ["eq", "in", "not_in", "exists"],
  boolean: ["eq", "neq", "exists"],
};

const OP_LABEL = {
  exists: "Exists",
  eq: "=",
  "==": "=",
  neq: "!=",
  "!=": "!=",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  in: "In",
  nin: "Not in",
  not_in: "Not in",
  contains: "Contains",
};

const normalizeOp = (op) => {
  const v = String(op || "").toLowerCase();
  if (v === "==") return "eq";
  if (v === "!=") return "neq";
  if (v === "nin") return "not_in";
  return v || "eq";
};

const ensureArray = (v) => {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  return [v];
};

const parseMaybeNumber = (s) => {
  if (s === "" || s == null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

function TagInput({ value = [], onChange, placeholder = "Enter values, press Enter" }) {
  const [text, setText] = useState("");

  const add = (raw) => {
    const v = String(raw || "").trim();
    if (!v) return;
    const next = Array.from(new Set([...(value || []), v]));
    onChange?.(next);
  };

  const remove = (v) => {
    const next = (value || []).filter((x) => x !== v);
    onChange?.(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {(value || []).map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-xs"
          >
            {v}
            <button
              type="button"
              className="text-gray-500 hover:text-gray-800"
              onClick={() => remove(v)}
              aria-label="remove"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <Input
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(text);
            setText("");
          }
        }}
      />
      <div className="text-[11px] text-gray-500">
        Nhấn Enter để thêm nhiều giá trị (dùng cho In/Not in).
      </div>
    </div>
  );
}

import Autocomplete from "./Autocomplete";

function ValueEditor({ field, op, value, onChange }) {
  const type = field?.type || "text";
  const normalizedOp = normalizeOp(op);
  const isArrayOp = normalizedOp === "in" || normalizedOp === "not_in";
  const isExists = normalizedOp === "exists";
  const options = Array.isArray(field?.options) ? field.options : [];

  if (isExists) return null;

  // Use Autocomplete for fields with options but still allow manual entry
  // This is better than a plain Select for many automation scenarios
  const shouldUseAutocomplete = !isArrayOp && (options.length > 0 || type === "text" || type === "number");

  if (isArrayOp) {
    return (
      <TagInput
        value={ensureArray(value)}
        onChange={(arr) => {
          if (type === "number") {
            const nums = arr.map(parseMaybeNumber).filter((n) => n != null);
            onChange?.(nums);
          } else {
            onChange?.(arr);
          }
        }}
        placeholder="Nhập giá trị và Enter"
      />
    );
  }

  if (type === "boolean") {
    const cur = value === true ? "true" : value === false ? "false" : "";
    return (
      <Select value={cur} onValueChange={(v) => onChange?.(v === "true")}>
        <SelectTrigger className="h-9 bg-white shadow-sm border-gray-200">
          <SelectValue placeholder="Chọn true/false" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">true</SelectItem>
          <SelectItem value="false">false</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (shouldUseAutocomplete) {
    return (
      <Autocomplete
        value={value == null ? "" : String(value)}
        onChange={(v) => {
          if (type === "number") {
            const n = parseMaybeNumber(v);
            onChange?.(n !== null ? n : v); // Fallback to string if not a valid number but user wants to type it
          } else {
            onChange?.(v);
          }
        }}
        options={options}
        placeholder={field?.placeholder || "Nhập hoặc chọn..."}
      />
    );
  }

  return (
    <Input
      type={type === "number" ? "number" : "text"}
      value={value ?? ""}
      onChange={(e) => {
        const val = e.target.value;
        onChange?.(type === "number" ? parseMaybeNumber(val) : val);
      }}
      placeholder="Nhập giá trị"
      className="h-9 bg-white shadow-sm border-gray-200"
    />
  );
}

function RuleRow({ rule, fields, onChange, onRemove }) {
  const field = fields.find((f) => f.path === rule.path) || null;

  const ops = useMemo(() => {
    if (field?.ops?.length) return field.ops.map(normalizeOp);
    const byType = DEFAULT_OPS_BY_TYPE[field?.type || "text"] || ["eq", "neq", "exists"];
    return byType.map(normalizeOp);
  }, [field]);

  // ensure op is valid
  useEffect(() => {
    const current = normalizeOp(rule.op);
    if (ops.length && !ops.includes(current)) {
      onChange?.({ ...rule, op: ops[0] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rule.path]);

  const opValue = normalizeOp(rule.op || "eq");

  return (
    <div className="grid grid-cols-12 gap-2 items-start">
      {/* Field */}
      <div className="col-span-5">
        <Select
          value={rule.path || ""}
          onValueChange={(v) =>
            onChange?.({
              ...rule,
              path: v,
              op: "eq",
              value: null,
            })
          }
        >
          <SelectTrigger className="h-9 bg-white">
            <SelectValue placeholder="Chọn field" />
          </SelectTrigger>
          <SelectContent>
            {fields.map((f) => (
              <SelectItem key={f.path} value={f.path}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Operator */}
      <div className="col-span-3">
        <Select
          value={opValue}
          onValueChange={(v) => onChange?.({ ...rule, op: v })}
        >
          <SelectTrigger className="h-9 bg-white">
            <SelectValue placeholder="Op" />
          </SelectTrigger>
          <SelectContent>
            {ops.map((o) => (
              <SelectItem key={o} value={o}>
                {OP_LABEL[o] || o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Value */}
      <div className="col-span-3">
        <ValueEditor
          field={field}
          op={opValue}
          value={rule.value}
          onChange={(v) => onChange?.({ ...rule, value: v })}
        />
      </div>

      {/* Remove */}
      <div className="col-span-1 flex justify-end">
        <Button
          type="button"
          variant="actionDelete"
          size="icon"
          onClick={onRemove}
          title="Xóa rule"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function ConditionBuilder({
  fields = [],
  value,
  onChange,
  title = "Conditions",
  subtitle = "Thiết lập điều kiện theo dạng rule (không cần nhập JSON).",
}) {
  const initialFilters = useMemo(() => {
    const v = value?.filters;
    return Array.isArray(v) ? v : [];
  }, [value]);

  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const emit = (nextFilters) => {
    setFilters(nextFilters);
    onChange?.({ filters: nextFilters });
  };

  const addRule = () => {
    const first = fields[0];
    const rule = {
      path: first?.path || "",
      op: "eq",
      value: null,
    };
    emit([...(filters || []), rule]);
  };

  const updateRule = (idx, patch) => {
    const next = (filters || []).map((r, i) => (i === idx ? { ...r, ...patch } : r));
    emit(next);
  };

  const removeRule = (idx) => {
    const next = (filters || []).filter((_, i) => i !== idx);
    emit(next);
  };

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
        </div>
        <Button type="button" variant="actionCreate" size="sm" onClick={addRule}>
          <Plus className="w-4 h-4 mr-1" />
          Add rule
        </Button>
      </div>

      {(!filters || filters.length === 0) ? (
        <div className="text-sm text-gray-500 bg-gray-50 border rounded-md p-3">
          Chưa có rule nào. Nhấn “Add rule”.
        </div>
      ) : (
        <div className="space-y-2">
          {filters.map((rule, idx) => (
            <RuleRow
              key={`${rule.path || "rule"}_${idx}`}
              rule={rule}
              fields={fields}
              onChange={(r) => updateRule(idx, r)}
              onRemove={() => removeRule(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
