import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    Share,
    Platform,
    StatusBar,
    Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BASEAPI_CONFIG } from '@/config';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

interface ArticleData {
    id: string | number;
    title: string;
    content: string;
    image_url: string;
    author: string;
    published_date: string;
    tags: string[];
    related_articles?: {
        id: string | number;
        title: string;
        image_url: string;
    }[];
}


// mockArticles array ที่มีอยู่เดิม...


const ArticlePage: React.FC = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { id } = params;
    const { t } = useTranslation();

    const mockArticles: ArticleData[] = [
        {
            id: 1,
            title: 'วิธีป้องกันตัวเองจาก PM2.5 ในชีวิตประจำวัน',
            content: `<p>ปัญหา PM2.5 เป็นปัญหาที่พบได้บ่อยในเมืองใหญ่ โดยเฉพาะในช่วงหน้าหนาวและหน้าแล้ง ซึ่งส่งผลกระทบต่อสุขภาพของประชาชนอย่างมาก</p>
    
    <h2>PM2.5 คืออะไร?</h2>
    <p>PM2.5 คือ ฝุ่นละอองขนาดเล็กที่มีเส้นผ่านศูนย์กลางไม่เกิน 2.5 ไมครอน สามารถแทรกซึมเข้าสู่ระบบทางเดินหายใจ และเข้าสู่กระแสเลือดได้</p>
    
    <h2>ผลกระทบต่อสุขภาพ</h2>
    <p>การได้รับ PM2.5 เป็นเวลานานอาจทำให้เกิดโรคระบบทางเดินหายใจ โรคหัวใจ และโรคอื่นๆ ในกลุ่มเสี่ยง เช่น เด็ก ผู้สูงอายุ และผู้ที่มีโรคประจำตัว อาจมีอาการรุนแรงได้</p>
    
    <h2>วิธีป้องกันตัวเอง</h2>
    <ol>
      <li>สวมหน้ากากป้องกันฝุ่น N95 หรือ KN95 เมื่อต้องออกนอกบ้าน</li>
      <li>ติดตามคุณภาพอากาศในพื้นที่ของคุณผ่านแอปพลิเคชัน "อากาศดี"</li>
      <li>หลีกเลี่ยงการออกกำลังกายกลางแจ้งในช่วงที่มีค่า PM2.5 สูง</li>
      <li>ใช้เครื่องฟอกอากาศที่มีประสิทธิภาพเมื่ออยู่ภายในบ้าน</li>
      <li>ปิดประตูหน้าต่างบ้านในช่วงที่มีค่า PM2.5 สูง</li>
      <li>ทำความสะอาดบ้านเป็นประจำ โดยใช้เครื่องดูดฝุ่นที่มีตัวกรอง HEPA</li>
    </ol>
    
    <h2>อาหารที่ช่วยลดผลกระทบจาก PM2.5</h2>
    <p>รับประทานอาหารที่อุดมไปด้วยสารต้านอนุมูลอิสระ เช่น ผักและผลไม้ที่มีวิตามิน C และ E สูง ได้แก่ ส้ม กีวี บร็อกโคลี ผักใบเขียว ช่วยเสริมภูมิคุ้มกันและลดการอักเสบในร่างกาย</p>
    
    <h2>พืชที่ช่วยกรองอากาศในบ้าน</h2>
    <p>ปลูกพืชฟอกอากาศในบ้าน เช่น เศรษฐีเรือนใน สเปธิฟิลลัม เดหลี ลิ้นมังกร ช่วยดูดซับสารพิษบางชนิดในอากาศและเพิ่มออกซิเจนในบ้าน</p>
    
    <p>การป้องกันตัวเองจาก PM2.5 อย่างถูกวิธีจะช่วยลดความเสี่ยงต่อสุขภาพในระยะยาว ติดตามข้อมูลคุณภาพอากาศในพื้นที่ของคุณได้ผ่านแอปพลิเคชัน "อากาศดี" ที่จะช่วยให้คุณวางแผนกิจกรรมในแต่ละวันได้อย่างปลอดภัย</p>`,
            image_url: `${BASEAPI_CONFIG.UrlImg}/uploads/articles/pm25-safety.jpg`,
            author: 'ทีมอากาศดี',
            published_date: '15 ธ.ค. 2023',
            tags: ['PM2.5', 'สุขภาพ', 'ฝุ่นละออง', 'เคล็ดความรู้'],
            related_articles: [
                {
                    id: 2,
                    title: 'ทำไมต้องใช้หน้ากาก N95 เมื่อค่า PM2.5 สูง',
                    image_url: `${BASEAPI_CONFIG.UrlImg}/uploads/articles/n95-mask.jpg`
                },
                {
                    id: 4,
                    title: 'ผลกระทบของ PM2.5 ต่อสุขภาพในระยะยาว',
                    image_url: `${BASEAPI_CONFIG.UrlImg}/uploads/articles/pm25-health-effects.png`
                },
                {
                    id: 3,
                    title: 'วิธีใช้เครื่องฟอกอากาศให้มีประสิทธิภาพสูงสุด',
                    image_url: `${BASEAPI_CONFIG.UrlImg}/uploads/articles/air-purifier-tips.png`
                }
            ]
        },
        {
            id: 2,
            title: 'ทำไมต้องใช้หน้ากาก N95 เมื่อค่า PM2.5 สูง',
            content: `<p>หน้ากาก N95 เป็นอุปกรณ์ป้องกันส่วนบุคคลที่ได้รับการแนะนำให้ใช้เมื่อค่า PM2.5 สูงเกินมาตรฐาน เนื่องจากมีประสิทธิภาพในการกรองอนุภาคขนาดเล็กได้ดี</p>
    
    <h2>หน้ากาก N95 คืออะไร?</h2>
    <p>หน้ากาก N95 เป็นหน้ากากที่ผ่านการรับรองจากสถาบัน NIOSH (National Institute for Occupational Safety and Health) ของสหรัฐอเมริกา ซึ่งสามารถกรองอนุภาคในอากาศได้อย่างน้อย 95% รวมถึงอนุภาค PM2.5</p>
    
    <h2>ทำไมต้องใช้หน้ากาก N95?</h2>
    <p>หน้ากากทั่วไปหรือหน้ากากอนามัยไม่สามารถป้องกันฝุ่น PM2.5 ได้อย่างมีประสิทธิภาพ เนื่องจากอนุภาคมีขนาดเล็กมากและสามารถผ่านเข้าไปได้ หน้ากาก N95 มีความสามารถในการกรองอนุภาคขนาดเล็กได้ดีกว่า</p>
    
    <h2>วิธีใช้หน้ากาก N95 อย่างถูกต้อง</h2>
    <ol>
      <li>ล้างมือให้สะอาดก่อนสวมหน้ากาก</li>
      <li>ตรวจสอบด้านหน้าและด้านหลังของหน้ากาก (ด้านที่มีลวดโลหะอยู่ด้านบน)</li>
      <li>สวมหน้ากากให้คลุมทั้งจมูกและปาก</li>
      <li>กดลวดโลหะให้แนบกับสันจมูก</li>
      <li>ตรวจสอบการรั่วของอากาศโดยหายใจเข้าและออกแรงๆ</li>
      <li>หากรู้สึกว่ามีอากาศรั่วรอบขอบหน้ากาก ให้ปรับหน้ากากใหม่</li>
    </ol>
    
    <h2>ระยะเวลาการใช้งาน</h2>
    <p>หน้ากาก N95 สามารถใช้งานได้ประมาณ 8-12 ชั่วโมง หรือจนกว่าจะรู้สึกว่าหายใจลำบาก ไม่ควรนำหน้ากากที่ใช้แล้วมาใช้ซ้ำ เพราะประสิทธิภาพในการกรองจะลดลง</p>
    
    <h2>ข้อควรระวัง</h2>
    <p>หน้ากาก N95 อาจทำให้หายใจลำบากสำหรับผู้ที่มีโรคเกี่ยวกับระบบทางเดินหายใจ ผู้สูงอายุ หรือเด็ก ควรปรึกษาแพทย์ก่อนใช้หากมีโรคประจำตัว</p>
    
    <p>การสวมหน้ากาก N95 เป็นเพียงวิธีหนึ่งในการป้องกันตัวเองจาก PM2.5 ควรใช้ร่วมกับวิธีการอื่นๆ เช่น การหลีกเลี่ยงการออกนอกบ้านในช่วงที่มีค่าฝุ่นสูง และการใช้เครื่องฟอกอากาศเมื่ออยู่ในบ้าน</p>`,
            image_url: `${BASEAPI_CONFIG.UrlImg}/uploads/articles/n95-mask.jpg`,
            author: 'ดร.สมชาย ใจดี',
            published_date: '10 ธ.ค. 2023',
            tags: ['N95', 'PM2.5', 'หน้ากาก', 'ป้องกัน'],
            related_articles: [
                {
                    id: 1,
                    title: 'วิธีป้องกันตัวเองจาก PM2.5 ในชีวิตประจำวัน',
                    image_url: `${BASEAPI_CONFIG.UrlImg}/uploads/articles/pm25-safety.jpg`
                },
                {
                    id: 4,
                    title: 'ผลกระทบของ PM2.5 ต่อสุขภาพในระยะยาว',
                    image_url: `${BASEAPI_CONFIG.UrlImg}/uploads/articles/pm25-health-effects.png`
                },
                {
                    id: 3,
                    title: 'วิธีใช้เครื่องฟอกอากาศให้มีประสิทธิภาพสูงสุด',
                    image_url: `${BASEAPI_CONFIG.UrlImg}/uploads/articles/air-purifier-tips.png`
                }
            ]
        },
        {
            id: 4,
            title: 'ผลกระทบของ PM2.5 ต่อสุขภาพในระยะยาว',
            content: `<p>มลพิษทางอากาศโดยเฉพาะ PM2.5 ไม่ได้ส่งผลกระทบต่อสุขภาพเพียงระยะสั้นเท่านั้น แต่ยังมีผลกระทบในระยะยาวที่น่ากังวล</p>
    
    <h2>PM2.5 คืออะไร?</h2>
    <p>PM2.5 คือ ฝุ่นละอองขนาดเล็กที่มีเส้นผ่านศูนย์กลางไม่เกิน 2.5 ไมครอน ซึ่งเล็กกว่าเส้นผมมนุษย์ประมาณ 25 เท่า สามารถลอยในอากาศได้นาน และแทรกซึมเข้าสู่ระบบทางเดินหายใจ รวมถึงเข้าสู่กระแสเลือดได้</p>
    
    <h2>ผลกระทบระยะสั้น</h2>
    <p>ในระยะสั้น การได้รับ PM2.5 อาจทำให้เกิดอาการแสบจมูก แสบตา ไอ หายใจลำบาก และระคายเคืองผิวหนัง โดยเฉพาะในกลุ่มเสี่ยง เช่น เด็ก ผู้สูงอายุ และผู้ที่มีโรคเกี่ยวกับระบบทางเดินหายใจอยู่แล้ว</p>
    
    <h2>ผลกระทบระยะยาว</h2>
    <ol>
      <li><strong>โรคระบบทางเดินหายใจ</strong>: การได้รับ PM2.5 เป็นเวลานานอาจทำให้เกิดโรคระบบทางเดินหายใจเรื้อรัง เช่น โรคหอบหืด โรคถุงลมโป่งพอง และโรคปอดอุดกั้นเรื้อรัง (COPD)</li>
      <li><strong>โรคหัวใจและหลอดเลือด</strong>: มีการศึกษาพบว่า PM2.5 เพิ่มความเสี่ยงของโรคหัวใจและหลอดเลือด เช่น โรคหัวใจขาดเลือด และโรคหลอดเลือดสมอง</li>
      <li><strong>ผลกระทบต่อระบบประสาท</strong>: การได้รับ PM2.5 อาจส่งผลต่อระบบประสาท เพิ่มความเสี่ยงของโรคสมองเสื่อม และโรคพาร์กินสัน</li>
      <li><strong>ผลกระทบต่อทารกในครรภ์</strong>: การได้รับ PM2.5 ระหว่างตั้งครรภ์อาจเพิ่มความเสี่ยงของการคลอดก่อนกำหนด ทารกน้ำหนักตัวน้อย และภาวะแทรกซ้อนอื่นๆ</li>
      <li><strong>ความเสี่ยงต่อการเกิดมะเร็ง</strong>: องค์การอนามัยโลก (WHO) ได้จัดให้มลพิษทางอากาศเป็นสารก่อมะเร็งในมนุษย์ โดยเฉพาะมะเร็งปอด</li>
      <li><strong>การเสียชีวิตก่อนเวลาอันควร</strong>: มีการประมาณการว่ามลพิษทางอากาศเป็นสาเหตุของการเสียชีวิตก่อนเวลาอันควรหลายล้านคนทั่วโลกในแต่ละปี</li>
    </ol>
    
    <h2>ปัจจัยที่เพิ่มความเสี่ยง</h2>
    <ul>
      <li>ระยะเวลาในการได้รับ PM2.5</li>
      <li>ความเข้มข้นของ PM2.5 ในอากาศ</li>
      <li>อายุ (เด็กและผู้สูงอายุมีความเสี่ยงสูง)</li>
      <li>โรคประจำตัว (โรคระบบทางเดินหายใจ โรคหัวใจ)</li>
      <li>พฤติกรรมการใช้ชีวิต (การออกกำลังกายกลางแจ้งในช่วงที่มีค่า PM2.5 สูง)</li>
    </ul>
    
    <h2>การป้องกันผลกระทบระยะยาว</h2>
    <p>การป้องกันที่ดีที่สุดคือการลดการได้รับ PM2.5 ให้น้อยที่สุด โดยการติดตามคุณภาพอากาศ หลีกเลี่ยงการออกนอกบ้านเมื่อค่า PM2.5 สูง ใช้เครื่องฟอกอากาศในบ้าน และสวมหน้ากาก N95 เมื่อจำเป็นต้องอยู่ในพื้นที่ที่มีมลพิษสูง</p>
    
    <p>การตระหนักถึงผลกระทบระยะยาวของ PM2.5 จะช่วยให้เราให้ความสำคัญกับการป้องกันตัวเองและครอบครัวจากมลพิษทางอากาศ และร่วมกันแก้ไขปัญหามลพิษทางอากาศในระยะยาว</p>`,
            image_url: `${BASEAPI_CONFIG.UrlImg}/uploads/articles/pm25-health-effects.png`,
            author: 'นพ.วิชัย สุขภาพดี',
            published_date: '25 พ.ย. 2023',
            tags: ['PM2.5', 'สุขภาพ', 'ผลกระทบระยะยาว', 'โรคเรื้อรัง'],
            related_articles: [
                {
                    id: 1,
                    title: 'วิธีป้องกันตัวเองจาก PM2.5 ในชีวิตประจำวัน',
                    image_url: `${BASEAPI_CONFIG.UrlImg}/uploads/articles/pm25-safety.jpg`
                },
                {
                    id: 2,
                    title: 'ทำไมต้องใช้หน้ากาก N95 เมื่อค่า PM2.5 สูง',
                    image_url: `${BASEAPI_CONFIG.UrlImg}/uploads/articles/n95-mask.jpg`
                },
                {
                    id: 3,
                    title: 'วิธีใช้เครื่องฟอกอากาศให้มีประสิทธิภาพสูงสุด',
                    image_url: `${BASEAPI_CONFIG.UrlImg}/uploads/articles/air-purifier-tips.png`
                }
            ]
        },
        {
            id: 3,
            title: 'วิธีใช้เครื่องฟอกอากาศให้มีประสิทธิภาพสูงสุด',
            content: `<p>เครื่องฟอกอากาศเป็นอุปกรณ์ที่ช่วยปรับปรุงคุณภาพอากาศภายในบ้าน โดยเฉพาะในช่วงที่มีค่า PM2.5 สูง แต่การใช้เครื่องฟอกอากาศอย่างถูกวิธีจะช่วยให้เครื่องทำงานได้อย่างมีประสิทธิภาพสูงสุด</p>
    
    <h2>เลือกเครื่องฟอกอากาศอย่างไรให้เหมาะกับบ้าน?</h2>
    <p>การเลือกเครื่องฟอกอากาศควรพิจารณาปัจจัยต่างๆ ดังนี้</p>
    <ul>
      <li><strong>ขนาดพื้นที่ห้อง</strong>: เลือกเครื่องที่เหมาะกับขนาดห้อง โดยดูจากค่า CADR (Clean Air Delivery Rate) ซึ่งบอกความสามารถในการกรองอากาศของเครื่อง</li>
      <li><strong>ประเภทของตัวกรอง</strong>: ควรมีตัวกรอง HEPA (High-Efficiency Particulate Air) ซึ่งสามารถกรองอนุภาคขนาดเล็กได้ถึง 0.3 ไมครอน รวมถึง PM2.5</li>
      <li><strong>ระดับเสียงรบกวน</strong>: เครื่องฟอกอากาศบางรุ่นอาจมีเสียงดังรบกวน โดยเฉพาะเมื่อใช้งานที่ความเร็วสูง</li>
      <li><strong>การบำรุงรักษา</strong>: พิจารณาค่าใช้จ่ายในการเปลี่ยนตัวกรองและความถี่ในการเปลี่ยน</li>
      <li><strong>คุณสมบัติพิเศษ</strong>: เช่น เซ็นเซอร์วัดคุณภาพอากาศ โหมดอัตโนมัติ การควบคุมผ่านสมาร์ทโฟน</li>
    </ul>
    
    <h2>การวางตำแหน่งเครื่องฟอกอากาศ</h2>
    <p>ตำแหน่งการวางเครื่องฟอกอากาศมีผลต่อประสิทธิภาพในการกรองอากาศ</p>
    <ul>
      <li>วางเครื่องในบริเวณที่มีการไหลเวียนของอากาศดี ไม่มีสิ่งกีดขวาง</li>
      <li>ควรวางให้ห่างจากผนังหรือเฟอร์นิเจอร์อย่างน้อย 30 ซม.</li>
      <li>หากมีเครื่องเดียว ควรวางในห้องที่ใช้เวลาอยู่นานที่สุด เช่น ห้องนอน</li>
      <li>วางให้ห่างจากแหล่งความร้อน เช่น เตาไฟ และอุปกรณ์ไฟฟ้าที่ปล่อยความร้อน</li>
      <li>ไม่ควรวางในห้องที่มีความชื้นสูง เช่น ห้องน้ำ เพราะอาจทำให้ตัวกรองเสียหายได้</li>
    </ul>
    
    <h2>การใช้งานเครื่องฟอกอากาศให้มีประสิทธิภาพ</h2>
    <ol>
      <li><strong>เปิดเครื่องตลอดเวลาในช่วงที่มีค่า PM2.5 สูง</strong>: ไม่ควรเปิดๆ ปิดๆ เพราะจะทำให้คุณภาพอากาศไม่สม่ำเสมอ</li>
      <li><strong>ปรับระดับความเร็วให้เหมาะสม</strong>: ใช้ความเร็วสูงเมื่อเพิ่งเปิดเครื่องหรือเมื่อค่า PM2.5 สูงมาก และลดลงเมื่อคุณภาพอากาศดีขึ้น</li>
      <li><strong>ปิดประตูหน้าต่าง</strong>: เพื่อให้เครื่องฟอกอากาศทำงานได้อย่างมีประสิทธิภาพ</li>
      <li><strong>หมั่นทำความสะอาดห้อง</strong>: เพื่อลดปริมาณฝุ่นในห้อง ทำให้เครื่องฟอกอากาศทำงานได้ดีขึ้น</li>
      <li><strong>ใช้โหมดอัตโนมัติ</strong>: หากเครื่องมีเซ็นเซอร์วัดคุณภาพอากาศ การใช้โหมดอัตโนมัติจะช่วยปรับระดับความเร็วให้เหมาะสมกับคุณภาพอากาศ</li>
    </ol>
    
    <h2>การบำรุงรักษาเครื่องฟอกอากาศ</h2>
    <ul>
      <li>ทำความสะอาดหรือเปลี่ยนตัวกรองตามระยะเวลาที่กำหนด</li>
      <li>เช็ดทำความสะอาดภายนอกเครื่องเป็นประจำเพื่อลดการสะสมของฝุ่น</li>
      <li>ตรวจสอบช่องดูดอากาศและช่องปล่อยอากาศให้ไม่มีสิ่งกีดขวาง</li>
      <li>หากเครื่องมีเซ็นเซอร์วัดคุณภาพอากาศ ให้ทำความสะอาดตามคำแนะนำของผู้ผลิต</li>
    </ul>
    
    <p>การใช้เครื่องฟอกอากาศอย่างถูกวิธีจะช่วยปรับปรุงคุณภาพอากาศภายในบ้าน ลดความเสี่ยงจากผลกระทบของ PM2.5 และช่วยยืดอายุการใช้งานของเครื่อง</p>`,
            image_url: `${BASEAPI_CONFIG.UrlImg}/uploads/articles/air-purifier-tips.png`,
            author: 'วิศวกร สะอาดดี',
            published_date: '20 พ.ย. 2023',
            tags: ['เครื่องฟอกอากาศ', 'HEPA', 'PM2.5', 'คุณภาพอากาศ'],
            related_articles: [
                {
                    id: 1,
                    title: 'วิธีป้องกันตัวเองจาก PM2.5 ในชีวิตประจำวัน',
                    image_url: `${BASEAPI_CONFIG.UrlImg}/uploads/articles/pm25-safety.jpg`
                },
                {
                    id: 2,
                    title: 'ทำไมต้องใช้หน้ากาก N95 เมื่อค่า PM2.5 สูง',
                    image_url: `${BASEAPI_CONFIG.UrlImg}/uploads/articles/n95-mask.jpg`
                },
                {
                    id: 4,
                    title: 'ผลกระทบของ PM2.5 ต่อสุขภาพในระยะยาว',
                    image_url: `${BASEAPI_CONFIG.UrlImg}/uploads/articles/pm25-health-effects.png`
                }
            ]
        }
    ];
    const [article, setArticle] = useState<ArticleData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // จำลองการเรียก API
        setTimeout(() => {
            try {
                const articleId = typeof id === 'string' ? parseInt(id) : id;
                const foundArticle = mockArticles.find(article => article.id == articleId);

                if (foundArticle) {
                    setArticle(foundArticle);
                    setError(null);
                } else {
                    setError('ไม่พบบทความที่คุณค้นหา');
                }
            } catch (err: any) {
                console.error('Error loading article:', err);
                setError('ไม่สามารถโหลดบทความได้: ' + (err.message || ''));
            } finally {
                setIsLoading(false);
            }
        }, 1000);
    }, [id]);

    const shareArticle = async () => {
        if (!article) return;

        try {
            await Share.share({
                message: `${article.title} - อ่านเพิ่มเติมที่แอป "Arkaddee"`,
                url: `airdeethailand://articles/${article.id}`,
                title: article.title,
            }, {
                dialogTitle: `แชร์บทความ ${article.title}`,
            });
        } catch (error) {
            console.error('Error sharing article:', error);
        }
    };

    const renderHTMLContent = (htmlContent: string) => {
        return (
            <Text style={styles.articleContent}>
                {htmlContent.replace(/<[^>]*>/g, '')}
            </Text>
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A6FA5" />
                <Text style={styles.loadingText}>{t('knowledge.Loading_article')}</Text>
            </SafeAreaView>
        );
    }

    if (error || !article) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <Text style={styles.errorText}>{error || t('knowledge.notfound')}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
                    <Text style={styles.retryButtonText}>{t('common.back')}</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Custom Header with Back Button */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <View style={styles.backButtonInner}>
                        <Ionicons name="chevron-back" size={24} color="#333" />
                        <Text style={styles.backButtonText}>{t('common.back')}</Text>
                    </View>
                </TouchableOpacity>


            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Article Header */}
                <View style={styles.articleHeader}>
                    <Text style={styles.articleTitle}>{article.title}</Text>
                    <View style={styles.articleMeta}>
                        <Text style={styles.articleAuthor}>{article.author}</Text>
                        <Text style={styles.articleDate}>{article.published_date}</Text>
                    </View>
                    <View style={styles.tagContainer}>
                        {article.tags.map((tag, index) => (
                            <View key={index} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Featured Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: article.image_url }}
                        style={styles.articleImage}
                        defaultSource={require('@/assets/images/logo.png')}
                    />
                </View>

                {/* Article Content */}
                <View style={styles.contentContainer}>
                    {renderHTMLContent(article.content)}
                </View>

                {/* Related Articles */}
                {article.related_articles && article.related_articles.length > 0 && (
                    <View style={styles.relatedContainer}>
                        <Text style={styles.relatedTitle}>{t('knowledge.Related')}</Text>
                        <View style={styles.relatedGrid}>
                            {article.related_articles.map((relatedArticle, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.relatedCard}
                                    onPress={() => router.push({
                                        pathname: '/articles/[id]',
                                        params: { id: relatedArticle.id }
                                    })}
                                >
                                    <View style={styles.relatedImageContainer}>
                                        <Image
                                            source={{ uri: relatedArticle.image_url }}
                                            style={styles.relatedImage}
                                            defaultSource={require('@/assets/images/logo.png')}
                                        />
                                    </View>
                                    <Text style={styles.relatedCardTitle} numberOfLines={2}>
                                        {relatedArticle.title}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Bottom Spacing */}
                <View style={styles.bottomSpacing} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        paddingVertical: 8,
        paddingLeft: 8,
        paddingRight: 12,
        borderRadius: 20,
    },
    backButtonText: {
        marginLeft: 4,
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    shareButton: {
        padding: 8,
    },
    actionButtonInner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    articleHeader: {
        padding: 16,
        paddingTop: 0,
    },
    articleTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    articleMeta: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    articleAuthor: {
        fontSize: 14,
        color: '#4A6FA5',
        fontWeight: '500',
        marginRight: 8,
    },
    articleDate: {
        fontSize: 14,
        color: '#888',
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    tag: {
        backgroundColor: '#EEF2F8',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
    },
    tagText: {
        color: '#4A6FA5',
        fontSize: 12,
        fontWeight: '500',
    },
    imageContainer: {
        width: '100%',
        height: 500,
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    articleImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    contentContainer: {
        padding: 16,
    },
    articleContent: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
    },
    relatedContainer: {
        padding: 16,
        backgroundColor: '#f9f9f9',
    },
    relatedTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    relatedGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    relatedCard: {
        width: '48%',
        marginBottom: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    relatedImageContainer: {
        width: '100%',
        height: 100,
    },
    relatedImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    relatedCardTitle: {
        fontSize: 14,
        fontWeight: '500',
        padding: 12,
        color: '#333',
    },
    bottomSpacing: {
        height: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 16,
        color: '#4A6FA5',
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
    },
    errorText: {
        color: '#F44336',
        marginBottom: 16,
        textAlign: 'center',
        fontSize: 16,
    },
    retryButton: {
        backgroundColor: '#4A6FA5',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default ArticlePage;

