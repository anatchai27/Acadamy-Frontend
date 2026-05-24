import { route } from 'preact-router';
import { useForm } from 'react-hook-form';
import { Button, Input, Checkbox, AuthFormLayout, AuthPageShell } from '../../components/ui';
import { showToast } from '../../components/ui';
import { useAppContext } from '../../store/AppContext';

export function LoginPage() {
  const { dispatch } = useAppContext();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const emailReg = register('email', { required: 'กรุณากรอกอีเมลหรือเบอร์โทรศัพท์' });
  const passwordReg = register('password', { required: 'กรุณากรอกรหัสผ่าน' });
  const rememberReg = register('remember');

  const onSubmit = (data) => {
    dispatch({ type: 'SET_USER', payload: { email: data.email } });
    showToast('เข้าสู่ระบบสำเร็จ', 'success');
    route('/admin/dashboard');
  };

  const onError = () => {
    showToast('กรุณากรอกอีเมลหรือเบอร์โทรศัพท์และรหัสผ่าน', 'error');
  };

  return (
    <AuthPageShell navActionLabel="ลงทะเบียนสถาบันใหม่" navActionHref="/register">
      <AuthFormLayout
        title="เข้าสู่ระบบ TiwHub"
        subtitle="จัดการคลาสเรียนและติดตามการเรียนการสอนของคุณ"
      >
        <form onSubmit={handleSubmit(onSubmit, onError)} class="flex flex-col gap-5">
          <Input
            type="email"
            label="อีเมล หรือ เบอร์โทรศัพท์"
            id="login-email"
            placeholder="กรอกอีเมลหรือเบอร์โทรศัพท์"
            error={errors.email?.message}
            name={emailReg.name}
            onChange={emailReg.onChange}
            onBlur={emailReg.onBlur}
            inputRef={emailReg.ref}
          />

          <Input
            type="password"
            label="รหัสผ่าน"
            id="login-password"
            placeholder="กรอกรหัสผ่าน"
            error={errors.password?.message}
            name={passwordReg.name}
            onChange={passwordReg.onChange}
            onBlur={passwordReg.onBlur}
            inputRef={passwordReg.ref}
          />

          <div class="flex items-center justify-between">
            <Checkbox
              id="remember"
              label="จดจำการเข้าสู่ระบบ"
              name={rememberReg.name}
              onChange={rememberReg.onChange}
              onBlur={rememberReg.onBlur}
              inputRef={rememberReg.ref}
            />
            <Button variant="link" size="sm" onClick={() => route('/forgot-password')}>
              ลืมรหัสผ่าน?
            </Button>
          </div>

          <Button variant="primary" size="md" type="submit" class="w-full mt-2">
            เข้าสู่ระบบ
          </Button>
        </form>

        <p class="mt-6 text-center text-sm text-slate-600">
          ยังไม่มีบัญชี?{' '}
          <Button variant="link" size="sm" onClick={() => route('/register')}>
            ลงทะเบียนสถาบันใหม่
          </Button>
        </p>
      </AuthFormLayout>
    </AuthPageShell>
  );
}
