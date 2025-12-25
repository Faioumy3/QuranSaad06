import React, { useState, useEffect } from 'react';
import { FileText, UserCheck, UserX, Download, Trash2, Eye, Users, Search, UserPlus } from 'lucide-react';
import { Card, Button, Input, Select, StatCard } from '../components/UI';
import { api } from '../services/api';
import { Teacher, Student, AttendanceRecord, StudentLog } from '../types';

interface AdminPanelProps {
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [teachers, setTeachers] = useState<Record<string, Teacher>>({});
  const [students, setStudents] = useState<Student[]>([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterTeacher, setFilterTeacher] = useState('');
  
  // States for forms
  const [newTeacher, setNewTeacher] = useState<Teacher>({ name: '', code: '', password: '', email: '', students: [] });
  const [newStudentData, setNewStudentData] = useState({ name: '', teacherCode: '', id: '' });
  
  const [pwdData, setPwdData] = useState({ old: '', new: '', confirm: '' });
  const [selectedStudentLogs, setSelectedStudentLogs] = useState<{student: Student, logs: StudentLog[]} | null>(null);
  const [loading, setLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  const refreshData = async () => {
    setLoading(true);
    const [attData, teachersData, studentsData] = await Promise.all([
      api.getAttendance(),
      api.getTeachers(),
      api.getStudents()
    ]);
    
    setRecords(attData);
    setTeachers(teachersData);

    // Merge logic: Combine registered students with students listed in teacher rosters
    const mergedStudentsMap = new Map<string, Student>();

    // 1. Add registered students (Priority)
    studentsData.forEach(s => mergedStudentsMap.set(s.id, s));

    // 2. Add students found in teacher rosters but not registered
    Object.values(teachersData).forEach(t => {
      t.students.forEach(s => {
        if (!mergedStudentsMap.has(s.id)) {
          mergedStudentsMap.set(s.id, {
            id: s.id,
            name: s.name,
            code: '---', // Indicator for roster-only student
            class: `قائمة: ${t.name}`,
            password: '', 
          });
        } else {
            // Update class/teacher info if existing
            const existing = mergedStudentsMap.get(s.id)!;
            if (!existing.class || existing.class === 'جديد') {
                existing.class = `قائمة: ${t.name}`;
                mergedStudentsMap.set(s.id, existing);
            }
        }
      });
    });

    setStudents(Array.from(mergedStudentsMap.values()));
    setLoading(false);
  };

  useEffect(() => { refreshData(); }, []);

  const filteredRecords = records.filter(r => {
    return (filterDate ? r.date === filterDate : true) && (filterTeacher ? r.teacherCode === filterTeacher : true);
  });

  // Sort records by date descending
  filteredRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const stats = {
    total: filteredRecords.length,
    present: filteredRecords.filter(r => r.status === 'present').length,
    absent: filteredRecords.filter(r => r.status === 'absent').length,
  };

  const filteredStudents = students.filter(s => 
     s.name.includes(studentSearch) || 
     (s.code && s.code.includes(studentSearch)) ||
     (s.id && s.id.includes(studentSearch))
  );

  const handleAddTeacher = async () => {
    if (!newTeacher.name || !newTeacher.code) return alert('أكمل البيانات');
    setLoading(true);
    await api.saveTeacher({ ...newTeacher, students: [] });
    setNewTeacher({ name: '', code: '', password: '', email: '', students: [] });
    await refreshData();
    alert('تم إضافة المعلم');
  };

  const handleAddStudentToTeacher = async () => {
    if(!newStudentData.name || !newStudentData.teacherCode) return alert('يرجى ملء الاسم واختيار المعلم');
    
    setLoading(true);
    const teacher = teachers[newStudentData.teacherCode];
    if(!teacher) { 
        setLoading(false); 
        return alert('المعلم غير موجود'); 
    }
    
    // Generate simple ID if not provided
    const studentId = newStudentData.id || Date.now().toString().slice(-8);
    
    // Check if ID exists in teacher's list
    if (teacher.students.some(s => s.id === studentId)) {
        setLoading(false);
        return alert('هذا المعرف موجود بالفعل لدى هذا المعلم');
    }

    const updatedTeacher = { 
        ...teacher, 
        students: [...teacher.students, { id: studentId, name: newStudentData.name }] 
    };
    
    await api.saveTeacher(updatedTeacher);
    await refreshData();
    setNewStudentData({ name: '', teacherCode: '', id: '' });
    setLoading(false);
    alert(`تم إضافة الطالب "${newStudentData.name}" إلى المعلم "${teacher.name}" بنجاح`);
  };

  const handleDeleteTeacher = async (code: string) => { if (confirm('هل أنت متأكد؟')) { setLoading(true); await api.deleteTeacher(code); await refreshData(); } };
  const handleDeleteStudent = async (id: string) => { 
      if(confirm('هل أنت متأكد من حذف الطالب؟ سيتم حذفه من سجلات المعلمين أيضاً.')) { 
          setLoading(true); 
          
          // 1. Delete from registered students if exists
          await api.deleteStudent(id); 

          // 2. Remove from all teachers
          const teachersList = Object.values(teachers);
          for (const t of teachersList) {
              if (t.students.some(s => s.id === id)) {
                  const updatedStudents = t.students.filter(s => s.id !== id);
                  await api.saveTeacher({ ...t, students: updatedStudents });
              }
          }

          await refreshData(); 
          setLoading(false);
      } 
  };

  const handleExportCSV = () => {
    let csv = '\uFEFFالتاريخ,المعلم,اسم الطالب,الحالة,الملاحظات\n';
    filteredRecords.forEach(r => {
      const teacherName = teachers[r.teacherCode]?.name || r.teacherCode;
      const status = r.status === 'present' ? 'حاضر' : 'غائب';
      csv += `${r.date},"${teacherName}","${r.studentName}","${status}","${(r.notes || '').replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `attendance_${filterDate}.csv`; link.click();
  };

  const handleExportStudentLogsCSV = async () => {
    setLoading(true);
    const allData = await api.exportData();
    setLoading(false);
    const studentsList = await api.getStudents();
    const studentMap = studentsList.reduce((acc, s: Student) => { if(s.code) acc[s.code] = s.name; return acc; }, {} as Record<string, string>);
    let csv = '\uFEFFالتاريخ,اسم الطالب,الكود,الحفظ الجديد,المراجعة,التسميع,الهدف,ملاحظات\n';
    Object.entries(allData.studentLogs).forEach(([code, logs]) => {
       const name = studentMap[code] || 'غير معروف';
       logs.forEach(log => {
          csv += `"${log.dateDisplay}","${name}","${code}","${(log.newMemorizing || '').replace(/"/g, '""')}","${(log.review || '').replace(/"/g, '""')}","${log.listening}","${(log.newTarget || '').replace(/"/g, '""')}","${(log.notes || '').replace(/"/g, '""')}"\n`;
       });
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `student_logs_${new Date().toISOString().split('T')[0]}.csv`; link.click();
  };

  const handleChangePassword = async () => {
    const currentPwd = await api.getAdminPassword();
    if (pwdData.old !== currentPwd) return alert('كلمة السر الحالية خطأ');
    if (pwdData.new.length < 4 || pwdData.new !== pwdData.confirm) return alert('خطأ في كلمة السر الجديدة');
    await api.setAdminPassword(pwdData.new);
    setPwdData({ old: '', new: '', confirm: '' });
    alert('تم التغيير بنجاح'); onLogout();
  };

  const viewStudentLogs = async (student: Student) => {
      if(!student.code || student.code === '---') return alert('هذا الطالب غير مسجل في التطبيق، لا يوجد سجلات إلكترونية.');
      setLoading(true);
      const logs = await api.getStudentLogs(student.code);
      setLoading(false);
      setSelectedStudentLogs({ student, logs });
  };

  return (
    <div className="pb-20">
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 flex flex-col justify-between items-center gap-4 text-center">
        <div className="flex flex-col items-center gap-2">
          <img src="/QuranSaad01/sheikh.jpg" alt="الشيخ سعد" className="w-16 h-16 rounded-full border-2 border-primary shadow" />
          <h2 className="text-2xl font-bold text-secondary">لوحة الإدارة</h2>
          <p className="text-primary mt-1">{new Date().toLocaleDateString('ar-EG')}</p>
        </div>
        {loading && <div className="text-accent font-bold">جاري التحميل...</div>}
        <Button variant="danger" onClick={onLogout}>خروج</Button>
      </div>
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {['dashboard','teachers','students','reports','settings'].map(tab => (
          <Button key={tab} variant={activeTab === tab ? 'primary' : 'secondary'} onClick={() => setActiveTab(tab)} className="text-sm px-3 capitalize">
            {tab === 'dashboard' ? 'الرئيسية' : tab === 'teachers' ? 'المعلمين' : tab === 'students' ? 'الطلاب' : tab === 'reports' ? 'التقارير' : 'الإعدادات'}
          </Button>
        ))}
      </div>
      {activeTab === 'dashboard' && (
        <>
          <Card className="mb-6">
            <div className="flex flex-col gap-4">
              <Input label="التاريخ" type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
              <Select label="المعلم" value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}>
                <option value="">الكل</option>
                {Object.values(teachers as Record<string, Teacher>).map((t: Teacher) => <option key={t.code} value={t.code}>{t.name}</option>)}
              </Select>
              <Button onClick={refreshData} fullWidth>تحديث</Button>
            </div>
          </Card>
          <div className="grid grid-cols-3 gap-2 mb-6">
            <StatCard label="السجلات" value={stats.total} icon={FileText} colorClass="text-blue-600" />
            <StatCard label="حاضر" value={stats.present} icon={UserCheck} colorClass="text-green-600" />
            <StatCard label="غائب" value={stats.absent} icon={UserX} colorClass="text-red-600" />
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-20">
              <h3 className="font-bold text-secondary mb-4 border-b pb-2">سجل الحضور ({filteredRecords.length})</h3>
              {filteredRecords.length === 0 ? (
                  <div className="text-center text-gray-400 py-6">لا توجد سجلات</div>
              ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                      {filteredRecords.map((r, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded-lg border flex flex-col gap-1">
                              <div className="flex justify-between items-center">
                                  <span className="font-bold text-gray-800">{r.studentName}</span>
                                  <span className={`text-xs px-2 py-1 rounded-full ${r.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                      {r.status === 'present' ? 'حاضر' : 'غائب'}
                                  </span>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500">
                                  <span>👨‍🏫 {teachers[r.teacherCode]?.name || r.teacherCode}</span>
                                  <span>📅 {r.date}</span>
                              </div>
                              {r.notes && <div className="text-xs bg-yellow-50 text-yellow-800 p-1 mt-1 rounded">{r.notes}</div>}
                          </div>
                      ))}
                  </div>
              )}
          </div>

          <div className="fixed bottom-14 left-0 right-0 p-4 flex justify-center z-30 pointer-events-none">
             <Button onClick={handleExportCSV} variant="accent" className="pointer-events-auto shadow-lg"><Download className="w-4 h-4 inline ml-2" /> تقرير الحضور (CSV)</Button>
          </div>
        </>
      )}
      {activeTab === 'teachers' && (
        <div className="space-y-6">
          <Card title="إضافة معلم">
            <Input label="الاسم" value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})} />
            <Input label="الكود" value={newTeacher.code} onChange={e => setNewTeacher({...newTeacher, code: e.target.value})} />
            <Input label="كلمة السر" type="password" value={newTeacher.password} onChange={e => setNewTeacher({...newTeacher, password: e.target.value})} />
            <Input label="البريد الإلكتروني (اختياري)" value={newTeacher.email || ''} onChange={e => setNewTeacher({...newTeacher, email: e.target.value})} />
            <Button fullWidth onClick={handleAddTeacher}>إضافة</Button>
          </Card>
          <Card title="المعلمين">
             <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
               {Object.values(teachers).map((t: Teacher) => (
                 <div key={t.code} className="p-4 border rounded-lg flex justify-between items-center bg-gray-50">
                   <div className="flex-1">
                       <div className="font-bold text-secondary text-lg">{t.name}</div>
                       <div className="flex flex-wrap gap-2 text-sm text-gray-600 mt-2">
                           <div className="bg-blue-50 text-blue-800 px-2 py-1 rounded border border-blue-100">الكود: {t.code}</div>
                           <div className="bg-green-50 text-green-800 px-2 py-1 rounded border border-green-100">كلمة السر: {t.password}</div>
                           {t.email && <div className="bg-gray-50 text-gray-700 px-2 py-1 rounded border">📧 {t.email}</div>}
                           <div className="bg-purple-50 text-purple-800 px-2 py-1 rounded border border-purple-100">👨‍🎓 طلاب: {t.students?.length || 0}</div>
                       </div>
                   </div>
                   <Button className="p-2 h-10 w-10 flex items-center justify-center shrink-0 mr-2" variant="danger" onClick={() => handleDeleteTeacher(t.code)}><Trash2 className="w-4 h-4" /></Button>
                 </div>
               ))}
             </div>
          </Card>
        </div>
      )}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <Card title="إضافة طالب وتسكين لمعلم">
            <Input 
                label="اسم الطالب" 
                value={newStudentData.name} 
                onChange={e => setNewStudentData({...newStudentData, name: e.target.value})} 
                placeholder="الاسم الثلاثي"
            />
            <Select 
                label="اختر المعلم" 
                value={newStudentData.teacherCode} 
                onChange={e => setNewStudentData({...newStudentData, teacherCode: e.target.value})}
            >
                <option value="">-- اختر المعلم --</option>
                {Object.values(teachers).map(t => (
                    <option key={t.code} value={t.code}>{t.name}</option>
                ))}
            </Select>
            <Input 
                label="رقم الهوية / المعرف (اختياري)" 
                value={newStudentData.id} 
                onChange={e => setNewStudentData({...newStudentData, id: e.target.value})} 
                placeholder="اتركه فارغاً للتوليد التلقائي"
            />
            <Button fullWidth onClick={handleAddStudentToTeacher} variant="accent" disabled={loading}>
                <UserPlus className="w-4 h-4 inline ml-2" />
                إضافة للقائمة
            </Button>
          </Card>

          <Card>
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
                      <Users className="w-5 h-5"/> كل الطلاب
                  </h2>
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">{students.length} طالب</span>
              </div>

              <div className="relative mb-6">
                  <input 
                    type="text" 
                    placeholder="بحث بالاسم أو الكود..." 
                    className="w-full p-3 pr-10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-right"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                  <Search className="w-5 h-5 text-gray-400 absolute top-3.5 right-3" />
              </div>

              {filteredStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">لا يوجد طلاب مطابقين</div>
              ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                     {filteredStudents.map(s => (
                       <div key={s.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 hover:border-primary/30 transition-all">
                         <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3 w-full">
                                <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold text-lg shrink-0">
                                    {s.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-gray-800">{s.name}</div>
                                    <div className="flex gap-2 text-xs text-gray-500 mt-1 flex-wrap items-center">
                                        <span className={`px-2 py-0.5 rounded border ${s.class?.includes('قائمة') ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-100'}`}>
                                            {s.class || 'غير محدد'}
                                        </span>
                                        <span className="bg-white px-2 py-0.5 rounded border">ID: {s.id}</span>
                                        {s.registrationDate && <span className="bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded border border-yellow-200">تاريخ: {new Date(s.registrationDate).toLocaleDateString('ar-EG')}</span>}
                                        {s.code !== '---' && (
                                             <>
                                                <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200">كود: {s.code}</span>
                                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">سر: {s.password}</span>
                                             </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <Button 
                              className="p-2 h-8 w-8 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white shrink-0" 
                              onClick={() => handleDeleteStudent(s.id)}
                              title="حذف الطالب من النظام بالكامل"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                         </div>
                         <Button fullWidth className="text-sm py-2" variant="primary" onClick={() => viewStudentLogs(s)} disabled={s.code === '---'}>
                              <Eye className="w-4 h-4 inline ml-1" /> سجل اليوميات
                         </Button>
                       </div>
                     ))}
                   </div>
              )}
          </Card>
        </div>
      )}
      {activeTab === 'reports' && (
        <Card title="التقارير">
          <div className="space-y-4">
            <Button onClick={handleExportStudentLogsCSV} variant="primary" fullWidth><Download className="ml-2 w-4 h-4" /> يوميات الطلاب (Excel)</Button>
            <div className="text-sm text-gray-500 text-center mt-2">بيانات التطبيق محفوظة سحابياً (Firebase).</div>
          </div>
        </Card>
      )}
      {activeTab === 'settings' && (
         <Card title="الإعدادات">
            <Input label="كلمة السر الحالية" type="password" value={pwdData.old} onChange={e => setPwdData({...pwdData, old: e.target.value})} />
            <Input label="الجديدة" type="password" value={pwdData.new} onChange={e => setPwdData({...pwdData, new: e.target.value})} />
            <Input label="تأكيد" type="password" value={pwdData.confirm} onChange={e => setPwdData({...pwdData, confirm: e.target.value})} />
            <Button onClick={handleChangePassword} variant="primary" fullWidth className="mt-2">حفظ</Button>
         </Card>
      )}
      {selectedStudentLogs && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[80vh] flex flex-col bg-white" title={`يوميات: ${selectedStudentLogs.student.name}`}>
             <div className="overflow-y-auto flex-1 custom-scrollbar p-1 space-y-3">
               {selectedStudentLogs.logs.length===0?<div className="text-center py-10">لا توجد يوميات</div>:selectedStudentLogs.logs.slice().reverse().map((log, idx)=>(
                 <div key={idx} className="bg-gray-50 p-3 rounded-xl border">
                    <div className="font-bold text-primary mb-2 border-b pb-1">📅 {log.dateDisplay}</div>
                    <div className="text-sm space-y-1">
                       <div><span className="text-gray-500">الحفظ:</span> {log.newMemorizing}</div>
                       <div><span className="text-gray-500">المراجعة:</span> {log.review}</div>
                       <div><span className="text-gray-500">الهدف:</span> {log.newTarget}</div>
                       {log.notes && <div className="text-xs text-yellow-700 bg-yellow-50 p-1 rounded mt-1">{log.notes}</div>}
                    </div>
                 </div>
               ))}
             </div>
             <Button fullWidth variant="secondary" onClick={() => setSelectedStudentLogs(null)} className="mt-4">إغلاق</Button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;