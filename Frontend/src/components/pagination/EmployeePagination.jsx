import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"

const EmployeePagination = ({ handleNext, handlePrev, totalPages, currentPage, handlePageChange }) => {

  const generatePages = () => {
    const pages = [];
    if (totalPages <= 5) {
      // Nếu tổng số trang <= 5, hiển thị tất cả
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logic cho nhiều trang hơn
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  }

  const pagesToShow = generatePages();

  return (
    <div className="flex justify-center items-center gap-4">
      
      <Pagination>
        <PaginationContent>
          {/* Previous Button */}
          <PaginationItem>
            <PaginationPrevious
              onClick={currentPage > 1 ? handlePrev : undefined}
              className={cn(
                "cursor-pointer",
                currentPage <= 1 && "pointer-events-none opacity-50" 
              )}
            />
          </PaginationItem>

          {/* Page Numbers */}
          {pagesToShow.map((p, index) => (
            <PaginationItem key={index}>
              {p === '...' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  isActive={p === currentPage}
                  onClick={() => handlePageChange(p)}
                  className="cursor-pointer"
                >
                  {p}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          {/* Next Button */}
          <PaginationItem>
            <PaginationNext
              onClick={currentPage < totalPages ? handleNext : undefined}
              className={cn(
                "cursor-pointer",
                currentPage >= totalPages && "pointer-events-none opacity-50"
              )}
            />
          </PaginationItem>

        </PaginationContent>
      </Pagination>
    </div>
  )
}

export default EmployeePagination;
