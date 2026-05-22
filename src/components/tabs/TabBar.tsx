import { useTabStore } from "@/stores/tabStore";
import { useTerminalStore } from "@/stores/terminalStore";
import { Tab } from "./Tab";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, removeTab, addTab, reorderTabs } = useTabStore();
  const { addSession } = useTerminalStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleNewTerminal = () => {
    const id = crypto.randomUUID();
    addTab({
      id,
      type: "terminal",
      title: "Terminal",
      sessionId: id,
      pinned: false,
      createdAt: Date.now(),
    });
    addSession({
      id,
      title: "Terminal",
      shell: "powershell.exe",
      cwd: "",
      cols: 80,
      rows: 24,
      processId: null,
      createdAt: Date.now(),
    });
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent("focus-terminal"));
    }, 100);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIdx = tabs.findIndex((t) => t.id === active.id);
    const toIdx = tabs.findIndex((t) => t.id === over.id);
    if (fromIdx === -1 || toIdx === -1) return;
    reorderTabs(fromIdx, toIdx);
  };

  return (
    <div className="h-9 bg-bg-alt flex items-stretch border-b border-surface0 overflow-x-auto overflow-y-hidden flex-shrink-0">
      {tabs.length === 0 ? (
        <div className="flex-1 min-w-0" />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tabs.map((t) => t.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex items-stretch flex-1 min-w-0">
              {tabs.map((tab) => (
                <Tab
                  key={tab.id}
                  tab={tab}
                  isActive={tab.id === activeTabId}
                  onSelect={() => {
                    setActiveTab(tab.id);
                    if (tab.type === "terminal" || tab.type === "split") {
                      setTimeout(() => {
                        document.dispatchEvent(new CustomEvent("focus-terminal"));
                      }, 50);
                    }
                  }}
                  onClose={() => removeTab(tab.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <button
        className="px-3 flex items-center justify-center hover-bg text-fg-subtle hover:text-fg flex-shrink-0"
        onClick={handleNewTerminal}
        title="New Terminal (Ctrl+Shift+`)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}
