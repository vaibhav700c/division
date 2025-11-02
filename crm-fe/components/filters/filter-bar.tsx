"use client"

import type React from "react"

import { X, Search, Filter, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface FilterChip {
  id: string
  label: string
  value: string
  color?: "default" | "success" | "warning" | "error" | "info"
}

interface FilterBarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  filters: FilterChip[]
  onRemoveFilter: (id: string) => void
  onClearAll: () => void
  children?: React.ReactNode
  placeholder?: string
  showFilterIcon?: boolean
  totalItems?: number
  filteredItems?: number
}

export function FilterBar({
  searchValue,
  onSearchChange,
  filters,
  onRemoveFilter,
  onClearAll,
  children,
  placeholder = "Search...",
  showFilterIcon = true,
  totalItems,
  filteredItems,
}: FilterBarProps) {
  const hasFilters = filters.length > 0 || searchValue
  const hasActiveFilters = filters.length > 0

  return (
    <div className="space-y-4">
      {/* Main Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Section */}
        <div className="flex-1 space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={placeholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-10 bg-background border-border focus:border-primary/50 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3">
          {showFilterIcon && hasActiveFilters && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters applied</span>
            </div>
          )}
          
          {/* Filter Dropdowns/Selects */}
          <div className="flex items-center gap-2">
            {children}
          </div>

          {/* Clear All Button */}
          {hasFilters && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClearAll} 
                className="text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-3 w-3" />
            <span>Active filters:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Badge
                key={filter.id}
                variant={filter.color || "default"}
                className="px-3 py-1.5 text-xs font-medium rounded-full border cursor-pointer hover:opacity-80 transition-opacity group"
                onClick={() => onRemoveFilter(filter.id)}
              >
                <span>{filter.label}</span>
                <X className="ml-2 h-3 w-3 group-hover:text-destructive transition-colors" />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Results Counter */}
      {(totalItems !== undefined && filteredItems !== undefined) && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {filteredItems.toLocaleString()} of {totalItems.toLocaleString()} {totalItems === 1 ? 'item' : 'items'}
          </span>
          {hasFilters && filteredItems !== totalItems && (
            <span className="text-xs">
              {totalItems - filteredItems} filtered out
            </span>
          )}
        </div>
      )}
    </div>
  )
}
