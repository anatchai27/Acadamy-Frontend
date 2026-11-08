import { route } from 'preact-router';
import { useForm, Controller } from 'react-hook-form';
import { useState, useCallback, useEffect } from 'preact/hooks';
import { Button, Input, Checkbox, LogoUpload, showToast } from '../../components/ui';
import { authService, getCurrentTerms } from '../../services';
import { useAppContext } from '../../store/AppContext';
const PHONE_REGEX = /^\d{9,10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const INSTITUTE_NAME_MAX = 100;
const formDefaults = {
  institute_name: '',
  contact_phone: '',
  admin_full_name: '',
  line_id: '',
  admin_email: '',
  admin_phone: '',
  admin_password: '',
  accept_terms: false,
  accept_pdpa: false
};
export const RegisterPage = () => {
  const {
    dispatch
  } = useAppContext();
  const isNeo = false;
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [logoBase64, setLogoBase64] = useState(null);
  const [logoError, setLogoError] = useState(null);
  const [serverEmailError, setServerEmailError] = useState('');
  const {
    control,
    handleSubmit,
    watch,
    trigger,
    clearErrors,
    formState: {
      errors
    }
  } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: formDefaults
  });
  const instituteName = watch('institute_name');
  const contactPhone = watch('contact_phone');
  const adminFullName = watch('admin_full_name');
  const lineId = watch('line_id');
  const adminEmail = watch('admin_email');
  const adminPhone = watch('admin_phone');
  const adminPassword = watch('admin_password');
  const acceptTermsChecked = watch('accept_terms');
  const acceptPdpaChecked = watch('accept_pdpa');
  const [terms, setTerms] = useState(null);
  const [termsLanguage, setTermsLanguage] = useState('th');
  const [termsLoadError, setTermsLoadError] = useState('');
  useEffect(() => {
    getCurrentTerms(termsLanguage)
      .then(response => { setTerms(response.data?.document); setTermsLoadError(''); })
      .catch(() => setTermsLoadError('ไม่สามารถโหลดข้อกำหนดได้ กรุณาลองใหม่ / Unable to load the terms. Please retry.'));
  }, [termsLanguage]);
  const canGoToStep2 = !!instituteName?.trim() && instituteName.trim().length <= INSTITUTE_NAME_MAX && PHONE_REGEX.test(contactPhone || '') && !logoError;
  const canSubmit = !!adminFullName?.trim() && !!lineId?.trim() && EMAIL_REGEX.test(adminEmail || '') && !!adminPhone?.trim() && PASSWORD_REGEX.test(adminPassword || '') && !!terms?.version && acceptTermsChecked && acceptPdpaChecked && !submitting;
  const handleLogoChange = useCallback((base64, validationError) => {
    return validationError ? (() => {
      setLogoError(validationError);
      setLogoBase64(null);
    })() : (() => {
      setLogoError(null);
      setLogoBase64(base64 || null);
    })();
  }, []);
  const handleStep1Next = async () => {
    const valid = await trigger(['institute_name', 'contact_phone']);
    return !valid ? undefined : (() => {
      !instituteName?.trim() ? (() => {
        showToast('กรุณากรอกชื่อสถาบัน', 'error');
        return;
      })() : () => {};
      !PHONE_REGEX.test(contactPhone || '') ? (() => {
        showToast('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (9-10 หลัก)', 'error');
        return;
      })() : () => {};
      logoError ? (() => {
        showToast('กรุณาแก้ไขไฟล์โลโก้ให้ถูกต้อง', 'error');
        return;
      })() : () => {};
      setStep(2);
    })();
  };
  const handleBack = () => {
    setStep(1);
    setServerEmailError('');
  };
  const onSubmit = async data => {
    return !canSubmit ? undefined : (async () => {
      setSubmitting(true);
      setServerEmailError('');
      try {
        const payload = {
          institute: {
            name: data.institute_name,
            contactPhone: data.contact_phone
          },
          admin: {
            fullName: data.admin_full_name
          },
          role: 'admin',
          email: data.admin_email,
          password: data.admin_password,
          phone: data.admin_phone,
          lineUserId: data.line_id,
          acceptPdpa: data.accept_pdpa,
          pdpaConsentVersion: '1.0',
          acceptTerms: data.accept_terms,
          termsVersion: terms.version,
          termsLanguage
        };
        const response = await authService.registerInstitute(payload);
        return response.status === 201 || response.data?.token || response.data?.user ? (() => {
          const user = response.data?.user || response.data;
          dispatch({
            type: 'SET_USER',
            payload: user
          });
          dispatch({ type: 'SET_TERMS_ACCEPTED', payload: true });
          showToast('ลงทะเบียนสถาบันสำเร็จ! กำลังพาท่านเข้าสู่ระบบ...', 'success', 3000);
          setTimeout(() => route('/admin/dashboard'), 1200);
        })() : undefined;
      } catch (error) {
        const msg = error?.data?.message || error?.data?.error || '';
        return error?.status === 400 && (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('อีเมล')) ? (() => {
          setServerEmailError('อีเมลนี้มีการใช้งานในระบบแล้ว');
          setStep(2);
        })() : (() => {
          showToast(msg || (error?.status === 400 ? 'อีเมลนี้มีผู้ใช้งานแล้ว' : 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'), 'error');
        })();
      } finally {
        setSubmitting(false);
      }
    })();
  };
  const onError = () => showToast('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง', 'error');
  const emailDisplayError = serverEmailError || errors.admin_email?.message;
  return <div class={'min-h-screen flex flex-col md:flex-row ' + (isNeo ? 'bg-[#FAF3E0]' : '')}>
      {/* LEFT: Branding */}
      <div class={'md:w-[40%] flex flex-col items-center justify-center px-6 md:px-10 py-10 md:py-16 text-center ' + (isNeo ? 'bg-black text-white border-r-3 border-black' : 'bg-oasis-primary text-white')}>
        <img src="/tiwhub-mark.svg" alt="" class="mb-6 h-20 w-20 rounded-2xl bg-white p-2 shadow-lg md:mb-8 md:h-24 md:w-24 md:p-3" />
        <h1 class="text-2xl md:text-4xl font-bold mb-4 tracking-tight">tiwhub</h1>
        <p class="text-base md:text-lg text-white/80 leading-relaxed max-w-sm">จัดการสถาบันง่าย จบในที่เดียว</p>
        <div class="mt-8 md:mt-12 flex gap-6 md:gap-8">
          <div class="text-center"><p class="text-2xl md:text-3xl font-bold text-white">500+</p><p class="text-xs md:text-sm text-white/60 mt-1">สถาบันที่เชื่อมั่น</p></div>
          <div class="text-center"><p class="text-2xl md:text-3xl font-bold text-white">50,000+</p><p class="text-xs md:text-sm text-white/60 mt-1">นักเรียนในระบบ</p></div>
        </div>
      </div>

      {/* RIGHT: Form */}
      <div class={'md:w-[60%] flex items-center justify-center px-4 md:px-6 py-8 md:py-10 ' + (isNeo ? 'bg-[#FAF3E0]' : 'bg-white')}>
        <div class="w-full max-w-md">
          {/* Step Indicator */}
          <div class="flex items-center gap-3 md:gap-4 mb-8 md:mb-10">
            <div class="flex items-center gap-2">
              <div class={'w-8 h-8 flex items-center justify-center text-sm font-bold border-2 transition-colors ' + (isNeo ? '' : 'rounded-xl ') + (step >= 1 ? isNeo ? 'bg-white text-black border-black' : 'bg-oasis-primary border-oasis-primary text-white' : isNeo ? 'bg-white text-zinc-400 border-zinc-300' : 'bg-white border-zinc-300 text-zinc-400')}>1</div>
              <span class={'text-sm font-medium transition-colors ' + (step >= 1 ? isNeo ? 'text-black' : 'text-oasis-primary' : 'text-zinc-400')}>ข้อมูลสถาบัน</span>
            </div>
            <div class={'flex-1 h-0.5 transition-colors ' + (isNeo ? 'bg-black' : step === 2 ? 'bg-oasis-primary' : 'bg-zinc-200')} />
            <div class="flex items-center gap-2">
              <div class={'w-8 h-8 flex items-center justify-center text-sm font-bold border-2 transition-colors ' + (isNeo ? '' : 'rounded-xl ') + (step === 2 ? isNeo ? 'bg-black text-white border-black' : 'bg-oasis-primary border-oasis-primary text-white' : isNeo ? 'bg-white text-zinc-400 border-zinc-300' : 'bg-white border-zinc-300 text-zinc-400')}>2</div>
              <span class={'text-sm font-medium transition-colors ' + (step === 2 ? isNeo ? 'text-black' : 'text-oasis-primary' : 'text-zinc-400')}>ข้อมูลผู้ดูแล</span>
            </div>
          </div>

          <p class="text-xs uppercase tracking-wide text-zinc-500 mb-1">ขั้นตอนที่ {step}/2</p>
          <h2 class={'text-2xl font-semibold tracking-tight mb-2 ' + (isNeo ? 'text-black' : 'text-zinc-900')}>{step === 1 ? 'ข้อมูลสถาบัน' : 'เริ่มต้นใช้งาน tiwhub'}</h2>
          <p class="text-zinc-500 text-sm mb-8">{step === 1 ? 'กรอกข้อมูลสถาบันสอนพิเศษของคุณ' : 'สร้างบัญชีสำหรับสถาบันสอนพิเศษของคุณฟรี'}</p>

          <form onSubmit={handleSubmit(onSubmit, onError)} class="flex flex-col gap-5">
            {step === 1 ? <>
                <LogoUpload value={logoBase64} onChange={handleLogoChange} error={logoError} />
                <Controller name="institute_name" control={control} rules={{
              required: 'กรุณากรอกชื่อสถาบันสอนพิเศษ',
              maxLength: {
                value: INSTITUTE_NAME_MAX,
                message: 'ชื่อสถาบันต้องไม่เกิน 100 ตัวอักษร'
              }
            }} render={({
              field
              }) => <Input type="text" label="ชื่อสถาบันสอนพิเศษ" id="reg-institute-name" placeholder="เช่น สถาบันกวดวิชาแสงดาว" error={errors.institute_name?.message} value={field.value} onChange={e => field.onChange(e.target.value)} onBlur={field.onBlur} name={field.name} />} />
                <Controller name="contact_phone" control={control} rules={{
              required: 'กรุณากรอกเบอร์โทรศัพท์สถาบัน',
              validate: v => PHONE_REGEX.test(v) || 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง 9-10 หลัก'
            }} render={({
              field
            }) => <Input type="tel" label="เบอร์โทรศัพท์สถาบัน" id="reg-institute-phone" placeholder="02-XXX-XXXX หรือเบอร์มือถือ" error={errors.contact_phone?.message} value={field.value} onChange={e => {
              const val = e.target.value.replace(/\D/g, '');
              field.onChange(val.slice(0, 10));
            }} onBlur={field.onBlur} name={field.name} />} />
                <Button variant="primary" size="lg" type="button" disabled={!canGoToStep2} onClick={handleStep1Next}>ถัดไป</Button>
              </> : null}
            {step === 2 ? <>
                <Controller name="admin_full_name" control={control} rules={{
              required: 'กรุณากรอกชื่อ-นามสกุล',
              validate: v => v.trim().length > 0 || 'กรุณากรอกชื่อ-นามสกุล'
            }} render={({
              field
            }) => <Input type="text" label="ชื่อ-นามสกุล" id="reg-full-name" placeholder="กรอกชื่อ-นามสกุล" error={errors.admin_full_name?.message} value={field.value} onChange={e => field.onChange(e.target.value)} onBlur={field.onBlur} name={field.name} />} />
                <Controller name="line_id" control={control} rules={{
              required: 'กรุณากรอก Line ID',
              validate: v => v.trim().length > 0 || 'กรุณากรอก Line ID'
            }} render={({
              field
            }) => <Input type="text" label="Line ID" id="reg-line-id" placeholder="กรอก Line ID" error={errors.line_id?.message} value={field.value} onChange={e => field.onChange(e.target.value)} onBlur={field.onBlur} name={field.name} />} />
                <Controller name="admin_email" control={control} rules={{
              required: 'กรุณากรอกอีเมล',
              validate: v => EMAIL_REGEX.test(v) || 'กรุณากรอกรูปแบบอีเมลให้ถูกต้อง'
            }} render={({
              field
            }) => <Input type="email" label="อีเมลสำหรับเข้าสู่ระบบ" id="reg-email" placeholder="กรอกอีเมล" error={emailDisplayError} value={field.value} onChange={e => {
              field.onChange(e.target.value);
              setServerEmailError('');
              return errors.admin_email?.type === 'manual' ? (() => {
                clearErrors('admin_email');
              })() : undefined;
            }} onBlur={field.onBlur} name={field.name} />} />
                <Controller name="admin_phone" control={control} rules={{
              required: 'กรุณากรอกเบอร์โทรศัพท์',
              validate: v => v.trim().length > 0 || 'กรุณากรอกเบอร์โทรศัพท์'
            }} render={({
              field
            }) => <Input type="tel" label="เบอร์โทรศัพท์" id="reg-phone" placeholder="กรอกเบอร์โทรศัพท์" error={errors.admin_phone?.message} value={field.value} onChange={e => field.onChange(e.target.value)} onBlur={field.onBlur} name={field.name} />} />
                <Controller name="admin_password" control={control} rules={{
              required: 'กรุณากรอกรหัสผ่าน',
              validate: v => PASSWORD_REGEX.test(v) || 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัว ตัวพิมพ์เล็ก พิมพ์ใหญ่ และตัวเลข'
            }} render={({
              field
            }) => <Input type="password" label="รหัสผ่าน" id="reg-password" placeholder="ตั้งรหัสผ่าน" error={errors.admin_password?.message} value={field.value} onChange={e => field.onChange(e.target.value)} onBlur={field.onBlur} name={field.name} />} />
                <section class="rounded-xl border border-zinc-200 bg-zinc-50 p-4" aria-labelledby="register-terms-title">
                  <div class="mb-3 flex items-center justify-between gap-3">
                    <h3 id="register-terms-title" class="font-semibold text-zinc-900">ข้อกำหนด / Terms of Service {terms?.version ? `· v${terms.version}` : ''}</h3>
                    <div class="flex gap-2 text-sm"><button type="button" class="underline" onClick={() => setTermsLanguage('th')} aria-pressed={termsLanguage === 'th'}>ไทย</button><button type="button" class="underline" onClick={() => setTermsLanguage('en')} aria-pressed={termsLanguage === 'en'}>English</button></div>
                  </div>
                  {termsLoadError ? <p role="alert" class="text-sm text-red-700">{termsLoadError}</p> : terms ? <div class="max-h-48 overflow-y-auto pr-2 text-sm leading-6 text-zinc-700" lang={termsLanguage}>
                    <p class="font-medium">{terms.title?.[termsLanguage]}</p><p class="mt-2">{terms.intro?.[termsLanguage]}</p>
                    {terms.sections?.map(section => <article key={section.heading?.[termsLanguage]} class="mt-3"><h4 class="font-semibold">{section.heading?.[termsLanguage]}</h4>{section.paragraphs?.[termsLanguage]?.map(paragraph => <p class="mt-1" key={paragraph}>{paragraph}</p>)}</article>)}
                  </div> : <p class="text-sm text-zinc-500">กำลังโหลดข้อกำหนด / Loading terms…</p>}
                </section>
                <Controller name="accept_terms" control={control} rules={{ required: 'กรุณายอมรับข้อกำหนด / Please accept the Terms of Service' }} render={({ field }) => <Checkbox id="accept-terms" checked={!!field.value} onChange={e => field.onChange(e.target.checked)} onBlur={field.onBlur} label="ฉันได้อ่านและยอมรับข้อกำหนดฉบับข้างต้น / I have read and accept the Terms of Service above" error={errors.accept_terms?.message} required name={field.name} />} />
                <Controller name="accept_pdpa" control={control} rules={{ required: 'กรุณายืนยันความยินยอมด้านข้อมูลส่วนบุคคล / Please confirm personal-data consent' }} render={({ field }) => <div><Checkbox id="accept-pdpa" checked={!!field.value} onChange={e => field.onChange(e.target.checked)} onBlur={field.onBlur} label="ฉันยินยอมให้ประมวลผลข้อมูลส่วนบุคคลตามประกาศความเป็นส่วนตัว / I consent to personal-data processing as described in the Privacy Notice" error={errors.accept_pdpa?.message} required name={field.name} /><a href="/privacy" target="_blank" rel="noopener noreferrer" class="ml-6 text-xs text-oasis-primary underline hover:no-underline">อ่านประกาศความเป็นส่วนตัว / Read privacy notice</a></div>} />
                <div class="flex gap-3 mt-4">
                  <Button variant="secondary" size="lg" type="button" onClick={handleBack} disabled={submitting}>กลับ</Button>
                  <Button variant="primary" size="lg" type="submit" loading={submitting} disabled={!canSubmit}>{submitting ? 'กำลังสร้างบัญชี...' : 'สร้างบัญชีผู้ใช้งาน'}</Button>
                </div>
              </> : null}
          </form>

          <p class="mt-8 text-center text-sm text-zinc-500">
            มีบัญชีอยู่แล้ว?{' '}
            <Button variant="link" size="sm" onClick={() => route('/login')}>เข้าสู่ระบบ</Button>
          </p>
        </div>
      </div>
    </div>;
};
