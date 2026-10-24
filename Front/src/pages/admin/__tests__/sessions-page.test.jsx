import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionsPage } from '../sessions-page';
import { courseService, roomService, sessionService } from '../../../services';

vi.mock('../../../layouts/admin-layout', () => ({
  AdminLayout: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../../components/ui', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
  SolidInput: ({ label, ...props }) => <label>{label}<input {...props} /></label>,
  showToast: vi.fn(),
}));

vi.mock('../../../services', () => ({
  sessionService: { getSessions: vi.fn(), createSession: vi.fn(), updateSession: vi.fn(), createRecurringSessions: vi.fn(), replaceFutureSessions: vi.fn() },
  courseService: { getCourseById: vi.fn() },
  roomService: { getRooms: vi.fn() },
}));

vi.mock('../../../hooks', () => ({ useAbortController: () => () => undefined }));
vi.mock('../../../hooks/useDesignTheme', () => ({ useDesignTheme: () => ({ designTheme: 'default' }) }));
vi.mock('preact-router', () => ({ route: vi.fn() }));
vi.mock('react-icons/hi2', () => ({
  HiOutlinePlus: () => <span aria-hidden="true" />,
  HiOutlineChevronLeft: () => <span aria-hidden="true" />,
  HiOutlineChevronRight: () => <span aria-hidden="true" />,
  HiOutlineCalendar: () => <span aria-hidden="true" />,
  HiOutlineUser: () => <span aria-hidden="true" />,
  HiOutlineBookOpen: () => <span aria-hidden="true" />,
  HiOutlineClock: () => <span aria-hidden="true" />,
  HiOutlineCurrencyDollar: () => <span aria-hidden="true" />,
}));

describe('course sessions calendar', () => {
  afterEach(() => vi.restoreAllMocks());

  beforeEach(() => {
    vi.clearAllMocks();
    const scheduledAt = new Date();
    scheduledAt.setHours(10, 30, 0, 0);
    courseService.getCourseById.mockResolvedValue({ data: { data: { id: 8, name: 'คณิตศาสตร์', subject: 'คณิตศาสตร์' } } });
    sessionService.getSessions.mockResolvedValue({
      data: { data: { sessions: [{ id: 21, scheduledAt: scheduledAt.toISOString(), durationMin: 90, roomId: 3, status: 'scheduled' }] } },
    });
    sessionService.updateSession.mockResolvedValue({ data: { Status: 'success' } });
    sessionService.replaceFutureSessions.mockResolvedValue({ data: { cancelledCount: 2, preservedCount: 1, createdCount: 4 } });
    roomService.getRooms.mockResolvedValue({ data: { data: [{ id: 3, name: 'ห้อง A', isActive: true }] } });
  });

  it('shows sessions in the calendar and opens the selected session details', async () => {
    render(<SessionsPage path="/admin/courses/8/sessions" courseId="8" />);

    const [sessionEvent] = await screen.findAllByRole('button', { name: /10:30/ });
    fireEvent.click(sessionEvent);

    expect(await screen.findByText('ระยะเวลา 90 นาที')).toBeInTheDocument();
    expect(screen.getByText('ห้อง A')).toBeInTheDocument();
    expect(screen.getAllByText('ตามตาราง').length).toBeGreaterThanOrEqual(1);
  });

  it('navigates between months and returns to the current month', async () => {
    const { container } = render(<SessionsPage path="/admin/courses/8/sessions" courseId="8" />);
    await waitFor(() => expect(screen.getByText('ปฏิทินตารางสอน')).toBeInTheDocument());
    const getMonthLabel = () => container.querySelector('[aria-live="polite"]')?.textContent;
    const initialMonthLabel = getMonthLabel();

    fireEvent.click(screen.getByRole('button', { name: 'เดือนถัดไป' }));
    expect(getMonthLabel()).not.toBe(initialMonthLabel);

    fireEvent.click(screen.getByRole('button', { name: 'วันนี้' }));
    expect(getMonthLabel()).toBe(initialMonthLabel);
  });

  it('opens the edit form with current values and submits the updated session', async () => {
    render(<SessionsPage path="/admin/courses/8/sessions" courseId="8" />);

    fireEvent.click((await screen.findAllByRole('button', { name: /10:30/ }))[0]);
    fireEvent.click(await screen.findByRole('button', { name: 'แก้ไขคาบเรียน' }));

    const dateInput = screen.getByLabelText('วันที่สอน *');
    const timeInput = screen.getByLabelText('เวลาเรียนเริ่ม *');
    expect(timeInput.value).toBe('10:30');
    expect(dateInput.value).not.toBe('');

    fireEvent.input(timeInput, { target: { value: '11:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'บันทึกการแก้ไข' }));

    await waitFor(() => expect(sessionService.updateSession).toHaveBeenCalledWith('8', 21, expect.objectContaining({
      durationMin: 90,
      roomId: '3',
    })));
  });

  it('confirms before replacing future sessions and submits the recurring rules', async () => {
    window.confirm = vi.fn().mockReturnValue(true);
    const confirmSpy = vi.spyOn(window, 'confirm');
    render(<SessionsPage path="/admin/courses/8/sessions" courseId="8" />);

    fireEvent.click(await screen.findByRole('button', { name: 'เพิ่มคาบเรียน' }));
    fireEvent.click(screen.getByLabelText('กำหนดตารางสอนหลายวัน'));
    fireEvent.click(screen.getByLabelText('แทนที่ตารางเรียนในอนาคต'));

    const nextMonday = new Date();
    nextMonday.setDate(nextMonday.getDate() + ((8 - nextMonday.getDay()) % 7 || 7));
    const dateValue = `${nextMonday.getFullYear()}-${String(nextMonday.getMonth() + 1).padStart(2, '0')}-${String(nextMonday.getDate()).padStart(2, '0')}`;
    fireEvent.input(screen.getByLabelText('เริ่มสอนวันที่ *'), { target: { value: dateValue } });
    fireEvent.input(screen.getByLabelText('สิ้นสุดวันที่ *'), { target: { value: dateValue } });
    fireEvent.click(screen.getByRole('button', { name: 'แทนที่และบันทึกตาราง' }));

    await waitFor(() => expect(sessionService.replaceFutureSessions).toHaveBeenCalledWith('8', expect.objectContaining({
      startDate: dateValue,
      endDate: dateValue,
      rules: [expect.objectContaining({ dayOfWeek: 1, startTime: '10:00' })],
    })));
    expect(confirmSpy).toHaveBeenCalledOnce();
    expect(confirmSpy.mock.calls[0][0]).toContain('สิทธิ์เรียนของนักเรียนและเอกสารของคอร์สจะไม่เปลี่ยนแปลง');
  });
});
