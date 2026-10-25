import { useEffect, useState } from 'preact/hooks';
import { AdminLayout } from '../../layouts/admin-layout';
import { Button, SolidInput, showToast } from '../../components/ui';
import { useDesignTheme } from '../../hooks/useDesignTheme';
import { HiOutlineBuildingOffice2, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineArrowPath } from 'react-icons/hi2';
import { roomService } from '../../services';

export function RoomsPage({ path }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';

  const loadRooms = async () => {
    setLoadError('');
    setLoading(true);
    try {
      const response = await roomService.getRooms();
      setRooms(Array.isArray(response.data) ? response.data : response.data?.data || []);
      return true;
    } catch (error) {
      const message = error?.data?.message || error?.data?.error || 'โหลดห้องเรียนไม่สำเร็จ';
      setLoadError(message);
      return false;
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
    const wasEditing = Boolean(editingId);
    const refreshed = await loadRooms();
    resetForm();
    showToast(
      refreshed
        ? (wasEditing ? 'แก้ไขห้องเรียนสำเร็จ' : 'เพิ่มห้องเรียนสำเร็จ')
        : 'บันทึกห้องเรียนแล้ว แต่โหลดรายการล่าสุดไม่สำเร็จ ลองโหลดใหม่อีกครั้ง',
      refreshed ? 'success' : 'warning'
    );
    setSubmitting(false);
  };

  const removeRoom = async (room) => {
    if (removingId !== null) return;
    if (!window.confirm(`ต้องการลบห้อง ${room.name} หรือไม่`)) return;
    setRemovingId(room.id);
    try {
      await roomService.deleteRoom(room.id);
      setRooms((currentRooms) => currentRooms.filter((currentRoom) => currentRoom.id !== room.id));
      const refreshed = await loadRooms();
      if (refreshed) showToast('ลบห้องเรียนสำเร็จ', 'success');
      else showToast('ลบห้องเรียนแล้ว แต่โหลดรายการล่าสุดไม่สำเร็จ ลองโหลดใหม่อีกครั้ง', 'warning');
    } catch (error) {
      showToast(error?.data?.message || error?.data?.error || 'ลบห้องเรียนไม่สำเร็จ', 'error');
    } finally {
      setRemovingId(null);
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
        <span class="text-sm text-zinc-500" aria-live="polite">
          {loading ? 'กำลังโหลดรายการห้อง...' : `ทั้งหมด ${rooms.length} ห้อง`}
        </span>
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
              id="room-name-th"
              label="ชื่อห้องเรียน (ไทย)"
              placeholder="เช่น ห้อง 101"
              value={name}
              required
              onInput={(event) => setName(event.target.value)}
            />
            <SolidInput
              id="room-name-en"
              label="ชื่อห้องเรียน (English)"
              placeholder="e.g. Room A"
              value={nameEn}
              onInput={(event) => setNameEn(event.target.value)}
            />
          </div>
          <div>
            <SolidInput
              id="room-description-th"
              label="รายละเอียด (ไทย)"
              placeholder="เช่น ห้องเรียนชั้น 1"
              value={description}
              onInput={(event) => setDescription(event.target.value)}
            />
          </div>
          <div>
            <SolidInput
              id="room-description-en"
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

      {loadError && (
        <div role="alert" class={`mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${isNeo ? 'border-2 border-black bg-red-100 text-red-950' : 'rounded-xl border border-red-200 bg-red-50 text-red-900'}`}>
          <p class="text-sm">{loadError}</p>
          <button
            type="button"
            onClick={loadRooms}
            disabled={loading}
            class="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 disabled:opacity-60"
          >
            <HiOutlineArrowPath class={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            {loading ? 'กำลังโหลด...' : 'ลองโหลดอีกครั้ง'}
          </button>
        </div>
      )}

      {loading && rooms.length === 0 ? (
        <p class="py-12 text-center text-sm text-zinc-500" role="status">กำลังโหลดข้อมูล...</p>
      ) : !loading && !loadError && !rooms.length ? (
        <div
          class={`${isNeo ? 'neo-card bg-white' : 'rounded-2xl border border-dashed border-zinc-300 bg-white'} px-5 py-14 text-center`}
        >
          <HiOutlineBuildingOffice2 class="mx-auto mb-3 h-10 w-10 text-zinc-300" />
          <p class="text-sm text-zinc-500">ยังไม่มีห้องเรียน</p>
        </div>
      ) : rooms.length > 0 ? (
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <article
              key={room.id}
              class={`${isNeo ? 'neo-card bg-white' : 'rounded-2xl border border-zinc-200 bg-white shadow-sm'} flex min-w-0 flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5`}
            >
              <div class="flex min-w-0 items-center gap-3">
                <div class={`flex h-11 w-11 shrink-0 items-center justify-center ${isNeo ? 'border-2 border-black bg-amber-100 text-zinc-900' : 'rounded-xl bg-oasis-primary/10 text-oasis-primary'}`}>
                  <HiOutlineBuildingOffice2 class="h-5 w-5" aria-hidden="true" />
                </div>
                <div class="min-w-0">
                  <h3 class="truncate font-semibold text-zinc-900">{room.name}</h3>
                  {room.nameEn && <p class="mt-0.5 truncate text-sm text-zinc-500">{room.nameEn}</p>}
                  {room.description && (
                    <p class="mt-1 truncate text-sm text-zinc-600">{room.description}</p>
                  )}
                  {room.descriptionEn && <p class="truncate text-xs text-zinc-500">{room.descriptionEn}</p>}
                  <span
                    class={`mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${room.isActive ? 'border border-emerald-300 bg-emerald-100 text-emerald-900' : 'border border-zinc-300 bg-zinc-100 text-zinc-700'}`}
                  >
                    {room.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                  </span>
                </div>
              </div>
              <div class="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex sm:shrink-0 sm:items-center">
                <button
                  type="button"
                  aria-label={`แก้ไขห้อง ${room.name}`}
                  onClick={() => openEdit(room)}
                  class={`inline-flex min-h-11 items-center justify-center gap-2 px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oasis-primary ${isNeo ? 'border-2 border-black bg-amber-100 text-zinc-900 hover:bg-amber-200' : 'rounded-xl text-oasis-primary hover:bg-oasis-primary/10'}`}
                >
                  <HiOutlinePencil class="h-5 w-5" aria-hidden="true" />
                  <span class="sm:hidden">แก้ไข</span>
                </button>
                <button
                  type="button"
                  aria-label={`ลบห้อง ${room.name}`}
                  onClick={() => removeRoom(room)}
                  disabled={removingId === room.id}
                  class={`inline-flex min-h-11 items-center justify-center gap-2 px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 disabled:cursor-wait disabled:opacity-50 ${isNeo ? 'border-2 border-black bg-red-100 text-red-900 hover:bg-red-200' : 'rounded-xl text-red-700 hover:bg-red-50'}`}
                >
                  {removingId === room.id
                    ? <HiOutlineArrowPath class="h-5 w-5 animate-spin" aria-hidden="true" />
                    : <HiOutlineTrash class="h-5 w-5" aria-hidden="true" />}
                  <span class="sm:hidden">{removingId === room.id ? 'กำลังลบ...' : 'ลบ'}</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </AdminLayout>
  );
}
