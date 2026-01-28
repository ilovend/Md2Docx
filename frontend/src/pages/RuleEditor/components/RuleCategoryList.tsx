import { ChevronDown, ChevronRight } from 'lucide-react';

interface Rule {
  id: string;
  name: string;
  active: boolean;
}

interface RuleCategory {
  id: string;
  name: string;
  icon: string;
  expanded: boolean;
  rules: Rule[];
}

interface RuleCategoryListProps {
  categories: RuleCategory[];
  selectedRule: string | null;
  onToggleCategory: (categoryId: string) => void;
  onSelectRule: (ruleId: string) => void;
  onToggleRule: (ruleId: string) => void;
}

export default function RuleCategoryList({
  categories,
  selectedRule,
  onToggleCategory,
  onSelectRule,
  onToggleRule,
}: RuleCategoryListProps) {
  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <div key={category.id} className="mb-2">
          <button
            onClick={() => onToggleCategory(category.id)}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-400 transition-colors hover:text-white"
          >
            {category.expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </button>

          {category.expanded && (
            <div className="ml-2 space-y-1">
              {category.rules.map((rule) => (
                <div
                  key={rule.id}
                  onClick={() => onSelectRule(rule.id)}
                  className={`flex cursor-pointer items-center gap-2 rounded px-3 py-2 transition-colors ${
                    selectedRule === rule.id
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-gray-300 hover:bg-[#1a1d2e]'
                  }`}
                >
                  <div className="flex flex-1 items-center gap-2">
                    <span className="text-xs">{rule.name}</span>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rule.active}
                      onChange={(e) => {
                        e.stopPropagation();
                        onToggleRule(rule.id);
                      }}
                      className="peer sr-only"
                    />
                    <div className="h-4 w-8 rounded-full bg-gray-600 transition-colors peer-checked:bg-blue-500"></div>
                    <div className="absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-transform peer-checked:translate-x-4"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
