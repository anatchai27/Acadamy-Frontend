import { useLiffContext } from '../store/LiffContext';

export const ChildSwitcher = () => {
  const { state, dispatch } = useLiffContext();

  return state.children.length <= 1 ? null : (
    <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
      {state.children.map(child => {
        const active = child.id === state.activeChildId;
        return (
          <button
            key={child.id}
            onClick={() => dispatch({ type: 'SET_ACTIVE_CHILD', payload: child.id })}
            class={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              active
                ? 'bg-sage-600 text-white shadow-soft'
                : 'border border-white/80 bg-white/75 text-ink-700 shadow-sm'
            }`}
          >
            {child.fullName || child.name}
          </button>
        );
      })}
    </div>
  );
};
