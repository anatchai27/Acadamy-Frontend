import { route } from 'preact-router';
import { useForm } from 'react-hook-form';
import { Button, Input, Textarea } from '../../components/ui';
import { showToast } from '../../components/ui';
import { useDesignTheme } from '../../hooks/useDesignTheme';
const emailRules = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const ContactPage = () => {
  const {
    designTheme
  } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';
  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: ''
    }
  });
  const onError = () => showToast('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง', 'error');
  const onSubmit = async () => showToast('ส่งข้อความเรียบร้อยแล้ว ทีมงานจะตอบกลับโดยเร็วที่สุด', 'success');
  return <div class={'min-h-screen ' + (isNeo ? 'bg-[#FAF3E0]' : 'bg-oasis-bg')}>
      <nav class={isNeo ? 'bg-white border-b-3 border-black' : 'bg-white/80 backdrop-blur-lg border-b border-zinc-200/60'}>
        <div class="container mx-auto px-6 py-4 flex items-center justify-between">
          <span class="flex items-center gap-2 text-xl font-semibold text-zinc-900 tracking-tight cursor-pointer" onClick={() => route('/')}>
            <span class={'w-6 h-6 inline-block ' + (isNeo ? 'bg-black border-2 border-black' : 'bg-oasis-primary rounded-full')} />TiwHub
          </span>
          <div class="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => route('/login')}>เข้าสู่ระบบ</Button>
            <Button variant="primary" size="sm" onClick={() => route('/register')}>ลงทะเบียน</Button>
          </div>
        </div>
      </nav>

      <div class="container mx-auto px-6 py-12">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <div>
            <h2 class={'text-2xl font-semibold tracking-tight mb-6 ' + (isNeo ? 'text-black' : 'text-zinc-900')}>ติดต่อทีมงาน TiwHub</h2>
            <div class="space-y-6">
              {[{
              label: 'เบอร์โทรศัพท์',
              value: '02-XXX-XXXX'
            }, {
              label: 'อีเมล Support',
              value: 'support@tiwhub.com'
            }, {
              label: 'วัน-เวลาทำการ',
              value: 'จันทร์ - ศุกร์: 09:00 - 18:00'
            }, {
              label: 'LINE OA',
              value: '@tiwhub'
            }].map(({
              label,
              value
            }) => <div key={label}><h3 class="text-sm font-semibold text-zinc-900 mb-1">{label}</h3><p class="text-zinc-500">{value}</p></div>)}
            </div>
          </div>

          <div class={'p-8 ' + (isNeo ? 'neo-card bg-white' : 'bg-white border border-zinc-200/80 rounded-2xl shadow-sm')}>
            <form onSubmit={handleSubmit(onSubmit, onError)} class="flex flex-col gap-5">
              <Input type="text" label="ชื่อของคุณ" id="contact-name" placeholder="กรอกชื่อของคุณ" error={errors.name?.message} {...register('name', {
              required: 'กรุณากรอกชื่อของคุณ',
              validate: v => v && v.trim().length > 0 || 'กรุณากรอกชื่อของคุณ'
            })} />
              <Input type="email" label="อีเมล" id="contact-email" placeholder="กรอกอีเมล" error={errors.email?.message} {...register('email', {
              required: 'กรุณากรอกรูปแบบอีเมลให้ถูกต้อง',
              validate: v => emailRules.test(v) || 'กรุณากรอกรูปแบบอีเมลให้ถูกต้อง'
            })} />
              <Input type="text" label="หัวข้อที่ต้องการติดต่อ" id="contact-subject" placeholder="เลือกหัวข้อ" error={errors.subject?.message} {...register('subject', {
              required: 'กรุณาเลือกหัวข้อที่ต้องการติดต่อ',
              validate: v => v && v.trim().length > 0 || 'กรุณาเลือกหัวข้อที่ต้องการติดต่อ'
            })} />
              <Textarea label="ข้อความ" id="contact-message" placeholder="รายละเอียดที่ต้องการติดต่อ" rows={4} error={errors.message?.message} {...register('message', {
              required: 'กรุณากรอกข้อความ',
              validate: v => v && v.trim().length > 0 || 'กรุณากรอกข้อความ'
            })} />
              <Button variant="primary" size="md" type="submit" loading={isSubmitting}>ส่งข้อความ</Button>
            </form>
          </div>
        </div>
      </div>
    </div>;
};