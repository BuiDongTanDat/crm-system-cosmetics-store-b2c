import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Braces } from "lucide-react";
import Toggle from "./Toggle";

export default function BasicConfigForm({ schema, value = {}, onChange, actionTypes, renderNestedAction, availableVariables = [] }) {
    // If schema is empty, fallback to simple key-value for existing data?
    if (!schema || schema.length === 0) {
        return <div className="text-gray-400 italic text-xs">No configuration fields.</div>;
    }

    const handleChange = (key, val) => {
        onChange({
            ...value,
            [key]: val,
        });
    };

    return (
        <div className="space-y-4">
            {schema.map((field) => {
                const fieldKey = field.name || field.key;
                const fieldType = (field.type || "string").toLowerCase();
                let fieldValue = value[fieldKey];

                // Robust Array/Tags handling
                const isArrayType = fieldType === 'tags' || fieldType === 'array';
                const isCurrentArray = Array.isArray(fieldValue);

                const handleFieldChange = (val) => {
                    if (isArrayType) {
                        // If it's supposed to be an array but we got a string from Input, convert it
                        if (typeof val === 'string') {
                            const arr = val.split(',').map(s => s.trim()).filter(Boolean);
                            handleChange(fieldKey, arr);
                        } else {
                            handleChange(fieldKey, val);
                        }
                    } else {
                        handleChange(fieldKey, val);
                    }
                };

                // Convert array to string for display in text-like inputs
                let displayValue = fieldValue;
                if (isArrayType && isCurrentArray) {
                    displayValue = fieldValue.join(", ");
                } else if (isArrayType && !isCurrentArray && fieldValue) {
                    displayValue = fieldValue;
                }

                return (
                    <div key={fieldKey} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">
                                {field.label || fieldKey}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            {fieldType === "boolean" && (
                                <Toggle
                                    checked={!!fieldValue}
                                    onChange={(v) => handleChange(fieldKey, v)}
                                />
                            )}
                        </div>

                        {field.description && (
                            <p className="text-xs text-gray-500 mb-1">{field.description}</p>
                        )}

                        {/* Special handling for 'next_action' (recursive) */}
                        {(fieldKey === "next_action" || fieldKey === "else_action" || fieldKey === "then_action") && renderNestedAction ? (
                            renderNestedAction(fieldValue, handleFieldChange)
                        ) : (
                            renderInput(field, displayValue, handleFieldChange, availableVariables)
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function renderInput(field, value, onChange, availableVariables = []) {
    const type = (field.type || "string").toLowerCase();
    const fieldKey = field.name || field.key;

    // HEURISTIC: Should this field support variables?
    // Almost all text/number/textarea fields in automation can benefit from variables.
    const supportsVariables = availableVariables.length > 0 &&
        ["text", "string", "number", "textarea", "tags"].includes(type);

    const inputElement = (() => {
        switch (type) {
            case "boolean":
            case "bool":
                return null; // Handled by Toggle

            case "select":
            case "enum":
                return (
                    <Select
                        value={value?.toString() || ""}
                        onValueChange={onChange}
                    >
                        <SelectTrigger className="w-full bg-white h-9 border-gray-200 shadow-sm hover:border-brand-300 transition-colors">
                            <SelectValue placeholder="Chọn giá trị" />
                        </SelectTrigger>
                        <SelectContent>
                            {(field.options || []).map((opt, idx) => {
                                const isString = typeof opt === 'string';
                                const val = isString ? opt : opt.value;
                                const label = isString ? opt : (opt.label || opt.value);
                                return (
                                    <SelectItem key={val || idx} value={val?.toString()}>
                                        {label}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                );

            case "number":
            case "int":
            case "integer":
                return (
                    <Input
                        type={supportsVariables ? "text" : "number"}
                        value={value ?? ""}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (!supportsVariables && !isNaN(val) && val !== "") {
                                onChange(Number(val));
                            } else {
                                onChange(val);
                            }
                        }}
                        placeholder={field.placeholder || "0"}
                        className="bg-white h-9 border-gray-200 shadow-sm focus-visible:ring-brand-500 focus-visible:border-brand-500"
                    />
                );

            case "textarea":
                return (
                    <Textarea
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder || ""}
                        className="bg-white min-h-[100px] text-sm border-gray-200 shadow-sm focus-visible:ring-brand-500 focus-visible:border-brand-500"
                    />
                );

            case "text":
            case "string":
            case "tags":
            default:
                return (
                    <Input
                        type="text"
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder || ""}
                        className="bg-white h-9 border-gray-200 shadow-sm focus-visible:ring-brand-500 focus-visible:border-brand-500"
                    />
                );
        }
    })();

    if (!inputElement) return null;

    if (supportsVariables) {
        return (
            <div className="flex gap-1 items-start">
                <div className="flex-1 min-w-0">
                    {inputElement}
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="h-9 w-9 flex items-center justify-center rounded-md border border-gray-200 bg-gray-50/50 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-600 transition-all shrink-0 shadow-sm active:scale-95"
                            title="Chèn biến hệ thống"
                        >
                            <Braces className="w-4 h-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 p-1 shadow-lg border-gray-100">
                        <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Available Variables
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="my-1 bg-gray-50" />
                        <div className="max-h-72 overflow-auto custom-scrollbar">
                            {availableVariables.map((v) => (
                                <DropdownMenuItem
                                    key={v.name}
                                    onSelect={() => onChange(`${value || ""}{{ ${v.name} }}`)}
                                    className="flex flex-col items-start gap-1 p-2 rounded-md hover:bg-brand-50/50 focus:bg-brand-50/50 cursor-pointer"
                                >
                                    <code className="text-[11px] font-mono font-semibold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded leading-none">
                                        {`{{ ${v.name} }}`}
                                    </code>
                                    {v.description && (
                                        <span className="text-[10px] text-gray-500 leading-tight">
                                            {v.description}
                                        </span>
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    }

    return inputElement;
}
