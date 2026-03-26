export default function TopBar({ sidebarOpen, setSidebarOpen, title, subtitle }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm flex-shrink-0">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left: Hamburger + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen && setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Open sidebar"
          >
            <i className="fas fa-bars"></i>
          </button>
          <div>
            <h1 className="font-semibold text-gray-800 dark:text-gray-100 leading-tight text-base">{title}</h1>
            {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* Right: Date + Bell + Admin */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden md:flex items-center text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-600">
            <i className="fas fa-calendar-alt mr-1.5 text-gray-400 dark:text-gray-500"></i>
            {today}
          </span>

          <button className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Notifications">
            <i className="fas fa-bell text-base"></i>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800"></span>
          </button>

          <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200 dark:border-gray-600">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0">
              A
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">Admin</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">System Admin</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
