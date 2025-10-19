import { ChevronDown, Mail, Paperclip, Pencil, Settings } from 'lucide-react';
import React, { useState } from 'react';
// Sử dụng Button của dự án
import { Button } from '@/components/ui/button';
import DropdownOptions from '@/components/common/DropdownOptions';

export default function EmailEditor({ value, onChange }) {
  const [openContent, setOpenContent] = useState(true);
  const [openAccount, setOpenAccount] = useState(false);
  const [openCheck, setOpenCheck] = useState(false);

  return (
    <div className="p-0">
      <div className=" overflow-hidden border bg-white rounded-bl-2xl rounded-br-2xl flex flex-col">
        {/* Nội dung */}
        <div className="bg-white hover:bg-brand-50 px-4 py-3 border-b flex items-center justify-between"
          onClick={() => setOpenContent((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-900">Nội dung</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-700"
            onClick={() => setOpenContent((v) => !v)}
          >
            <ChevronDown
              className={
                "w-4 h-4 transition " + (openContent ? "rotate-0" : "-rotate-90")
              }
            />
          </Button>
        </div>

        {openContent && (
          <div className="p-4 space-y-4">
            <div className="space-y-1">
              <label className="text-sm text-gray-700">Tiêu đề email</label>
              <input
                className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-500"
                placeholder="Nhập nội dung"
                value={value.subject || ""}
                onChange={(e) => onChange({ ...value, subject: e.target.value })}
              />
            </div>

            <div className="">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nội dung email
              </label>
              <textarea
                className="w-full min-h-[200px] rounded-lg border border-gray-300 p-3 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="Nhập nội dung email..."
              />
            </div>


            <Button variant="outline" className="flex items-center gap-2 text-sm text-blue-600">
              <Paperclip className="w-4 h-4" />
              Thêm file đính kèm
            </Button>

            <hr className="my-2" />

            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-800">
                Hành động bổ sung
              </div>
              <div className="text-sm text-gray-500">Hành động khi mở Email</div>
              <Button variant="actionUpdate" className="w-full">
                Chọn hành động
              </Button>
              <Button variant="actionCreate" className="mt-2 text-sm">
                + Thêm hành động
              </Button>
            </div>
          </div>
        )}

        {/* Chọn tài khoản */}
        <div className="px-4 py-3 border-t flex items-center justify-between bg-white hover:bg-brand-50"
          onClick={() => setOpenAccount((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-brand-500" />
            <span className="font-medium text-gray-900">Chọn tài khoản</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-700"
            onClick={() => setOpenAccount((v) => !v)}
          >
            <ChevronDown
              className={
                "w-4 h-4 transition " +
                (openAccount ? "rotate-0" : "-rotate-90")
              }
            />
          </Button>
        </div>
        {openAccount && (
          <div className="px-4 py-3">
            <DropdownOptions
              options={[
                { value: 'account1', label: 'Tài khoản Email 1' },
                { value: 'account2', label: 'Tài khoản Email 2' },
              ]}
              value={value.emailAccount || ''}
              onChange={(val) => onChange({ ...value, emailAccount: val })}
              placeholder="Chọn tài khoản email"
            >


            </DropdownOptions>
          </div>
        )}

        {/* Kiểm tra */}
        <div className="px-4 py-3 border-t flex items-center justify-between bg-white hover:bg-brand-50"
          onClick={() => setOpenCheck((v) => !v)}
        >
          <div className="flex items-center gap-2"

          >
            <Settings className="w-4 h-4 text-brand-500" />
            <span className="font-medium text-gray-900">Kiểm tra</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-700"
            onClick={() => setOpenCheck((v) => !v)}
          >
            <ChevronDown
              className={
                "w-4 h-4 transition " + (openCheck ? "rotate-0" : "-rotate-90")
              }
            />
          </Button>
        </div>
        {openCheck && (
          <div className="px-4 py-3 bg-gray-50">
            <Button variant="actionUpdate" className="h-9 px-4">
              Gửi test
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}