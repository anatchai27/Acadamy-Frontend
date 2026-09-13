import { useEffect, useState } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { Button, SolidInput, showToast } from '../../components/ui';
import { getLeads, updateLeadFollowUp } from '../../services/lead-service';

const statuses = [['new', 'ใหม่'], ['contacted', 'ติดต่อแล้ว'], ['qualified', 'สนใจจริง'], ['converted', 'เปลี่ยนเป็นลูกค้า'], ['lost', 'ปิด lead']];

export function LeadsPage({ path }) {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const response = await getLeads({ search: search.trim() || undefined, status: status || undefined });
      const payload = response.data?.data || response.data || {};
      setLeads(payload.leads || []);
    } catch (error) {
      showToast(error?.data?.message || 'โหลด lead ไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLeads(); }, [status]);

  const saveFollowUp = async (lead, nextStatus, notes) => {
    setSavingId(lead.id);
    try {
      await updateLeadFollowUp(lead.id, { status: nextStatus, notes, assignedTo: lead.assignedTo || null });
      setLeads(current => current.map(item => item.id === lead.id ? { ...item, status: nextStatus, notes } : item));
      showToast('อัปเดต lead แล้ว', 'success');
    } catch (error) {
      showToast(error?.data?.message || 'อัปเดต lead ไม่สำเร็จ', 'error');
    } finally {
      setSavingId(null);
    }
  };

  return <AdminLayout path={path}><div class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
    <div class="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 class="text-2xl font-bold text-zinc-900">Trial Leads</h1><p class="mt-1 text-sm text-zinc-500">ติดตามผู้สนใจจากหน้า trial class</p></div><div class="flex flex-wrap items-end gap-2"><SolidInput label="ค้นหา" placeholder="ชื่อ, เบอร์ หรือชื่อนักเรียน" value={search} onInput={event => setSearch(event.target.value)} /><label class="flex flex-col gap-1 text-sm font-medium text-zinc-700">สถานะ<select value={status} onChange={event => setStatus(event.target.value)} class="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm"><option value="">ทั้งหมด</option>{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><Button variant="outline" size="sm" onClick={loadLeads} loading={loading}>ค้นหา</Button></div></div>
    {loading && <p class="py-12 text-center text-sm text-zinc-500">กำลังโหลด...</p>}
    {!loading && leads.length === 0 && <div class="rounded-2xl border border-dashed border-zinc-300 px-6 py-16 text-center text-sm text-zinc-500">ยังไม่มี lead ตามเงื่อนไขนี้</div>}
    <div class="space-y-3">{leads.map(lead => <LeadCard key={lead.id} lead={lead} saving={savingId === lead.id} onSave={saveFollowUp} />)}</div>
  </div></AdminLayout>;
}

function LeadCard({ lead, saving, onSave }) {
  const [nextStatus, setNextStatus] = useState(lead.status);
  const [notes, setNotes] = useState(lead.notes || '');
  return <article class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"><div class="flex flex-wrap items-start justify-between gap-4"><div><h2 class="font-semibold text-zinc-900">{lead.fullName}</h2><p class="mt-1 text-sm text-zinc-500">{lead.phone}{lead.email ? ` · ${lead.email}` : ''}</p>{lead.studentName && <p class="mt-1 text-xs text-zinc-500">นักเรียน: {lead.studentName}</p>}</div><span class="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{statuses.find(([value]) => value === lead.status)?.[1] || lead.status}</span></div><div class="mt-4 grid gap-3 md:grid-cols-[180px_1fr_auto]"><select value={nextStatus} onChange={event => setNextStatus(event.target.value)} class="rounded-xl border border-zinc-200 px-3 py-2 text-sm">{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><textarea value={notes} onInput={event => setNotes(event.target.value)} placeholder="บันทึกการติดตาม" rows="2" class="rounded-xl border border-zinc-200 px-3 py-2 text-sm" /><Button variant="primary" size="sm" loading={saving} disabled={saving} onClick={() => onSave(lead, nextStatus, notes)}>บันทึก follow-up</Button></div></article>;
}
