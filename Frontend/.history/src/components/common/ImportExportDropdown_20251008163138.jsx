import React, { useRef } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileDown, FileUp, MoreVertical } from 'lucide-react';
import { exportToCSV, importFromCSV } from '@/utils/helper';

const ImportExportDropdown = ({
  data = [],
  filename = 'data',
  headers = null,
  fieldMapping = {},
  onImportSuccess,
  onImportError,
  disabled = false,
  variant = "outline",
  size = "sm",
  trigger = "button", // "button" hoặc "icon"
  className = ""
}) => {
  const fileInputRef = useRef(null);

  const handleExport = async () => {
    try {
      if (!data || data.length === 0) {
        throw new Error('Không có dữ liệu để xuất');
      }

      let exportData = data;
      let exportHeaders = headers;

      // Nếu có fieldMapping, áp dụng mapping
      if (Object.keys(fieldMapping).length > 0) {
        exportData = data.map(item => {
          const mappedItem = {};
          Object.keys(fieldMapping).forEach(key => {
            const displayName = fieldMapping[key];
            mappedItem[displayName] = item[key] || '';
          });
          return mappedItem;
        });
        exportHeaders = Object.values(fieldMapping);
      }

      await exportToCSV(exportData, `${filename}.csv`, exportHeaders);
    } catch (error) {
      console.error('Lỗi xuất file:', error);
      if (onImportError) {
        onImportError(error.message);
      }
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await importFromCSV(file, true);
      
      if (onImportSuccess) {
        onImportSuccess(result);
      }
    } catch (error) {
      console.error('Lỗi nhập file:', error);
      if (onImportError) {
        onImportError(error.message);
      }
    }

    // Reset input
    event.target.value = '';
  };

  const renderTrigger = () => {
    if (trigger === "icon") {
      return (
        <Button variant="ghost" size="sm" className={className}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      );
    }

    return (
      <Button variant={variant} size={size} className={className}>
        <FileDown className="w-4 h-4 mr-2" />
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
          <DropdownMenuItem onClick={handleExport} disabled={!data || data.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Xuất CSV
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleImportClick}>
            <Upload className="w-4 h-4 mr-2" />
            Nhập CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </>
  );
};

export default ImportExportDropdown;