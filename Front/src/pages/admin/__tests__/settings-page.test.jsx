import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { SettingsPage } from '../settings-page';
import { instituteService } from '../../../services/institute-service';
import { showToast } from '../../../components/ui';

vi.mock('../../../layouts/admin-layout', () => ({ AdminLayout: ({ children }) => <main>{children}</main> }));
vi.mock('../../../hooks/useDesignTheme', () => ({ useDesignTheme: () => ({ designTheme: 'bento' }) }));
vi.mock('../../../hooks', () => ({ useAbortController: () => () => ({ aborted: false }) }));
vi.mock('../../../store/AppContext', () => ({
  useAppContext: () => ({ state: {}, dispatch: vi.fn() }),
}));
vi.mock('../../../services/institute-service', () => ({
  instituteService: {
    getInstitute: vi.fn(),
    updateInstitute: vi.fn(),
    uploadLogo: vi.fn(),
    uploadPaymentQr: vi.fn(),
  },
}));
vi.mock('../../../components/ui', () => ({ showToast: vi.fn() }));
vi.mock('react-icons/hi2', () => ({
  HiOutlineBuildingOffice2: () => <span aria-hidden="true" />,
  HiOutlineExclamationTriangle: () => <span aria-hidden="true" />,
  HiOutlineTrash: () => <span aria-hidden="true" />,
  HiOutlineDocumentArrowDown: () => <span aria-hidden="true" />,
  HiOutlineCheck: () => <span aria-hidden="true" />,
  HiOutlineQuestionMarkCircle: () => <span aria-hidden="true" />,
  HiOutlineChevronDown: () => <span aria-hidden="true" />,
  HiOutlineSparkles: () => <span aria-hidden="true" />,
  HiOutlineCalendarDays: () => <span aria-hidden="true" />,
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve([]) }));
});

describe('SettingsPage', () => {
  it('blocks settings forms after a load failure and allows retry', async () => {
    instituteService.getInstitute.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({
      data: { data: { name: 'สถาบันตัวอย่าง' } },
    });
    render(<SettingsPage path="/admin/settings" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('ข้อมูลเดิมยังไม่ถูกเปลี่ยน');
    expect(screen.queryByRole('button', { name: 'บันทึกข้อมูลสถาบัน' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'ลองโหลดอีกครั้ง' }));

    expect(await screen.findByLabelText('ชื่อสถาบัน')).toHaveValue('สถาบันตัวอย่าง');
  });

  it('supports tab keyboard navigation and keeps the selected tab in the URL', async () => {
    instituteService.getInstitute.mockResolvedValue({ data: { data: {} } });
    render(<SettingsPage path="/admin/settings" />);
    const instituteTab = await screen.findByRole('tab', { name: 'ข้อมูลสถาบัน' });
    const paymentTab = screen.getByRole('tab', { name: 'การรับชำระเงิน' });

    instituteTab.focus();
    fireEvent.keyDown(instituteTab, { key: 'ArrowRight' });
    expect(paymentTab).toHaveFocus();
    expect(paymentTab).toHaveAttribute('aria-selected', 'true');
    expect(window.location.search).toContain('tab=payment');
    expect(screen.getByRole('tabpanel', { name: 'การรับชำระเงิน' })).toBeVisible();

    fireEvent.keyDown(paymentTab, { key: 'Home' });
    expect(instituteTab).toHaveFocus();
    expect(window.location.search).toBe('');
  });

  it('does not show a destructive action that has no API implementation', async () => {
    instituteService.getInstitute.mockResolvedValue({ data: { data: {} } });
    render(<SettingsPage path="/admin/settings" />);
    await screen.findByRole('tab', { name: 'ข้อมูลสถาบัน' });

    expect(screen.queryByRole('button', { name: 'ลบบัญชีผู้ดูแลระบบ' })).not.toBeInTheDocument();
    expect(screen.getByText('ยังไม่เปิดให้ใช้งาน')).toBeInTheDocument();
    await waitFor(() => expect(showToast).not.toHaveBeenCalled());
  });
});
