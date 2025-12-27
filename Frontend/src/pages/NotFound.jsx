import { ChevronLeft } from 'lucide-react'
import React from 'react'
import { Chevron } from 'react-day-picker'

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <img
          src="/images/background/404.png"
          alt="404 Not Found"
          className="w-80 max-w-full mb-6"
        />
      <p className="text-xl text-gray-600 mt-4">Trang không tồn tại</p>
        <a href="/" className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          <ChevronLeft className="inline-block mr-2" />
          
          Về trang chủ
        </a>
      </div>
    </div>
  )
}

export default NotFound