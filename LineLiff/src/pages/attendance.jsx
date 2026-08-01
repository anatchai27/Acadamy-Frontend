import { route } from 'preact-router';
import { useEffect, useState } from 'preact/hooks';
import { useLiffContext } from '../store/LiffContext';
import { getChildAttendance } from '../services/parent-service';
import { LiffLayout } from '../components/liff-layout';

export function AttendancePage({ childId }) {
  const { state } = useLiffContext();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.parentToken) { route('/liff/login', true); return; }
    getChildAttendance(childId || state.activeChildId)
      .then(res => setRecords(res.data?.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [state.parentToken, childId]);

  const activeChild = state.children.find(c => c.id === (childId || state.activeChildId));

  return (
    <LiffLayout showBack>
      <div class="space-y-4">
        <div>
          <h1 class="text-xl font-bold">ประวัติการเข้าเรียน</h1>
          {activeChild && <p class="text-sm text-gray-500">{activeChild.fullName}</p>}
        </div>

        {loading ? (
          <div class="flex justify-center py-10">
            <div class="h-8 w-8 rounded-full border-3 border-blue-500/30 border-t-blue-500 animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div class="text-center py-10 text-gray-400">
            <p class="text-4xl mb-2">📅</p>
            <p>ไม่มีประวัติการเข้าเรียน</p>
          </div>
        ) : (
          <div class="space-y-2">
            {records.map((r, i) => (
              <div key={i} class="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between shadow-sm">
                <div>
                  <p class="font-medium text-sm">{r.courseName || r.course}</p>
                  <p class="text-xs text-gray-400">{r.date} {r.time}</p>
                </div>
                <span class={`px-3 py-1 rounded-full text-xs font-semibold ${
                  r.status === 'present' ? 'bg-green-100 text-green-700' :
                  r.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {r.status === 'present' ? 'มาเรียน' : r.status === 'late' ? 'สาย' : 'ขาด'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </LiffLayout>
  );
}