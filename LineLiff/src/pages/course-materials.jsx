import { useEffect, useState } from 'preact/hooks';
import { useLiffContext } from '../store/LiffContext';
import { downloadChildCourseMaterial, getChildCourseMaterials } from '../services/parent-service';
import { LiffLayout } from '../components/liff-layout';
import { FoxSticker } from '../components/fox-sticker';

const unwrap = response => response?.data?.data || [];

export const CourseMaterialsPage = ({ childId }) => {
  const { state } = useLiffContext();
  const selectedChildId = Number(childId || state.activeChildId);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getChildCourseMaterials(selectedChildId)
      .then(response => active && setMaterials(unwrap(response)))
      .catch(apiError => active && setError(apiError.message || 'โหลดเอกสารไม่สำเร็จ'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [selectedChildId]);

  const download = async material => {
    setDownloadingId(material.id);
    setError('');
    try {
      const response = await downloadChildCourseMaterial(material.id);
      const anchor = document.createElement('a');
      anchor.href = response.data.url;
      anchor.download = material.fileName;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.click();
    } catch (apiError) {
      setError(apiError.message || 'ดาวน์โหลดเอกสารไม่สำเร็จ');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <LiffLayout showBack>
      <div class="space-y-4">
        <header>
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-sage-600">Course resources</p>
          <h1 class="mt-1 text-2xl font-bold text-ink-900">เอกสารประกอบการเรียน</h1>
          <p class="mt-1 text-sm text-ink-500">เอกสารของคอร์สที่น้องลงทะเบียนไว้</p>
        </header>
        {error && <div role="alert" class="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
        {loading && <div class="space-y-3" aria-label="กำลังโหลด"><div class="h-20 animate-pulse rounded-2xl bg-sage-100" /><div class="h-20 animate-pulse rounded-2xl bg-sage-100" /></div>}
        {!loading && materials.length === 0 && <div class="flex justify-center rounded-2xl border border-dashed border-sage-200 bg-white px-4 py-6 text-center"><FoxSticker action="reading" message="ยังไม่มีเอกสารสำหรับคอร์สที่ลงทะเบียน" /></div>}
        {!loading && materials.map(material => (
          <article key={material.id} class="flex items-center gap-3 rounded-2xl border border-sage-100 bg-white p-4 shadow-soft">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sage-50 text-lg text-sage-700" aria-hidden="true">▤</span>
            <div class="min-w-0 flex-1">
              <p class="truncate font-bold text-ink-900">{material.fileName}</p>
              <p class="mt-1 truncate text-xs text-ink-500">{material.courseName} · {(material.sizeBytes / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button type="button" onClick={() => download(material)} disabled={downloadingId === material.id} class="min-h-10 rounded-xl bg-sage-600 px-3 text-sm font-bold text-white hover:bg-sage-700 disabled:opacity-60">
              {downloadingId === material.id ? 'กำลังโหลด…' : 'ดาวน์โหลด'}
            </button>
          </article>
        ))}
      </div>
    </LiffLayout>
  );
};