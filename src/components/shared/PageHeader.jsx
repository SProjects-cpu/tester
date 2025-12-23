/**
 * PageHeader - Unified page header component
 * Provides consistent header styling across all startup pages
 * 
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.subtitle - Page subtitle (optional)
 * @param {string} props.gradientColors - Tailwind gradient classes (e.g., 'from-purple-600 to-pink-600')
 * @param {React.ReactNode} props.actions - Action buttons to render on the right
 * @param {number} props.count - Count to display in subtitle (optional)
 * @param {string} props.countLabel - Label for count (e.g., 'startup', 'schedule')
 */
export default function PageHeader({
  title,
  subtitle,
  gradientColors = 'from-purple-600 to-pink-600',
  actions,
  count,
  countLabel = 'startup'
}) {
  // Generate subtitle with count if provided
  const displaySubtitle = subtitle || (
    count !== undefined 
      ? `${count} ${countLabel}${count !== 1 ? 's' : ''} found`
      : null
  );

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8 pl-16 lg:pl-0">
      <div>
        <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r ${gradientColors} bg-clip-text text-transparent`}>
          {title}
        </h1>
        {displaySubtitle && (
          <p className="text-white mt-2 text-sm sm:text-base font-medium">
            {displaySubtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-col sm:flex-row gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}

/**
 * Predefined gradient color schemes for different sections
 */
export const PAGE_GRADIENTS = {
  allStartups: 'from-purple-600 to-pink-600',
  onboarded: 'from-green-600 to-emerald-600',
  graduated: 'from-purple-600 to-pink-600',
  rejected: 'from-red-600 to-rose-600',
  inactive: 'from-gray-600 to-slate-600',
  smcScheduling: 'from-blue-600 to-indigo-600',
  oneOnOne: 'from-indigo-600 to-purple-600'
};
