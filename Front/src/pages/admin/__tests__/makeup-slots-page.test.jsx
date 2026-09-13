import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MakeupSlotsPage } from '../makeup-slots-page';
import { getTeachers } from '../../../services/teacher-service';
import { makeupService } from '../../../services/makeup-service';

vi.mock('../../../layouts/admin-layout', () => ({
  AdminLayout: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../../components/ui', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
  SolidInput: ({ label, ...props }) => <label>{label}<input {...props} /></label>,
  showToast: vi.fn(),
}));

vi.mock('../../../services/teacher-service', () => ({
  getTeachers: vi.fn(),
}));

vi.mock('../../../services/makeup-service', () => ({
  makeupService: {
    getMakeupSlots: vi.fn(),
    createMakeupSlot: vi.fn(),
    cancelMakeupSlot: vi.fn(),
  },
}));

vi.mock('react-icons/hi2', () => ({
  HiOutlineCalendarDays: () => <span aria-hidden="true" />,
  HiOutlinePlus: () => <span aria-hidden="true" />,
}));

describe('Makeup slots page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
    getTeachers.mockResolvedValue({ data: [{ id: 4, fullName: 'Kru Mali' }] });
    makeupService.getMakeupSlots.mockResolvedValue({ data: [{ id: 12, teacherId: 4, scheduledAt: '2026-10-01T10:00:00Z', capacity: 3, bookedCount: 1, roomId: 'A1', status: 'open' }] });
  });

  it('maps teacher and slot status from API responses', async () => {
    render(<MakeupSlotsPage path="/admin/makeup-slots" />);

    expect(await screen.findByText('Kru Mali', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('เปิดรับจอง')).toBeInTheDocument();
    expect(screen.getByText('1/3 ที่นั่ง')).toBeInTheDocument();
  });

  it('shows validation without creating a slot when required fields are missing', async () => {
    render(<MakeupSlotsPage path="/admin/makeup-slots" />);
    await screen.findByText('Kru Mali', { selector: 'p' });

    fireEvent.submit(screen.getByRole('button', { name: 'สร้าง slot' }).closest('form'));

    expect(await screen.findByRole('alert')).toHaveTextContent('กรุณาระบุครู เวลา และจำนวนที่นั่งให้ครบ');
    expect(makeupService.createMakeupSlot).not.toHaveBeenCalled();
  });

  it('creates and cancels through the matching API endpoints', async () => {
    makeupService.createMakeupSlot.mockResolvedValue({ data: { id: 13 } });
    makeupService.cancelMakeupSlot.mockResolvedValue({ data: { status: 'cancelled' } });
    render(<MakeupSlotsPage path="/admin/makeup-slots" />);
    await screen.findByText('Kru Mali', { selector: 'p' });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '4' } });
    fireEvent.input(screen.getByLabelText('วันและเวลา *'), { target: { value: '2026-10-01T10:00' } });
    fireEvent.submit(screen.getByRole('button', { name: 'สร้าง slot' }).closest('form'));
    await waitFor(() => expect(makeupService.createMakeupSlot).toHaveBeenCalledWith(expect.objectContaining({ teacherId: 4, capacity: 1, roomId: null })));

    fireEvent.click(screen.getByRole('button', { name: 'ยกเลิก slot และคืนเครดิต' }));
    await waitFor(() => expect(makeupService.cancelMakeupSlot).toHaveBeenCalledWith(12));
  });
});
