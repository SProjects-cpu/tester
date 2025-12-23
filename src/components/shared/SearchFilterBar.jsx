import { Search, Filter } from 'lucide-react';
import DateRangeFilter from '../DateRangeFilter';

/**
 * SearchFilterBar - Unified search and filter bar component
 * Provides consistent search and filtering across all startup pages
 * 
 * @param {Object} props
 * @param {string} props.searchTerm - Current search term
 * @param {Function} props.onSearchChange - Callback when search changes
 * @param {string} props.searchPlaceholder - Placeholder text for search input
 * @param {Array} props.filters - Array of filter configurations
 * @param {Object} props.filterValues - Current filter values
 * @param {Function} props.onFilterChange - Callback when filter changes
 * @param {boolean} props.showDateFilter - Whether to show date range filter
 * @param {Function} props.onDateRangeChange - Callback when date range changes
 * @param {React.ReactNode} props.additionalControls - Additional controls to render
 */
export default function SearchFilterBar({
  searchTerm = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  filterValues = {},
  onFilterChange,
  showDateFilter = true,
  onDateRangeChange,
  additionalControls
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
      {/* Search Input */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm sm:text-base"
        />
      </div>

      {/* Dynamic Filters */}
      {filters.map((filter) => (
        <div key={filter.key} className="relative sm:w-48">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-5 h-5" />
          <select
            value={filterValues[filter.key] || filter.defaultValue || 'all'}
            onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
            className="w-full pl-10 pr-8 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none appearance-none cursor-pointer transition-all text-sm sm:text-base"
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {/* Date Range Filter */}
      {showDateFilter && (
        <DateRangeFilter 
          variant="inline"
          onDateRangeChange={onDateRangeChange}
        />
      )}

      {/* Additional Controls (History button, View Toggle, etc.) */}
      {additionalControls}
    </div>
  );
}

/**
 * Helper function to create stage filter options
 */
export const createStageFilterOptions = () => [
  { value: 'all', label: 'All Stages' },
  { value: 'S0', label: 'S0 - Registered' },
  { value: 'S1', label: 'S1 - Stage 1' },
  { value: 'S2', label: 'S2 - Stage 2' },
  { value: 'S3', label: 'S3 - Stage 3' },
  { value: 'One-on-One', label: 'One-on-One' }
];

/**
 * Helper function to create sector filter options from startups
 */
export const createSectorFilterOptions = (startups) => {
  const sectors = [...new Set(startups.map(s => s.sector).filter(Boolean))].sort();
  return [
    { value: 'all', label: 'All Sectors' },
    ...sectors.map(sector => ({ value: sector, label: sector }))
  ];
};

/**
 * Helper function to create date field filter options
 */
export const createDateFieldOptions = () => [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'registeredDate', label: 'Registered Date' },
  { value: 'onboardedDate', label: 'Onboarded Date' }
];
