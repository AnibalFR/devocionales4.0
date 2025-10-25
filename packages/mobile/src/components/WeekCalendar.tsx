import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import type { Visita } from '../types/visita';
import CalendarVisitaCard from './CalendarVisitaCard';
import {
  getWeekDates,
  getDayAbbreviation,
  getDayNumber,
  isToday,
  parseDateString,
  isSameDay,
  formatDateString
} from '../utils/dateHelpers';
import { colors } from '../constants/colors';

const { width } = Dimensions.get('window');
const DAY_COLUMN_WIDTH = 120; // Columnas más anchas para swipe horizontal

interface WeekCalendarProps {
  visitas: Visita[];
  currentWeekStart: Date;
  onVisitPress: (visitaId: string) => void;
}

export default function WeekCalendar({ visitas, currentWeekStart, onVisitPress }: WeekCalendarProps) {
  // Get array of 7 dates for the week
  const weekDates = useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart]);

  // Group visitas by day
  const visitasByDay = useMemo(() => {
    const grouped: { [key: string]: Visita[] } = {};

    weekDates.forEach((date) => {
      const dateStr = formatDateString(date);
      grouped[dateStr] = [];
    });

    visitas.forEach((visita) => {
      const visitDate = parseDateString(visita.visitDate);
      const dateStr = formatDateString(visitDate);

      if (grouped[dateStr]) {
        grouped[dateStr].push(visita);
      }
    });

    // Sort visitas by time within each day
    Object.keys(grouped).forEach((dateStr) => {
      grouped[dateStr].sort((a, b) => {
        return a.visitTime.localeCompare(b.visitTime);
      });
    });

    return grouped;
  }, [visitas, weekDates]);

  return (
    <View style={styles.container}>
      {/* Week indicators */}
      <View style={styles.weekIndicators}>
        {weekDates.map((date, index) => {
          const today = isToday(date);
          return (
            <View
              key={index}
              style={[
                styles.dayIndicator,
                today && styles.todayIndicator
              ]}
            />
          );
        })}
      </View>

      {/* Horizontal scroll for days */}
      <ScrollView
        horizontal
        pagingEnabled={false}
        snapToInterval={DAY_COLUMN_WIDTH}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
        contentContainerStyle={styles.scrollContent}
      >
        {weekDates.map((date, index) => {
          const dayAbbr = getDayAbbreviation(date);
          const dayNum = getDayNumber(date);
          const today = isToday(date);
          const dateStr = formatDateString(date);
          const dayVisitas = visitasByDay[dateStr] || [];

          return (
            <View key={index} style={styles.dayColumn}>
              {/* Day header */}
              <View style={styles.dayHeaderInline}>
                <Text
                  variant="labelMedium"
                  style={[styles.dayName, today && styles.todayDayName]}
                >
                  {dayAbbr.slice(0, 2).toUpperCase()}
                </Text>
                <View style={[styles.dayNumberContainer, today && styles.todayDayNumberContainer]}>
                  <Text
                    variant="bodyLarge"
                    style={[styles.dayNumber, today && styles.todayDayNumber]}
                  >
                    {dayNum}
                  </Text>
                </View>
              </View>

              {/* Day content */}
              <ScrollView
                style={styles.dayContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={[styles.dayContentInner, today && styles.todayColumn]}>
                  {dayVisitas.length === 0 ? (
                    <View style={styles.emptyDay}>
                      <Text variant="bodySmall" style={styles.emptyDayText}>
                        —
                      </Text>
                    </View>
                  ) : (
                    dayVisitas.map((visita) => (
                      <CalendarVisitaCard
                        key={visita.id}
                        visita={visita}
                        onPress={() => onVisitPress(visita.id)}
                      />
                    ))
                  )}
                </View>
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  weekIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  dayIndicator: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray300,
  },
  todayIndicator: {
    backgroundColor: colors.primary,
    width: 28,
  },
  horizontalScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingRight: 20, // Peek del último día
  },
  dayColumn: {
    width: DAY_COLUMN_WIDTH,
  },
  dayHeaderInline: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: '#fff',
  },
  dayName: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  todayDayName: {
    color: colors.primary,
  },
  dayNumberContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayDayNumberContainer: {
    backgroundColor: colors.primary,
  },
  dayNumber: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  todayDayNumber: {
    color: '#fff',
    fontWeight: '700',
  },
  dayContent: {
    flex: 1,
  },
  dayContentInner: {
    padding: 8,
    minHeight: 400,
  },
  todayColumn: {
    backgroundColor: colors.gray50,
  },
  emptyDay: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyDayText: {
    color: colors.gray400,
    fontSize: 20,
  },
});
