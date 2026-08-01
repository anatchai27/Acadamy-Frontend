import { route } from 'preact-router';
import { useEffect, useState } from 'preact/hooks';
import { useLiffContext } from '../store/LiffContext';
import { getParentDashboard } from '../services/parent-service';
import { ChildSwitcher } from '../components/child-switcher';
import { LiffLayout } from '../components/liff-layout';

export function DashboardPage() {
  const { state, dispatch } = useLiffContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.parentToken) {
      route('/liff/login', true);
      return;
    }
    getParentDashboard()
      .then(res => {
        const d = res.data?.data || res.data;
        setData(d);
        if (d?.children) {
          dispatch({ type: 'SET_CHILDREN', payload: d.children });
          if (!state.activeChildId && d.children.length > 0) {
            dispatch({ type: 'SET_ACTIVE_CHILD', payload: d.children[0].id });
          }
        }
      })
      .catch(() => route('/liff/login', true))
      .finally(() => setLoading(false));
  }, [state.parentToken]);

  const activeChild = state.children.find(c => c.id === state.activeChildId);

  if (loading) {
    return (
      <LiffLayout>
        <div class="flex justify-center py-20">
          <div class="h-8 w-8 rounded-full border-3 border-blue-500/30 border-t-blue-500 animate-spin" />
        </div>
      </LiffLayout>
    );
  }

  return (
    <LiffLayout>
      <div class="space-y-6">
        <div class="text-center">
          <h1 class="text-xl font-bold">สวัสดี</h1>
          <p class="text-gray-500 text-sm">{state.liffProfile?.displayName}</p>
        </div>

        <ChildSwitcher />

        {activeChild && (
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div class="flex items-center gap-4 mb-4">
              <div class="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                {(activeChild.fullName || '?').charAt(0)}
              </div>
              <div>
                <p class="text-lg font-semibold">{activeChild.fullName}</p>
                <p class="text-sm text-gray-500">{activeChild.grade || 'ไม่ได้ระบุชั้น'}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <StatCard label="เช็คชื่อวันนี้" value={data?.todayAttendance || '-'} color="blue" />
              <StatCard label="การบ้านคงค้าง" value={data?.pendingHomework ?? '-'} color="orange" />
              <StatCard label="ยอดค้างชำระ" value={data?.outstandingBalance ? `฿${data.outstandingBalance.toLocaleString()}` : '-'} color="red" />
              <StatCard label="ทักษะล่าสุด" value={data?.latestSkillScore || '-'} color="green" />
            </div>
          </div>
        )}

        <div class="grid grid-cols-2 gap-3">
          <QuickAction
            icon="✅"
            label="เช็คชื่อ"
            onClick={() => activeChild && route(`/liff/attendance/${activeChild.id}`)}
          />
          <QuickAction
            icon="💰"
            label="การเงิน"
            onClick={() => activeChild && route(`/liff/payments/${activeChild.id}`)}
          />
          <QuickAction
            icon="📝"
            label="ลา"
            onClick={() => {}}
          />
          <QuickAction
            icon="👤"
            label="โปรไฟล์"
            onClick={() => route('/liff/profile')}
          />
        </div>
      </div>
    </LiffLayout>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    orange: 'bg-orange-50 text-orange-700',
    red: 'bg-red-50 text-red-700',
    green: 'bg-green-50 text-green-700',
  };
  return (
    <div class={`rounded-xl p-4 ${colors[color] || colors.blue}`}>
      <p class="text-xs font-medium opacity-80">{label}</p>
      <p class="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}

function QuickAction({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col items-center gap-2 active:scale-95 transition-transform"
    >
      <span class="text-2xl">{icon}</span>
      <span class="text-sm font-medium">{label}</span>
    </button>
  );
}