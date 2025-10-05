import React from 'react';
import { MousePointer } from 'lucide-react';

const ButtonsPage = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <MousePointer className="w-8 h-8 text-brand" />
        <h1 className="text-3xl font-bold text-gray-900">Buttons</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Button Components</h2>
        <p className="text-gray-600 mb-6">
          Các kiểu button với các màu sắc và kích cỡ khác nhau.
        </p>
        
        <div className="space-y-8">
          {/* Primary Buttons */}
          <div>
            <h3 className="text-lg font-medium mb-4">Primary Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Primary
              </button>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Large Primary
              </button>
              <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                Small Primary
              </button>
            </div>
          </div>

          {/* Secondary Buttons */}
          <div>
            <h3 className="text-lg font-medium mb-4">Secondary Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <button className="px-4 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300 transition-colors">
                Secondary
              </button>
              <button className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors">
                Large Secondary
              </button>
              <button className="px-3 py-1.5 text-sm bg-gray-200 text-gray-900 rounded hover:bg-gray-300 transition-colors">
                Small Secondary
              </button>
            </div>
          </div>

          {/* Outline Buttons */}
          <div>
            <h3 className="text-lg font-medium mb-4">Outline Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <button className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-colors">
                Outline
              </button>
              <button className="px-6 py-3 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-colors">
                Green Outline
              </button>
              <button className="px-4 py-2 border-2 border-red-600 text-red-600 rounded-md hover:bg-red-600 hover:text-white transition-colors">
                Red Outline
              </button>
            </div>
          </div>

          {/* Status Buttons */}
          <div>
            <h3 className="text-lg font-medium mb-4">Status Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                Success
              </button>
              <button className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors">
                Warning
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                Danger
              </button>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                Info
              </button>
            </div>
          </div>

          {/* Disabled Button */}
          <div>
            <h3 className="text-lg font-medium mb-4">Disabled State</h3>
            <div className="flex flex-wrap gap-4">
              <button disabled className="px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed">
                Disabled Button
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ButtonsPage;