import React, { useMemo } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";


export const parseVariables = (schema) => {
    if (!schema) return [];

    // Support standard JSON Schema 'properties'
    if (schema.properties) {
        return Object.entries(schema.properties).map(([key, prop]) => ({
            name: key,
            type: prop.type || "string",
            description: prop.title || prop.description || ""
        }));
    }

    // Support simple array of strings/objects (legacy)
    if (Array.isArray(schema)) {
        return schema.map(item => {
            if (typeof item === 'string') return { name: item, type: 'string' };
            return {
                name: item.name || item.key,
                type: item.type || 'string',
                description: item.label || item.description
            };
        });
    }

    return [];
};

export default function AvailableVariablesPanel({ schema }) {
    const variables = useMemo(() => parseVariables(schema), [schema]);

    if (!variables || variables.length === 0) {
        return (
            <div className="text-xs text-gray-400 italic p-4 text-center border rounded-lg bg-gray-50 border-dashed">
                No context variables available.
            </div>
        );
    }

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(`{{ ${text} }}`);
    };

    return (
        <div className="space-y-2 mt-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Available Variables (Read-only)
            </div>
            <div className="space-y-1">
                {variables.map((v) => (
                    <div
                        key={v.name}
                        className="group flex items-center justify-between p-2 rounded-md border border-gray-100 bg-gray-50/50 hover:bg-blue-50/50 hover:border-blue-100 transition-all"
                    >
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-mono font-medium text-gray-700 truncate" title={v.name}>
                                    {v.name}
                                </span>
                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-gray-400 font-normal">
                                    {v.type}
                                </Badge>
                            </div>
                            {v.description && (
                                <div className="text-[10px] text-gray-500 truncate mt-0.5">
                                    {v.description}
                                </div>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => copyToClipboard(v.name)}
                            title="Copy variable"
                        >
                            <Copy className="w-3 h-3 text-gray-400 hover:text-blue-500" />
                        </Button>
                    </div>
                ))}
            </div>
            <div className="text-[10px] text-gray-400 text-center pt-1">
                Variables generated at runtime. Not for manual input.
            </div>
        </div>
    );
}
