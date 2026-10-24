import { useLiffContext } from '../store/LiffContext';

export const ChildSwitcher = () => {
  const { state, dispatch } = useLiffContext();

  return state.children.length <= 1 ? null : (
    <div class="flex gap-2 overflow-x-auto pb-1 no-scrollbar" aria-label="เลือกรายชื่อลูก">
      {state.children.map(child => {
        const active = child.id === state.activeChildId;
        return (
          <button
            key={child.id}
            onClick={() => dispatch({ type: 'SET_ACTIVE_CHILD', payload: child.id })}
            aria-pressed={active}
            class={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 ${
              active
                ? 'bg-sage-700 text-white'
                : 'border border-sage-200 bg-white text-ink-700 hover:bg-sage-50'
            }`}
          >
            {child.fullName || child.name}
          </button>
        );
      })}
    </div>
  );
};
