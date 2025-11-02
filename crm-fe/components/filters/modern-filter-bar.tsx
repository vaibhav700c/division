"use client"

import * as React from "react"
import { Search, X, Filter, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FacetedFilter } from "./faceted-filter"

interface FilterOption {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
  count?: number
}

interface FilterConfig {
  key: string
  title: string
  options: FilterOption[]
  selectedValues: Set<string>
  onSelectionChange: (values: Set<string>) => void
}

interface ModernFilterBarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  placeholder?: string
  filters?: FilterConfig[]
  onResetFilters?: () => void
  children?: React.ReactNode
  totalItems?: number
  filteredItems?: number
  className?: string
}

export function ModernFilterBar({
  searchValue,
  onSearchChange,
  placeholder = "Search...",
  filters = [],
  onResetFilters,
  children,
  totalItems,
  filteredItems,
  className,
}: ModernFilterBarProps) {
  const hasActiveFilters = filters.some(filter => filter.selectedValues.size > 0) || searchValue.length > 0

  const resetAllFilters = () => {
    onSearchChange("")
    filters.forEach(filter => {
      filter.onSelectionChange(new Set())
    })
    onResetFilters?.()
  }

  const totalActiveFilters = filters.reduce((acc, filter) => acc + filter.selectedValues.size, 0)

  return (
    <div className={`space-y-4 ${className || ""}`}>
      {/* Main Filter Row */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={placeholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-10 bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all"
            />
            {searchValue && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 hover:bg-muted"
                onClick={() => onSearchChange("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          {/* Faceted Filters */}
          {filters.map((filter) => (
            <FacetedFilter
              key={filter.key}
              title={filter.title}
              options={filter.options}
              selectedValues={filter.selectedValues}
              onSelectionChange={filter.onSelectionChange}
            />
          ))}

          {/* Custom Filter Components */}
          {children}

          {/* Reset Button */}
          {hasActiveFilters && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAllFilters}
                className="h-8 px-2 lg:px-3 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Active Filters Summary */}
      {(hasActiveFilters || (totalItems !== undefined && filteredItems !== undefined)) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* Filter Summary */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Filter className="h-3 w-3" />
                <span>
                  {totalActiveFilters} filter{totalActiveFilters !== 1 ? 's' : ''} applied
                </span>
              </div>
              {searchValue && (
                <Badge variant="default" className="text-xs">
                  Search: "{searchValue}"
                </Badge>
              )}
            </div>
          )}

          {/* Results Counter */}
          {(totalItems !== undefined && filteredItems !== undefined) && (
            <div className="text-sm text-muted-foreground">
              {filteredItems === totalItems ? (
                <span>
                  {totalItems.toLocaleString()} total {totalItems === 1 ? 'item' : 'items'}
                </span>
              ) : (
                <span>
                  {filteredItems.toLocaleString()} of {totalItems.toLocaleString()} {totalItems === 1 ? 'item' : 'items'}
                  <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
                    ({(totalItems - filteredItems).toLocaleString()} hidden)
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}