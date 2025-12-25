import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { Card, Button, Input, Select } from '../components/UI';
import { api } from '../services/api';
import { Student, StudentLog } from '../types';
import MessagesPanel from '../components/MessagesPanel';

interface StudentPanelProps {
  student: Student;
  onLogout: () => void;
}

const StudentPanel: React.FC<StudentPanelProps> = ({ student, onLogout }) => {
  const [logs, setLogs] = useState<StudentLog[]>([]);
  const [form, setForm] = useState({ newMemorizing: '', review: '', listening: '', newTarget: '', notes: '' });
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  useEffect(() => { 
      const load = async () => {
          if(student.code) {
              const l = await api.getStudentLogs(student.code);
              setLogs(l);
          }
      }
      load();
  }, [student.code]);

  const handleSubmit = async () => {
    if (!form.newMemorizing || !form.review || !form.listening || !form.newTarget) return alert('أكمل البيانات');
    if (!student.code) return alert('خطأ في الكود');
    const now = new Date();
    const dayName = now.toLocaleDateString('ar-EG', { weekday: 'long' });
    const dateStr = now.toLocaleDateString('ar-EG');
    const rec = { 
        ...form, 
        studentCode: student.code,
        date: now.toISOString(), 
        dateDisplay: `${dayName}، ${dateStr}`
    };
    setLoading(true);
    await api.saveStudentLog(student.code, rec);
    setLoading(false);
    setLogs([rec as StudentLog, ...logs]);
    setForm({ newMemorizing: '', review: '', listening: '', newTarget: '', notes: '' });
    alert('تم الحفظ');
  };

  const handleChangePwd = async () => {
     if(newPwd.length<4) return alert('قصيرة');
     setLoading(true);
     await api.updateStudent({ ...student, password: newPwd });
     setLoading(false);
     setNewPwd(''); alert('تم التغيير'); onLogout();
  };

  return (
    <div className="pb-20">
      <Card className="mb-6 bg-gradient-to-r from-green-50 to-white flex justify-between items-center">
        <div><h2 className="text-2xl font-bold text-secondary">مرحباً {student.name}</h2><div className="text-sm text-gray-600">الكود: {student.code}</div></div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={()=>setShowMessages(true)} className="p-2 h-10 w-10 flex items-center justify-center text-xl">✉️</Button>
          <Button variant="secondary" onClick={()=>setShowChangePwd(true)} className="p-2 h-10 w-10 flex items-center justify-center text-xl">⚙️</Button>
        </div>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="تسجيل اليوميات">
          <Input label="📖 الحفظ الجديد" value={form.newMemorizing} onChange={e=>setForm({...form, newMemorizing:e.target.value})} />
          <Input label="🔄 المراجعة" value={form.review} onChange={e=>setForm({...form, review:e.target.value})} />
          <Select label="🎤 التسميع" value={form.listening} onChange={e=>setForm({...form, listening:e.target.value})}>
            <option value="">-- اختر --</option>
            <option value="نعم">نعم</option>
            <option value="لا">لا</option>
            <option value="جزئي">جزئي</option>
          </Select>
          <Input label="📍 الهدف القادم" value={form.newTarget} onChange={e=>setForm({...form, newTarget:e.target.value})} />
          <div className="mb-4">
            <label className="block mb-2 text-right text-gray-700 font-medium">ملاحظات</label>
            <textarea className="w-full border-2 border-gray-200 p-3 rounded-lg focus:outline-none focus:border-primary text-right h-24" value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} />
          </div>
          <Button fullWidth onClick={handleSubmit} disabled={loading}>{loading?'...':'حفظ'}</Button>
        </Card>
        <Card title="السجل السابق" className="max-h-[800px] flex flex-col">
           <div className="overflow-y-auto flex-1 custom-scrollbar space-y-4 pr-2">
              {logs.length===0 && <div className="text-center py-10 text-gray-400">لا يوجد سجلات</div>}
              {logs.map((log, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 border hover:border-green-200 transition-colors">
                  <div className="font-bold text-primary mb-2 border-b pb-1">📅 {log.dateDisplay}</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-bold text-gray-700">الحفظ:</span> {log.newMemorizing}</div>
                    <div><span className="font-bold text-gray-700">المراجعة:</span> {log.review}</div>
                    <div><span className="font-bold text-gray-700">التسميع:</span> {log.listening}</div>
                    <div><span className="font-bold text-gray-700">الهدف:</span> {log.newTarget}</div>
                  </div>
                  {log.notes && <div className="mt-2 text-xs bg-white p-2 border rounded text-gray-600">{log.notes}</div>}
                </div>
              ))}
           </div>
        </Card>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex justify-center z-50">
        <Button variant="danger" onClick={onLogout} className="px-8 flex gap-2 items-center"><LogOut className="w-4 h-4"/> خروج</Button>
      </div>
      {showChangePwd && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <Card title="تغيير كلمة السر">
            <Input label="الجديدة" type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} />
            <div className="flex gap-2 mt-4"><Button fullWidth variant="secondary" onClick={()=>setShowChangePwd(false)}>إلغاء</Button><Button fullWidth onClick={handleChangePwd} disabled={loading}>حفظ</Button></div>
          </Card>
        </div>
      )}
      {showMessages && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="my-auto">
            <MessagesPanel 
              userId={student.code || ''}
              userName={student.name}
              userRole="student"
              recipients={[{ id: 'admin', name: 'الإدارة', role: 'admin' }]}
              onClose={() => setShowMessages(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPanel;