const DEFAULT_TABS = ['Overview', 'Goals', 'Habits', 'Dump'];

interface SundownTabDockProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs?: string[];
}

export function SundownTabDock({
  activeTab,
  onTabChange,
  tabs = DEFAULT_TABS,
}: SundownTabDockProps) {
  return (
    <div className="sd-tab-wrap">
      <div className="sd-tab-dock">
        <div className="sd-tab-face">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`sd-tab${tab === activeTab ? ' active' : ''}`}
              onClick={() => onTabChange(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
