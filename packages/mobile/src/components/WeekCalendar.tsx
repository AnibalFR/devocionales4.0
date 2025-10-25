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
const DAY_COLUMN_WIDTH = width / 7;

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
      {/* Week days header */}
      <View style={styles.weekHeader}>
        {weekDates.map((date, index) => {
          const dayAbbr = getDayAbbreviation(date);
          const dayNum = getDayNumber(date);
          const today = isToday(date);

          return (
            <View key={index} style={styles.dayHeader}>
              <Text
                variant="labelSmall"
                style={[styles.dayName, today && styles.todayDayName]}
              >
                {dayAbbr.slice(0, 2).toUpperCase()}
              </Text>
              <View style={[styles.dayNumberContainer, today && styles.todayDayNumberContainer]}>
                <Text
                  variant="bodyMedium"
                  style={[styles.dayNumber, today && styles.todayDayNumber]}
                >
                  {dayNum}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Week content - visitas for each day */}
      <ScrollView
        style={styles.weekContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.daysContainer}>
          {weekDates.map((date, index) => {
            const dateStr = formatDateString(date);
            const dayVisitas = visitasByDay[dateStr] || [];
            const today = isToday(date);

            return (
              <View
                key={index}
                style={[
                  styles.dayColumn,
                  today && styles.todayColumn,
                  index < 6 && styles.dayColumnBorder
                ]}
              >
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
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  weekHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dayHeader: {
    width: DAY_COLUMN_WIDTH,
    alignItems: 'center',
    gap: 4,
  },
  dayName: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  todayDayName: {
    color: colors.primary,
  },
  dayNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  weekContent: {
    flex: 1,
  },
  daysContainer: {
    flexDirection: 'row',
    minHeight: 400,
  },
  dayColumn: {
    width: DAY_COLUMN_WIDTH,
    padding: 6,
    paddingTop: 12,
  },
  todayColumn: {
    backgroundColor: colors.gray50,
  },
  dayColumnBorder: {
    borderRightWidth: 1,
    borderRightColor: colors.gray200,
  },
  emptyDay: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyDayText: {
    color: colors.gray400,
    fontSize: 18,
  },
});
