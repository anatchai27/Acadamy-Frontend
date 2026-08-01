import { route } from 'preact-router';
import { useEffect, useState } from 'preact/hooks';
import { useLiffContext } from '../store/LiffContext';
import { getChildPayments } from '../services/parent-service';
import { LiffLayout } from '../components/liff-layout';

export function PaymentsPage({ childId }) {
  const { state } = useLiffContext();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.parentToken) { route('/liff/login', true); return; }
    getChildPayments(childId || state.activeChildId)
      .then(res => setPayments(res.data?.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [state.parentToken, childId]);

  const activeChild = state.children.find(c => c.id === (childId || state.activeChildId));

  return (
    <LiffLayout showBack>
      <div class="space-y-4">
        <div>
          <h1 class="text-xl font-bold">ประวัติการเงิน</h1>
          {activeChild && <p class="text-sm text-gray-500">{activeChild.fullName}</p>}
        </div>

        {loading ? (
          <div class="flex justify-center py-10">
            <div class="h-8 w-8 rounded-full border-3 border-blue-500/30 border-t-blue-500 animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div class="text-center py-10 text-gray-400">
            <p class="text-4xl mb-2">💰</p>
            <p>ไม่มีรายการเงิน</p>
          </div>
        ) : (
          <div class="space-y-2">
            {payments.map((p, i) => (
              <div key={i} class="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between shadow-sm">
                <div>
                  <p class="font-medium text-sm">{p.description || p.invoiceNo}</p>
                  <p class="text-xs text-gray-400">{p.date}</p>
                </div>
                <div class="text-right">
                  <p class={`font-semibold ${p.amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {p.amount > 0 ? `-฿${p.amount.toLocaleString()}` : `+฿${Math.abs(p.amount).toLocaleString()}`}
                  </p>
                  <span class={`text-xs px-2 py-0.5 rounded-full ${
                    p.status === 'paid' ? 'bg-green-100 text-green-700' :
                    p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {p.status === 'paid' ? 'ชำระแล้ว' : p.status === 'pending' ? 'รอชำระ' : p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </LiffLayout>
  );
}