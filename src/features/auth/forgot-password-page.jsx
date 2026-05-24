import { route } from 'preact-router';
import { useForm } from 'react-hook-form';
import { Button, Input, AuthFormLayout, AuthPageShell } from '../../components/ui';
import { showToast } from '../../components/ui';

const emailRules = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      email: '',
    },
  });

  // VALIDATE FORM
  const onError = () =>
    showToast('กรุณากรอกอีเมลให้ถูกต้อง', 'error');

  const onSubmit = async (data) => {
    console.log('Forgot password:', data);
    showToast('ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณเรียบร้อยแล้ว', 'success');
  };

  return (
    <AuthPageShell navActionLabel="กลับไปหน้าเข้าสู่ระบบ" navActionHref="/login">
      <AuthFormLayout
        title="ลืมรหัสผ่าน?"
        subtitle="กรุณากรอกอีเมลที่ใช้ลงทะเบียน เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้คุณ"
      >
        <form
          onSubmit={handleSubmit(onSubmit, onError)}
          class="flex flex-col gap-5"
        >
          <Input
            type="email"
            label="อีเมล"
            id="forgot-email"
            placeholder="อีเมลของคุณ"
            error={errors.email?.message}
            {...register('email', {
              required: 'กรุณากรอกอีเมล',
              validate: (v) =>
                emailRules.test(v) || 'กรุณากรอกรูปแบบอีเมลให้ถูกต้อง',
            })}
          />
          <Button variant="primary" size="md" type="submit" class="w-full mt-2" loading={isSubmitting}>
            ส่งลิงก์รีเซ็ตรหัสผ่าน
          </Button>
        </form>

        <div class="mt-6 flex justify-center">
          <Button variant="outline" size="md" onClick={() => route('/login')}>
            กลับไปหน้าเข้าสู่ระบบ
          </Button>
        </div>
      </AuthFormLayout>
    </AuthPageShell>
  );
}
