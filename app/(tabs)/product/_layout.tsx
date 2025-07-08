// app/(tabs)/product/_layout.tsx
import { Stack } from 'expo-router';

export default function ProductTabStackLayout() {
  return (
    <Stack>
      {/* หน้าจอเริ่มต้นของ Stack นี้ เมื่อเลือกแท็บ "สินค้า" */}
      {/* Path: app/(tabs)/product/index.tsx */}
      <Stack.Screen
        name="index"
        options={{
          title: 'Product List', // ชื่อ Header สำหรับหน้ารายการสินค้า
          headerShown: true, // แสดง Header
          headerStyle: { backgroundColor: '#2563EB' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      {/* หน้าจอรายละเอียดสินค้า */}
      {/* Path: app/(tabs)/product/detail.tsx */}
      <Stack.Screen
        name="detail" // ชื่อนี้ต้องตรงกับชื่อไฟล์ detail.tsx
        options={{
          title: 'Product Detail', // ชื่อ Header เริ่มต้น (สามารถเปลี่ยนได้จากในหน้า detail เอง)
          headerShown: true,
          headerBackTitleVisible: false, // ซ่อนข้อความ "Back" ข้างปุ่มย้อนกลับ
          headerStyle: { backgroundColor: '#2563EB' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      {/* ถ้ามีหน้าจออื่นๆ ที่ต้องการให้ Stack อยู่ในแท็บ Product สามารถเพิ่มได้ที่นี่ */}
    </Stack>
  );
}