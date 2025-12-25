import React from 'react';
import { Card, Button } from '../components/UI';

interface HomeProps {
  onNavigate: (view: string) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 animate-[fadeIn_0.5s_ease-out]">
      <div className="text-center mb-8">
        <p className="text-xl text-primary font-bold mb-6">السلام عليكم ورحمة الله وبركاته ☺️</p>
        <div className="space-y-2 text-gray-800 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
          <p>لَعَلَّ إِلهَ الْعَرْشِ يَا إِخْوَتِي يَقِي ... جَمَاعَتَنَا كُلَّ المَكاَرِهِ هُوَّلَا</p>
          <p>وَيَجْعَلُنَا مِمَّنْ يَكُونُ كِتاَبُهُ ... شَفِيعًا لَهُمْ إِذْ مَا نَسُوْهُ فَيمْحَلَا</p>
        </div>
      </div>
      <div className="w-full max-w-md">
        <Card className="animate-[slideUp_0.5s_ease-out]">
          <p className="text-center text-gray-800 mb-6 leading-relaxed">
            متابعة حضور وغياب الطلاب والمعلمين وإدارة شؤون المكتب <br/> بشكل رقمي لتسهيل الإدارة اليومية.
          </p>
          <div className="space-y-3">
            <Button fullWidth onClick={() => onNavigate('LOGIN_TEACHER')}>دخول المعلمين</Button>
            <Button fullWidth variant="purple" onClick={() => onNavigate('LOGIN_ADMIN')}>لوحة التحكم</Button>
            <Button fullWidth variant="pink" onClick={() => onNavigate('LOGIN_STUDENT')}>دخول الطالب</Button>
            <Button fullWidth variant="accent" onClick={() => onNavigate('REGISTER_STUDENT')}>تسجيل طالب جديد</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Home;