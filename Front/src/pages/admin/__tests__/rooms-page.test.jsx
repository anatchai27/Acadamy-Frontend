import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { RoomsPage } from '../rooms-page';
import { roomService } from '../../../services';
import { showToast } from '../../../components/ui';

vi.mock('../../../layouts/admin-layout', () => ({ AdminLayout: ({ children }) => <main>{children}</main> }));
vi.mock('../../../hooks/useDesignTheme', () => ({ useDesignTheme: () => ({ designTheme: 'bento' }) }));
vi.mock('../../../services', () => ({
  roomService: {
    getRooms: vi.fn(),
    createRoom: vi.fn(),
    updateRoom: vi.fn(),
    deleteRoom: vi.fn(),
  },
}));
vi.mock('../../../components/ui', () => ({
  Button: ({ children, ...props }) => <button {...props}>{props.loading ? 'กำลังดำเนินการ...' : children}</button>,
  SolidInput: ({ label, id, ...props }) => <label for={id}>{label}<input id={id} {...props} /></label>,
  showToast: vi.fn(),
}));
vi.mock('react-icons/hi2', () => ({
  HiOutlineArrowPath: () => <span aria-hidden="true" />,
  HiOutlineBuildingOffice2: () => <span aria-hidden="true" />,
  HiOutlinePlus: () => <span aria-hidden="true" />,
  HiOutlinePencil: () => <span aria-hidden="true" />,
  HiOutlineTrash: () => <span aria-hidden="true" />,
}));

const sampleRoom = { id: 7, name: 'ห้อง 101', nameEn: 'Room 101', description: 'ชั้นหนึ่ง', isActive: true };

beforeEach(() => {
  vi.clearAllMocks();
  window.confirm = vi.fn().mockReturnValue(true);
});

describe('RoomsPage', () => {
  it('shows a recoverable load error instead of the empty state, then retries', async () => {
    roomService.getRooms.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({ data: [sampleRoom] });
    render(<RoomsPage path="/admin/rooms" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('โหลดห้องเรียนไม่สำเร็จ');
    expect(screen.queryByText('ยังไม่มีห้องเรียน')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'ลองโหลดอีกครั้ง' }));

    expect(await screen.findByText('ห้อง 101')).toBeInTheDocument();
    expect(screen.getByText('Room 101')).toBeInTheDocument();
  });

  it('labels the required Thai room name and presents English room details when available', async () => {
    roomService.getRooms.mockResolvedValue({ data: [sampleRoom] });
    render(<RoomsPage path="/admin/rooms" />);

    const nameInput = await screen.findByLabelText('ชื่อห้องเรียน (ไทย)');
    expect(nameInput).toBeRequired();
    expect(screen.getByText('Room 101')).toBeInTheDocument();
  });

  it('does not claim the list refreshed when saving succeeds but reloading fails', async () => {
    roomService.getRooms.mockResolvedValueOnce({ data: [] }).mockRejectedValueOnce(new Error('network'));
    roomService.createRoom.mockResolvedValue({ data: sampleRoom });
    render(<RoomsPage path="/admin/rooms" />);

    fireEvent.input(await screen.findByLabelText('ชื่อห้องเรียน (ไทย)'), { target: { value: 'ห้อง 101' } });
    fireEvent.click(screen.getByRole('button', { name: 'เพิ่มห้องเรียน' }));

    await waitFor(() => expect(showToast).toHaveBeenCalledWith(
      'บันทึกห้องเรียนแล้ว แต่โหลดรายการล่าสุดไม่สำเร็จ ลองโหลดใหม่อีกครั้ง',
      'warning'
    ));
    expect(roomService.createRoom).toHaveBeenCalledOnce();
  });

  it('disables the delete action while the request is pending', async () => {
    let finishDelete;
    roomService.getRooms.mockResolvedValueOnce({ data: [sampleRoom] }).mockResolvedValueOnce({ data: [] });
    roomService.deleteRoom.mockReturnValue(new Promise((resolve) => { finishDelete = resolve; }));
    render(<RoomsPage path="/admin/rooms" />);

    const deleteButton = await screen.findByRole('button', { name: 'ลบห้อง ห้อง 101' });
    fireEvent.click(deleteButton);
    await waitFor(() => expect(deleteButton).toBeDisabled());
    finishDelete();
    await waitFor(() => expect(deleteButton).not.toBeInTheDocument());
  });
});
