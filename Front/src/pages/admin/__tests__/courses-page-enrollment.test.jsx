import { fireEvent, render, screen, waitFor, within } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoursesPage } from '../courses-page';
import { courseService, enrollmentService, studentService, teacherService } from '../../../services';

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
vi.mock('react-icons/hi2', () => ({
  HiOutlinePlus: () => <span aria-hidden="true" />,
  HiOutlineBookOpen: () => <span aria-hidden="true" />,
  HiOutlineClock: () => <span aria-hidden="true" />,
  HiOutlinePencil: () => <span aria-hidden="true" />,
  HiOutlineArrowUpRight: () => <span aria-hidden="true" />,
  HiOutlineTag: () => <span aria-hidden="true" />,
  HiOutlineUserPlus: () => <span aria-hidden="true" />,
  HiOutlineMagnifyingGlass: () => <span aria-hidden="true" />,
  HiOutlineCheckCircle: () => <span aria-hidden="true" />,
  HiOutlineXMark: () => <span aria-hidden="true" />,
}));

describe('course enrollment flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    const courseButton = await screen.findByRole('button', { name: /20 คาบในตาราง/ });
    await waitFor(() => expect(courseButton).toBeEnabled());
    fireEvent.click(courseButton);

    expect(screen.queryByText('6 เดือนนับจากวันที่ลงทะเบียน')).not.toBeInTheDocument();
    expect(screen.getAllByText('฿250')).toHaveLength(1);
    expect(within(screen.getByRole('dialog')).queryByText('คอร์สที่ยังไม่พร้อม')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'ยืนยันลงทะเบียน' }));

    await waitFor(() => expect(enrollmentService.enrollStudent).toHaveBeenCalledWith({ studentId: 7, courseId: 12 }));
  });
});
