import { useLiffContext } from '../store/LiffContext';

export function ChildSwitcher() {
  const { state, dispatch } = useLiffContext();

  if (state.children.length <= 1) return null;

  return (
    <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
      {state.children.map(child => {
        const active = child.id === state.activeChildId;
        return (
          <button
            key={child.id}
            onClick={() => dispatch({ type: 'SET_ACTIVE_CHILD', payload: child.id })}
            class={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              active
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {child.fullName || child.name}
          </button>
        );
      })}
    </div>
  );
}