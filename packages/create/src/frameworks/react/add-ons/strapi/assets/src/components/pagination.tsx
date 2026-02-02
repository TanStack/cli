import { useRouter, useSearch } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  pageCount: number
  className?: string
}

export function Pagination({ pageCount, className = '' }: PaginationProps) {
  const router = useRouter()
  const search = useSearch({ strict: false })
  const currentPage = Number((search as any)?.page) || 1

  const handlePageChange = (page: number) => {
    router.navigate({
      to: '.',
      search: (prev) => ({ ...prev, page }),
      replace: true,
    })
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: Array<number | 'ellipsis'> = []
    const showEllipsis = pageCount > 7

    if (showEllipsis) {
      pages.push(1)

      if (currentPage > 3) {
        pages.push('ellipsis')
      }

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(pageCount - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < pageCount - 2) {
        pages.push('ellipsis')
      }

      if (pageCount > 1) {
        pages.push(pageCount)
      }
    } else {
      for (let i = 1; i <= pageCount; i++) {
        pages.push(i)
      }
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  if (pageCount <= 1) return null

  return (
    <nav className={`flex items-center justify-center gap-1 ${className}`}>
      {/* Previous Button */}
      <button
        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          currentPage <= 1
            ? 'text-gray-600 cursor-not-allowed'
            : 'text-gray-300 hover:bg-slate-700 hover:text-white'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 py-2 text-gray-500 hidden md:block"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`min-w-[40px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === page
                  ? 'bg-cyan-500 text-white'
                  : 'text-gray-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {page}
            </button>
          )
        )}
      </div>

      {/* Next Button */}
      <button
        onClick={() =>
          currentPage < pageCount && handlePageChange(currentPage + 1)
        }
        disabled={currentPage >= pageCount}
        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          currentPage >= pageCount
            ? 'text-gray-600 cursor-not-allowed'
            : 'text-gray-300 hover:bg-slate-700 hover:text-white'
        }`}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  )
}
