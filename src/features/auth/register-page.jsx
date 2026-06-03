import { route } from 'preact-router';
import { useForm, Controller } from 'react-hook-form';
import { Button, Input, Checkbox, AuthFormLayout, AuthPageShell } from '../../components/ui';
import { showToast } from '../../components/ui';
import { userService } from '../../services';

export function RegisterPage() {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      full_name: '',
      institution_name: '',
      line_id: '',
      email: '',
      phone: '',
      password: '',
      consent_version: '',
    },
  });

  const fullName = watch('full_name');
  const institutionName = watch('institution_name');
  const email = watch('email');
  const phone = watch('phone');
  const password = watch('password');
  const consentVersion = watch('consent_version');
  const lineId = watch('line_id');

  const passwordRules = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  const emailRules = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const canSubmit =
    !!fullName?.trim() &&
    !!institutionName?.trim() &&
    !!lineId?.trim() &&
    !!phone?.trim() &&
    emailRules.test(email || '') &&
    passwordRules.test(password || '') &&
    !!consentVersion &&
    !isSubmitting;

  // HANDLE FORM SUBMIT
  const onSubmit = async (data) => {
    try {
      const payload = {
        email: data.email,
        password: data.password,
        phone: data.phone,
        role: 0,
        lineUserId: data.line_id,
        acceptPdpa: data.consent_version ? true : false,
      };

      const response = await userService.createUser(payload);

      showToast('สร้างบัญชีผู้ใช้งานสำเร็จ กำลังเปลี่ยนเส้นทาง...', 'success', 3000);
      setTimeout(() => route('/login'), 1200);
    } catch (error) {
      const message = error?.data?.message
        || (error?.status === 409 && 'อีเมลหรือ Line ID นี้มีผู้ใช้งานแล้ว')
        || 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';

      showToast(message, 'error');
      console.error('Register error:', error);
    }
  };

  // VALIDATE FORM
  const onError = () =>
    showToast('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง', 'error');

  return (
    <AuthPageShell navActionLabel="เข้าสู่ระบบ" navActionHref="/login">
      <AuthFormLayout
        title="เริ่มต้นใช้งาน TiwHub"
        subtitle="สร้างบัญชีสำหรับสถาบันสอนพิเศษของคุณฟรี"
      >
        <form
          onSubmit={handleSubmit(onSubmit, onError)}
          class="flex flex-col gap-5"
        >
          <Controller
            name="full_name"
            control={control}
            rules={{
              required: 'กรุณากรอกชื่อ-นามสกุล',
              validate: (v) =>
                v.trim().length > 0 || 'กรุณากรอกชื่อ-นามสกุล',
            }}
            render={({ field }) => (
              <Input
                type="text"
                label="ชื่อ-นามสกุล"
                id="reg-full-name"
                placeholder="กรอกชื่อ-นามสกุล"
                error={errors.full_name?.message}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                name={field.name}
              />
            )}
          />

          <Controller
            name="institution_name"
            control={control}
            rules={{
              required: 'กรุณากรอกชื่อสถาบันสอนพิเศษ',
              validate: (v) =>
                v.trim().length > 0 || 'กรุณากรอกชื่อสถาบันสอนพิเศษ',
            }}
            render={({ field }) => (
              <Input
                type="text"
                label="ชื่อสถาบันสอนพิเศษ"
                id="reg-institution-name"
                placeholder="กรอกชื่อสถาบัน"
                error={errors.institution_name?.message}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                name={field.name}
              />
            )}
          />
          <Controller
            name="line_id"
            control={control}
            rules={{
              required: 'กรุณากรอก Line ID',
              validate: (v) =>
                v.trim().length > 0 || 'กรุณากรอก Line ID',
            }}
            render={({ field }) => (
              <Input
                type="text"
                label="Line ID"
                id="reg-line-id"
                placeholder="กรอก Line ID"
                error={errors.line_id?.message}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                name={field.name}
              />
            )}
          />

          <Controller
            name="email"
            control={control}
            rules={{
              required: 'กรุณากรอกอีเมล',
              validate: (v) =>
                emailRules.test(v) || 'กรุณากรอกรูปแบบอีเมลให้ถูกต้อง',
            }}
            render={({ field }) => (
              <Input
                type="email"
                label="อีเมล"
                id="reg-email"
                placeholder="กรอกอีเมล"
                error={errors.email?.message}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                name={field.name}
              />
            )}
          />

          <Controller
            name="phone"
            control={control}
            rules={{
              required: 'กรุณากรอกเบอร์โทรศัพท์',
              validate: (v) =>
                v.trim().length > 0 || 'กรุณากรอกเบอร์โทรศัพท์',
            }}
            render={({ field }) => (
              <Input
                type="tel"
                label="เบอร์โทรศัพท์"
                id="reg-phone"
                placeholder="กรอกเบอร์โทรศัพท์"
                error={errors.phone?.message}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                name={field.name}
              />
            )}
          />

          <Controller
            name="password"
            control={control}
            rules={{
              required: 'กรุณากรอกรหัสผ่าน',
              validate: (v) =>
                passwordRules.test(v) ||
                'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัว ตัวพิมพ์เล็ก พิมพ์ใหญ่ และตัวเลข',
            }}
            render={({ field }) => (
              <Input
                type="password"
                label="รหัสผ่าน"
                id="reg-password"
                placeholder="ตั้งรหัสผ่าน"
                error={errors.password?.message}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                name={field.name}
              />
            )}
          />

          <Controller
            name="consent_version"
            control={control}
            rules={{
              required: 'กรุณายอมรับข้อตกลงและเงื่อนไขการใช้งาน',
              validate: (v) =>
                v.trim().length > 0 || 'กรุณายอมรับข้อตกลงและเงื่อนไขการใช้งาน',
            }}
            render={({ field }) => (
              <Checkbox
                id="consent"
                checked={!!field.value}
                onChange={(e) =>
                  field.onChange(e.target.checked ? 'v1.0' : '')
                }
                onBlur={field.onBlur}
                label="ฉันยอมรับข้อตกลงและเงื่อนไขการใช้งาน (PDPA)"
                error={errors.consent_version?.message}
                required
                name={field.name}
              />
            )}
          />

          <Button
            variant="primary"
            size="md"
            type="submit"
            class="w-full mt-2"
            loading={isSubmitting}
            disabled={!canSubmit}
          >
            สร้างบัญชีผู้ใช้งาน
          </Button>
        </form>

        <p class="mt-6 text-center text-sm text-slate-600">
          มีบัญชีอยู่แล้ว?{' '}
          <Button variant="link" size="sm" onClick={() => route('/login')}>
            เข้าสู่ระบบ
          </Button>
        </p>
      </AuthFormLayout>
    </AuthPageShell>
  );
}
