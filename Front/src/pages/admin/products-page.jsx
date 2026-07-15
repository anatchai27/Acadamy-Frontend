import { useState, useEffect } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { showToast, showConfirm } from '../../components/ui';
import { useAbortController } from '../../hooks';
import { api } from '../../services/api';

export function ProductsPage({ path }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', description: '' });
  const getSignal = useAbortController();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products', { signal: getSignal() });
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch {
      showToast('ไม่สามารถโหลดสินค้าได้', 'error');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', price: '', description: '' });
    setShowForm(true);
  };

  const openEdit = (product) => {
    setEditingId(product.id);
    setForm({ name: product.name, price: String(product.price), description: product.description || '' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) {
      showToast('กรุณากรอกชื่อและราคาสินค้า', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { name: form.name.trim(), price: Number(form.price), description: form.description.trim() || undefined };
      if (editingId) {
        await api.put(`/products/${editingId}`, { ...payload, isActive: true });
        showToast('แก้ไขสินค้าสำเร็จ', 'success');
      } else {
        await api.post('/products', payload);
        showToast('เพิ่มสินค้าสำเร็จ', 'success');
      }
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      showToast(err?.data?.message || 'บันทึกไม่สำเร็จ', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product) => {
    const confirmed = await showConfirm({
      title: 'ลบสินค้า',
      message: `แน่ใจว่าต้องการลบ "${product.name}"?`,
      yesLabel: 'ลบ',
      cancelLabel: 'ยกเลิก',
    });
    if (!confirmed) return;
    try {
      await api.delete(`/products/${product.id}`);
      showToast('ลบสินค้าสำเร็จ', 'success');
      fetchProducts();
    } catch {
      showToast('ลบไม่สำเร็จ', 'error');
    }
  };

  return (
    <AdminLayout path={path}>
      <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-tiwhub-heading dark:text-white">สินค้าและบริการ</h2>
          <p class="text-sm text-tiwhub-muted dark:text-tiwhub-muted/70 mt-1">จัดการสินค้าเสริมสำหรับออกใบเสร็จ</p>
        </div>
        <button onClick={openCreate} class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.98] shrink-0">
          <PlusIcon class="h-4 w-4" />
          เพิ่มสินค้า
        </button>
      </div>

      {showForm && (
        <div class="bg-white dark:bg-tiwhub-heading/80 rounded-2xl shadow-sm border border-tiwhub-border-light dark:border-tiwhub-border/20 p-6 mb-6 max-w-lg">
          <h3 class="text-base font-semibold text-tiwhub-heading dark:text-white mb-4">
            {editingId ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
          </h3>
          <form onSubmit={handleSubmit} class="space-y-4">
            <div>
              <label class="text-sm font-medium text-tiwhub-heading dark:text-white block mb-1">ชื่อสินค้า *</label>
              <input type="text" value={form.name} onInput={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="เช่น เสื้อสถาบัน" class="w-full px-4 py-2.5 text-sm border border-tiwhub-border-light dark:border-tiwhub-border/20 rounded-xl bg-white dark:bg-tiwhub-heading/50 text-tiwhub-heading dark:text-white placeholder-tiwhub-muted focus:outline-none focus:ring-2 focus:ring-blue-500/25" />
            </div>
            <div>
              <label class="text-sm font-medium text-tiwhub-heading dark:text-white block mb-1">ราคา *</label>
              <input type="number" step="0.01" min="0" value={form.price} onInput={(e) => setForm((p) => ({ ...p, price: e.target.value }))} placeholder="0.00" class="w-full px-4 py-2.5 text-sm border border-tiwhub-border-light dark:border-tiwhub-border/20 rounded-xl bg-white dark:bg-tiwhub-heading/50 text-tiwhub-heading dark:text-white placeholder-tiwhub-muted focus:outline-none focus:ring-2 focus:ring-blue-500/25" />
            </div>
            <div>
              <label class="text-sm font-medium text-tiwhub-heading dark:text-white block mb-1">รายละเอียด (optional)</label>
              <textarea value={form.description} onInput={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} class="w-full px-4 py-2.5 text-sm border border-tiwhub-border-light dark:border-tiwhub-border/20 rounded-xl bg-white dark:bg-tiwhub-heading/50 text-tiwhub-heading dark:text-white placeholder-tiwhub-muted focus:outline-none focus:ring-2 focus:ring-blue-500/25 resize-none" />
            </div>
            <div class="flex gap-3 pt-2">
              <button type="submit" disabled={submitting} class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50 transition-all">
                {submitting ? 'กำลังบันทึก...' : editingId ? 'บันทึก' : 'เพิ่ม'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} class="px-4 py-2 text-sm font-medium text-tiwhub-body dark:text-tiwhub-muted hover:text-tiwhub-heading rounded-xl hover:bg-tiwhub-surface-hover dark:hover:bg-tiwhub-heading/40 transition-colors">
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}

      <div class="bg-white dark:bg-tiwhub-heading/80 rounded-2xl shadow-sm border border-tiwhub-border-light dark:border-tiwhub-border/20 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-tiwhub-border-light dark:border-tiwhub-border/20 bg-tiwhub-bg/50 dark:bg-tiwhub-heading/30">
                <th class="text-left px-6 py-3 text-xs font-semibold text-tiwhub-muted dark:text-tiwhub-muted/60 uppercase tracking-wider">ชื่อสินค้า</th>
                <th class="text-left px-6 py-3 text-xs font-semibold text-tiwhub-muted dark:text-tiwhub-muted/60 uppercase tracking-wider">ราคา</th>
                <th class="text-left px-6 py-3 text-xs font-semibold text-tiwhub-muted dark:text-tiwhub-muted/60 uppercase tracking-wider hidden sm:table-cell">รายละเอียด</th>
                <th class="text-right px-6 py-3 text-xs font-semibold text-tiwhub-muted dark:text-tiwhub-muted/60 uppercase tracking-wider"><span class="sr-only">จัดการ</span></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-tiwhub-border-light dark:divide-tiwhub-border/20">
              {loading ? (
                <tr><td colspan="4" class="px-6 py-12 text-center text-sm text-tiwhub-muted"><div class="mx-auto mb-2 h-6 w-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin inline-block" /> กำลังโหลด...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colspan="4" class="px-6 py-12 text-center text-sm text-tiwhub-muted">ยังไม่มีสินค้า</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} class="hover:bg-blue-50/40 dark:hover:bg-blue-500/5 transition-colors">
                    <td class="px-6 py-4 text-sm font-semibold text-tiwhub-heading dark:text-white">{p.name}</td>
                    <td class="px-6 py-4 text-sm text-tiwhub-body dark:text-tiwhub-bg/80">฿{Number(p.price).toLocaleString()}</td>
                    <td class="px-6 py-4 text-sm text-tiwhub-muted dark:text-tiwhub-muted/60 hidden sm:table-cell">{p.description || '-'}</td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)} class="p-1.5 text-tiwhub-muted hover:text-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"><EditIcon class="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(p)} class="p-1.5 text-tiwhub-muted hover:text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"><TrashIcon class="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

function PlusIcon({ class: className }) { return (<svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>); }
function EditIcon({ class: className }) { return (<svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>); }
function TrashIcon({ class: className }) { return (<svg class={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>); }
