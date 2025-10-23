import React, { useRef } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from 'lucide-react';

const ImportExportDropdown = ({
  menuItems = [], // Array of menu items with label, icon, and action
  disabled = false,
  variant = "outline",
  size = "sm",
  trigger = "button", // "button" hoặc "icon"
  className = ""
}) => {
  const fileInputRef = useRef(null);

  const renderTrigger = () => {
    if (trigger === "icon") {
      return (
        <Button variant="actionNormal" className={className}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      );
    }

    return (
      <Button variant={variant} size={size} className={className}>
        Import/Export
      </Button>
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          {renderTrigger()}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {menuItems.map((item, index) => (
            <DropdownMenuItem
              key={index}
              onClick={item.action}
              disabled={item.disabled}
            >
              {item.icon && <item.icon className="w-4 h-4 mr-2" />}
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        style={{ display: 'none' }}
      />
    </>
  );
};

export default ImportExportDropdown;