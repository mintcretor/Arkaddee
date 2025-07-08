import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
  const { isSignedIn, isLoading } = useAuth();
  
  // ถ้ากำลังโหลดข้อมูล แสดงหน้าว่างหรือหน้า loading
  if (isLoading) {
    return null; // หรือ <LoadingScreen />
  }
  
  // เปลี่ยนเส้นทางตามสถานะการล็อกอิน
  if (isSignedIn) {
    return <Redirect href="/(tabs)/home" />;
  } else {
    return <Redirect href="/(auth)/login/login" />;
  }
}