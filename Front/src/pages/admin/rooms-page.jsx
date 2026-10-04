import { useEffect, useState } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { Button, SolidInput, showToast } from '../../components/ui';
import { useDesignTheme } from '../../hooks/useDesignTheme';
import { HiOutlineBuildingOffice2, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi2';
import { roomService } from '../../services';

export function RoomsPage({ path }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';

  const loadRooms = async () => {
    try {
      const response = await roomService.getRooms();
      setRooms(Array.isArray(response.data) ? response.data : response.data?.data || []);
    } catch (error) {
      showToast(error?.data?.message || error?.data?.error || 'โหลดห้องเรียนไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const resetForm = () => {
    setName('');
    setNameEn('');
    setDescription('');
    setDescriptionEn('');
    setIsActive(true);
    setEditingId(null);
  };

  const openEdit = (room) => {
    setEditingId(room.id);
    setName(room.name || '');
    setNameEn(room.nameEn || '');
    setDescription(room.description || '');
    setDescriptionEn(room.descriptionEn || '');
    setIsActive(room.isActive !== false);
  };

  const saveRoom = async (event) => {
    event.preventDefault();
    if (submitting) return;
    const roomName = name.trim();
    if (!roomName) return showToast('กรุณาระบุชื่อห้องเรียน', 'error');
    setSubmitting(true);
    try {
      const payload = {
        name: roomName,
        nameEn: nameEn.trim(),
        description: description.trim() || null,
        descriptionEn: descriptionEn.trim(),
        isActive,
      };
      if (editingId) {
        await roomService.updateRoom(editingId, payload);
      } else {
        await roomService.createRoom(payload);
      }
    } catch (error) {
      const message =
        error?.data?.message ||
        error?.data?.error ||
        error?.message ||
        (error?.status
          ? `${editingId ? 'แก้ไข' : 'เพิ่ม'}ห้องเรียนไม่สำเร็จ (HTTP ${error.status})`
          : `${editingId ? 'แก้ไข' : 'เพิ่ม'}ห้องเรียนไม่สำเร็จ`);
      setSubmitting(false);
      return showToast(message, 'error');
    }
    try {
      await loadRooms();
      const wasEditing = Boolean(editingId);
      resetForm();
      showToast(wasEditing ? 'แก้ไขห้องเรียนสำเร็จ' : 'เพิ่มห้องเรียนสำเร็จ', 'success');
    } finally {
      setSubmitting(false);
    }
  };

  const removeRoom = async (room) => {
    if (!window.confirm(`ต้องการลบห้อง ${room.name} หรือไม่`)) return;
    try {
      await roomService.deleteRoom(room.id);
      await loadRooms();
    } catch (error) {
      showToast(error?.data?.message || error?.data?.error || 'ลบห้องเรียนไม่สำเร็จ', 'error');
    }
  };

  return (
    <AdminLayout path={path}>
      <div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-oasis-primary">Master Data</p>
          <h1 class="mt-1 text-2xl font-semibold text-zinc-900">จัดการห้องเรียน</h1>
          <p class="mt-1 text-sm text-zinc-500">เพิ่มรายชื่อห้องเรียนของสถาบันสำหรับเลือกใช้ในตารางสอน</p>
        </div>
        <span class="text-sm text-zinc-500">ทั้งหมด {rooms.length} ห้อง</span>
      </div>

      <section
        class={`${isNeo ? 'neo-card bg-white p-5' : 'rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm'} mb-6`}
      >
        <div class="mb-4 flex items-center justify-between gap-3">
          <h2 class="text-base font-semibold text-zinc-900">{editingId ? 'แก้ไขห้องเรียน' : 'เพิ่มห้องเรียนใหม่'}</h2>
          {editingId && (
            <button type="button" onClick={resetForm} class="text-sm font-medium text-zinc-500 hover:text-zinc-800">
              ยกเลิกการแก้ไข
            </button>
          )}
        </div>
        <form class="grid gap-4 md:grid-cols-2" onSubmit={saveRoom}>
          <div>
            <SolidInput
              label="ชื่อห้องเรียน (ไทย)"
              placeholder="เช่น ห้อง 101"
              value={name}
              onInput={(event) => setName(event.target.value)}
            />
            <SolidInput
              label="ชื่อห้องเรียน (English)"
              placeholder="e.g. Room A"
              value={nameEn}
              onInput={(event) => setNameEn(event.target.value)}
            />
          </div>
          <div>
            <SolidInput
              label="รายละเอียด (ไทย)"
              placeholder="เช่น ห้องเรียนชั้น 1"
              value={description}
              onInput={(event) => setDescription(event.target.value)}
            />
          </div>
          <div>
            <SolidInput
              label="รายละเอียด (English)"
              placeholder="e.g. First-floor classroom"
              value={descriptionEn}
              onInput={(event) => setDescriptionEn(event.target.value)}
            />
          </div>
          <label class="flex items-center gap-3 text-sm font-medium text-zinc-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.currentTarget.checked)}
              class="h-4 w-4 accent-oasis-primary"
            />
            เปิดใช้งานห้องเรียน
          </label>
          <div class="md:text-right">
            <Button type="submit" loading={submitting} disabled={submitting}>
              <span class="flex items-center gap-2">
                {editingId ? <HiOutlinePencil class="h-4 w-4" /> : <HiOutlinePlus class="h-4 w-4" />}
                {editingId ? 'บันทึกการแก้ไข' : 'เพิ่มห้องเรียน'}
              </span>
            </Button>
          </div>
        </form>
      </section>

      {loading ? (
        <p class="py-12 text-center text-sm text-zinc-500">กำลังโหลดข้อมูล...</p>
      ) : !rooms.length ? (
        <div
          class={`${isNeo ? 'neo-card bg-white' : 'rounded-2xl border border-dashed border-zinc-300 bg-white'} px-5 py-14 text-center`}
        >
          <HiOutlineBuildingOffice2 class="mx-auto mb-3 h-10 w-10 text-zinc-300" />
          <p class="text-sm text-zinc-500">ยังไม่มีห้องเรียน</p>
        </div>
      ) : (
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <article
              key={room.id}
              class={`${isNeo ? 'neo-card bg-cyan-100' : 'rounded-2xl border border-zinc-200 bg-white shadow-sm'} flex items-center justify-between gap-3 p-5`}
            >
              <div class="flex min-w-0 items-center gap-3">
                <HiOutlineBuildingOffice2 class="h-6 w-6 shrink-0 text-oasis-primary" />
                <div class="min-w-0">
                  <span class="block truncate font-semibold text-zinc-900">{room.name}</span>
                  {room.description && (
                    <span class="mt-1 block truncate text-xs text-zinc-500">{room.description}</span>
                  )}
                  <span
                    class={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${room.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}
                  >
                    {room.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                  </span>
                </div>
              </div>
              <div class="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  aria-label={`แก้ไขห้อง ${room.name}`}
                  onClick={() => openEdit(room)}
                  class="rounded-lg p-2 text-zinc-400 hover:bg-oasis-primary/5 hover:text-oasis-primary"
                >
                  <HiOutlinePencil class="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label={`ลบห้อง ${room.name}`}
                  onClick={() => removeRoom(room)}
                  class="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                >
                  <HiOutlineTrash class="h-5 w-5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
