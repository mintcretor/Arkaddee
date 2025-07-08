import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const OpeningHours = ({ openingHours }) => {
  const [expanded, setExpanded] = useState(false);
  const [isCurrentlyOpen, setIsCurrentlyOpen] = useState(false);
  const [statusText, setStatusText] = useState('');
  const rotateAnim = useState(new Animated.Value(0))[0];
  const heightAnim = useState(new Animated.Value(0))[0];
    const { t } = useTranslation();
  
  // Thai days of week
  const thaiDays = [t('store.monday'),t('store.tuesday'), t('store.wednesday'), t('store.thursday'), t('store.friday'), t('store.saturday'), t('store.sunday')];
  
  useEffect(() => {
    checkCurrentStatus();
    
    // Rotate animation when expanding/collapsing
    Animated.timing(rotateAnim, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true
    }).start();
    
    // Height animation for smooth expansion
    Animated.timing(heightAnim, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false
    }).start();
  }, [expanded, openingHours]);
  
  // Format time string from "HH:MM:SS" to "HH:MM"
  const formatTime = (timeString : any) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };
  
  // Check if the restaurant is currently open
  const checkCurrentStatus = () => {
    if (!openingHours || openingHours.length === 0) {
      setIsCurrentlyOpen(false);
      setStatusText(t('store.hours_information'));
      return;
    }
    
    const now = new Date();
    const dayOfWeek = now.getDay();
    // Convert JavaScript day (0=Sunday) to our format (0=Monday)
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const todayHours = openingHours.find(hour => hour.day_of_week === adjustedDay);
    
    if (!todayHours || !todayHours.is_open) {
      setIsCurrentlyOpen(false);
      setStatusText(t('store.closetoday'));
      return;
    }
    
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    // Parse opening hours
    const openTime = todayHours.open_time.split(':');
    const closeTime = todayHours.close_time.split(':');
    
    const openTimeInMinutes = parseInt(openTime[0]) * 60 + parseInt(openTime[1]);
    const closeTimeInMinutes = parseInt(closeTime[0]) * 60 + parseInt(closeTime[1]);
    
    // Check if current time is between open and close time
    if (currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes) {
      setIsCurrentlyOpen(true);
      setStatusText(`${t('store.openclosed')} ${formatTime(todayHours.close_time)} น.`);
    } else {
      setIsCurrentlyOpen(false);
      if (currentTimeInMinutes < openTimeInMinutes) {
        setStatusText(`${t('store.closedopen')} ${formatTime(todayHours.open_time)} น.`);
      } else {
        // Find next open day
        let nextOpenDay = null;
        for (let i = 1; i <= 7; i++) {
          const checkDay = (adjustedDay + i) % 7;
          const dayHours = openingHours.find(hour => hour.day_of_week === checkDay);
          if (dayHours && dayHours.is_open) {
            nextOpenDay = {
              day: thaiDays[checkDay],
              time: formatTime(dayHours.open_time)
            };
            break;
          }
        }
        
        if (nextOpenDay) {
          setStatusText(`${t('store.close')} - ${t('store.open')} ${nextOpenDay.day} ${nextOpenDay.time} น.`);
        } else {
          setStatusText(t('store.close'));
        }
      }
    }
  };
  
  // Group days with identical hours
  const getGroupedOpeningHours = () => {
    if (!openingHours || openingHours.length === 0) return [];
    
    const grouped = [];
    let currentGroup = {
      days: [openingHours[0].day_of_week],
      is_open: openingHours[0].is_open,
      open_time: openingHours[0].open_time,
      close_time: openingHours[0].close_time
    };
    
    for (let i = 1; i < openingHours.length; i++) {
      const current = openingHours[i];
      const previous = openingHours[i - 1];
      
      // Check if current day has the same hours as previous day
      if (
        current.is_open === previous.is_open &&
        current.open_time === previous.open_time &&
        current.close_time === previous.close_time
      ) {
        // Same hours, add to current group
        currentGroup.days.push(current.day_of_week);
      } else {
        // Different hours, push current group and start a new one
        grouped.push({...currentGroup});
        currentGroup = {
          days: [current.day_of_week],
          is_open: current.is_open,
          open_time: current.open_time,
          close_time: current.close_time
        };
      }
    }
    
    // Add the last group
    grouped.push(currentGroup);
    
    return grouped;
  };
  
  // Format day range (e.g., "จันทร์ - ศุกร์" or just "เสาร์")
  const formatDayRange = (days) => {
    if (days.length === 1) {
      return `${thaiDays[days[0]]}`;
    } else if (days.length === 7) {
      return 'ทุกวัน';
    } else {
      return `${thaiDays[days[0]]} - ${thaiDays[days[days.length - 1]]}`;
    }
  };
  
  // Calculate animation values
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });
  
  const maxHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200] // Adjust max height as needed
  });
  
  // Return component UI
  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusInfo}>
          <View style={[
            styles.statusIndicator,
            isCurrentlyOpen ? styles.openIndicator : styles.closedIndicator
          ]} />
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.expandText}>
            {expanded ? t('store.shrink') : t('store.check_opening_hours')}
          </Text>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="chevron-down" size={16} color="#4B74B3" />
          </Animated.View>
        </TouchableOpacity>
      </View>
      
      {/* Expandable Hours */}
      <Animated.View style={[styles.hoursContainer, { maxHeight }]}>
        {getGroupedOpeningHours().map((group, index) => (
          <View key={index} style={styles.hourRow}>
            <Text style={styles.dayText}>{formatDayRange(group.days)}</Text>
            {group.is_open ? (
              <Text style={styles.timeText}>
                {formatTime(group.open_time)} - {formatTime(group.close_time)} น.
              </Text>
            ) : (
              <Text style={styles.closedText}>{t('store.close')}</Text>
            )}
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  openIndicator: {
    backgroundColor: '#4CAF50',
  },
  closedIndicator: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f7ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  expandText: {
    fontSize: 14,
    color: '#4B74B3',
    marginRight: 4,
    fontWeight: '500',
  },
  hoursContainer: {
    overflow: 'hidden',
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  timeText: {
    fontSize: 14,
    color: '#333',
  },
  closedText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '500',
  }
});

export default OpeningHours;