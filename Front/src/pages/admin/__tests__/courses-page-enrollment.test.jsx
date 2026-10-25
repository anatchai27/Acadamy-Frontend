import { fireEvent, render, screen, waitFor, within } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoursesPage } from '../courses-page';
import { courseService, enrollmentService, studentService, teacherService } from '../../../services';

const roleState = vi.hoisted(() => ({ role: 'admin' }));

vi.mock('../../../layouts/admin-layout', () => ({
  AdminLayout: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../../components/ui', () => ({
  Button: ({ children, loading, ...props }) => <button {...props}>{loading ? 'กำลังดำเนินการ...' : children}</button>,
  SolidInput: ({ label, ...props }) => (
    <label>
      {label}
      <input {...props} />
    </label>
  ),
  showToast: vi.fn(),
}));

vi.mock('../../../services', () => ({
  courseService: { getCourses: vi.fn(), createCourse: vi.fn(), updateCourse: vi.fn() },
  teacherService: { getTeachers: vi.fn() },
  studentService: { getStudents: vi.fn() },
  enrollmentService: { getEnrollments: vi.fn(), enrollStudent: vi.fn() },
}));

vi.mock('../../../hooks', () => ({ useAbortController: () => () => undefined }));
vi.mock('../../../hooks/useDesignTheme', () => ({ useDesignTheme: () => ({ designTheme: 'default' }) }));
vi.mock('../../../store/AppContext', () => ({
  useAppContext: () => ({ state: { user: { role: roleState.role } } }),
}));
vi.mock('react-icons/hi2', () => ({
  HiOutlinePlus: () => <span aria-hidden="true" />,
  HiOutlineBookOpen: () => <span aria-hidden="true" />,
  HiOutlineClock: () => <span aria-hidden="true" />,
  HiOutlinePencil: () => <span aria-hidden="true" />,
  HiOutlineArrowUpRight: () => <span aria-hidden="true" />,
  HiOutlineTag: () => <span aria-hidden="true" />,
  HiOutlineUserPlus: () => <span aria-hidden="true" />,
  HiOutlineUserGroup: () => <span aria-hidden="true" />,
  HiOutlineMagnifyingGlass: () => <span aria-hidden="true" />,
  HiOutlineCheckCircle: () => <span aria-hidden="true" />,
  HiOutlineXMark: () => <span aria-hidden="true" />,
  HiOutlineArrowPath: () => <span aria-hidden="true" />,
}));

describe('course enrollment flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    roleState.role = 'admin';
    courseService.getCourses.mockResolvedValue({
      data: {
        data: {
          courses: [
            {
              id: 12,
              name: 'คณิตศาสตร์ ม.1',
              subject: 'พื้นฐานคณิตศาสตร์',
              price: 5000,
              totalSessions: 20,
              courseType: 'group',
            },
            { id: 13, name: 'คอร์สที่ยังไม่พร้อม', price: 0, totalSessions: 0, courseType: 'group' },
          ],
        },
      },
    });
    teacherService.getTeachers.mockResolvedValue({ data: [] });
    studentService.getStudents.mockResolvedValue({
      data: { data: { students: [{ id: 7, fullName: 'น้องสมชาย', nickname: 'ชาย', grade: 'ม.1' }] } },
    });
    enrollmentService.getEnrollments.mockResolvedValue({ data: { data: { enrollments: [] } } });
    enrollmentService.enrollStudent.mockResolvedValue({
      data: { message: 'ลงทะเบียนเรียนสำเร็จ', data: { enrollmentId: 33, sessionsRemaining: 20 } },
    });
  });

  it('registers a student and shows the per-session cost before confirmation', async () => {
    render(<CoursesPage path="/admin/courses" />);

    fireEvent.click(await screen.findByRole('button', { name: 'ลงทะเบียนนักเรียน' }));
    fireEvent.click(await screen.findByRole('button', { name: /น้องสมชาย/ }));
    const courseButton = await screen.findByRole('button', { name: /20 คาบในอนาคต/ });
    await waitFor(() => expect(courseButton).toBeEnabled());
    fireEvent.click(courseButton);

    expect(screen.queryByText('6 เดือนนับจากวันที่ลงทะเบียน')).not.toBeInTheDocument();
    expect(screen.getAllByText('฿250')).toHaveLength(1);
    const unavailableCourse = within(screen.getByRole('dialog')).getByRole('button', { name: /คอร์สที่ยังไม่พร้อม/ });
    expect(unavailableCourse).toBeDisabled();
    expect(within(unavailableCourse).getByText(/ยังไม่มีคาบเรียนในอนาคต/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'ยืนยันลงทะเบียน' }));

    await waitFor(() => expect(enrollmentService.enrollStudent).toHaveBeenCalledWith({ studentId: 7, courseId: 12 }));
  });

  it('shows a recoverable load error instead of an empty-course state', async () => {
    courseService.getCourses.mockRejectedValueOnce(new Error('network'));
    render(<CoursesPage path="/admin/courses" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('ไม่สามารถโหลดข้อมูลคอร์สเรียนได้');
    expect(screen.queryByText('ยังไม่มีคอร์สเรียนในสถาบัน')).not.toBeInTheDocument();
  });

  it('hides enrollment and roster actions for teachers when the API does not allow those reads', async () => {
    roleState.role = 'teacher';
    render(<CoursesPage path="/admin/courses" />);

    expect(await screen.findByText('คณิตศาสตร์ ม.1')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'ลงทะเบียนนักเรียน' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ดูผู้ลงทะเบียน/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'แก้ไข คณิตศาสตร์ ม.1' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /ดูตารางเรียน/ })).toHaveLength(2);
  });

  it('submits the search form without triggering native navigation', async () => {
    render(<CoursesPage path="/admin/courses" />);
    await screen.findByText('คณิตศาสตร์ ม.1');
    fireEvent.input(screen.getByLabelText('ค้นหาคอร์สเรียน'), { target: { value: 'ภาษาอังกฤษ' } });
    const searchForm = screen.getByRole('search');
    fireEvent.submit(searchForm);

    await waitFor(() => expect(courseService.getCourses).toHaveBeenLastCalledWith(
      { search: 'ภาษาอังกฤษ' },
      expect.anything()
    ));
  });
});
