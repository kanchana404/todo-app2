import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface ProgressScreenProps {
  navigation: any;
}

interface DayData {
  day: string;
  completed: number;
  total: number;
}

interface WeeklyStats {
  thisWeek: number;
  lastWeek: number;
  change: number;
}

export default function ProgressScreen({ navigation }: ProgressScreenProps) {
  const [weeklyData, setWeeklyData] = useState<DayData[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    thisWeek: 0,
    lastWeek: 0,
    change: 0,
  });
  const [totalStats, setTotalStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0,
    averageDaily: 0,
  });

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      const todos = await AsyncStorage.getItem('todos');
      const todosArray = todos ? JSON.parse(todos) : [];
      
      // Calculate total stats
      const totalTasks = todosArray.length;
      const completedTasks = todosArray.filter((todo: any) => todo.completed).length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const averageDaily = Math.round(completedTasks / 7); // Simple calculation

      setTotalStats({
        totalTasks,
        completedTasks,
        completionRate,
        averageDaily,
      });

      // Generate weekly data (simplified - in real app, you'd use actual dates)
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weekData = days.map((day, index) => ({
        day,
        completed: Math.floor(Math.random() * 8) + 2, // Mock data
        total: Math.floor(Math.random() * 5) + 8,
      }));

      setWeeklyData(weekData);

      // Calculate weekly stats
      const thisWeekCompleted = weekData.reduce((sum, day) => sum + day.completed, 0);
      const lastWeekCompleted = thisWeekCompleted - Math.floor(Math.random() * 10) + 5; // Mock
      const change = thisWeekCompleted - lastWeekCompleted;

      setWeeklyStats({
        thisWeek: thisWeekCompleted,
        lastWeek: lastWeekCompleted,
        change,
      });

    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };

  const getBarHeight = (completed: number, total: number) => {
    const maxHeight = 120;
    const percentage = total > 0 ? completed / total : 0;
    return Math.max(percentage * maxHeight, 10);
  };

  const getBarColor = (completed: number, total: number) => {
    const percentage = total > 0 ? completed / total : 0;
    if (percentage >= 0.8) return '#4CAF50';
    if (percentage >= 0.6) return '#FF9800';
    return '#FF5722';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.placeholder} />
        <Text style={styles.headerTitle}>Progress</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Overview Cards */}
      <View style={styles.overviewSection}>
        <Text style={styles.sectionTitle}>Overview</Text>
        
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewNumber}>{totalStats.completedTasks}</Text>
            <Text style={styles.overviewLabel}>Completed</Text>
            <Text style={styles.overviewSubtext}>tasks done</Text>
          </View>
          
          <View style={styles.overviewCard}>
            <Text style={[styles.overviewNumber, styles.rateNumber]}>
              {totalStats.completionRate}%
            </Text>
            <Text style={styles.overviewLabel}>Success Rate</Text>
            <Text style={styles.overviewSubtext}>completion</Text>
          </View>
          
          <View style={styles.overviewCard}>
            <Text style={[styles.overviewNumber, styles.avgNumber]}>
              {totalStats.averageDaily}
            </Text>
            <Text style={styles.overviewLabel}>Daily Average</Text>
            <Text style={styles.overviewSubtext}>per day</Text>
          </View>
        </View>
      </View>

      {/* Weekly Progress Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Weekly Progress</Text>
        
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>This Week</Text>
              <Text style={styles.chartSubtitle}>
                {weeklyStats.thisWeek} tasks completed
              </Text>
            </View>
            <View style={styles.changeIndicator}>
              <Text style={[
                styles.changeText,
                weeklyStats.change >= 0 ? styles.positiveChange : styles.negativeChange
              ]}>
                {weeklyStats.change >= 0 ? '+' : ''}{weeklyStats.change}
              </Text>
              <Text style={styles.changeLabel}>vs last week</Text>
            </View>
          </View>

          {/* Bar Chart */}
          <View style={styles.chartContainer}>
            <View style={styles.barsContainer}>
              {weeklyData.map((dayData, index) => (
                <View key={index} style={styles.barColumn}>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: getBarHeight(dayData.completed, dayData.total),
                          backgroundColor: getBarColor(dayData.completed, dayData.total),
                        },
                      ]}
                    />
                    <View style={[styles.barBackground, { height: 120 }]} />
                  </View>
                  <Text style={styles.dayLabel}>{dayData.day}</Text>
                  <Text style={styles.dayValue}>
                    {dayData.completed}/{dayData.total}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>Excellent (80%+)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
              <Text style={styles.legendText}>Good (60%+)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#FF5722' }]} />
              <Text style={styles.legendText}>Needs Improvement</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Insights Section */}
      <View style={styles.insightsSection}>
        <Text style={styles.sectionTitle}>Insights</Text>
        
        <View style={styles.insightCard}>
          <Text style={styles.insightIcon}>📊</Text>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Productivity Trend</Text>
            <Text style={styles.insightText}>
              {weeklyStats.change >= 0 
                ? `You're on a roll! ${weeklyStats.change} more tasks completed than last week.`
                : `Room for improvement. Try to complete ${Math.abs(weeklyStats.change)} more tasks this week.`
              }
            </Text>
          </View>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightIcon}>🎯</Text>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Best Performance</Text>
            <Text style={styles.insightText}>
              Your best day this week was {
                weeklyData.length > 0 
                  ? weeklyData.reduce((best, current) => 
                      (current.completed / current.total) > (best.completed / best.total) ? current : best
                    ).day
                  : 'Monday'
              } with {
                weeklyData.length > 0
                  ? Math.round((weeklyData.reduce((best, current) => 
                      (current.completed / current.total) > (best.completed / best.total) ? current : best
                    ).completed / weeklyData.reduce((best, current) => 
                      (current.completed / current.total) > (best.completed / best.total) ? current : best
                    ).total) * 100)
                  : 100
              }% completion rate.
            </Text>
          </View>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightIcon}>💡</Text>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Recommendation</Text>
            <Text style={styles.insightText}>
              {totalStats.completionRate >= 80 
                ? "Great job! Consider setting more challenging goals to keep growing."
                : totalStats.completionRate >= 60
                  ? "You're doing well! Try breaking larger tasks into smaller ones."
                  : "Focus on completing fewer tasks but doing them consistently."
              }
            </Text>
          </View>
        </View>
      </View>

      {/* Goals Section */}
      <View style={styles.goalsSection}>
        <Text style={styles.sectionTitle}>Weekly Goals</Text>
        
        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>Complete 50 Tasks</Text>
            <Text style={styles.goalProgress}>
              {weeklyStats.thisWeek}/50
            </Text>
          </View>
          <View style={styles.goalBarContainer}>
            <View
              style={[
                styles.goalBar,
                { width: `${Math.min((weeklyStats.thisWeek / 50) * 100, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.goalText}>
            {50 - weeklyStats.thisWeek > 0 
              ? `${50 - weeklyStats.thisWeek} more to reach your goal!`
              : 'Goal achieved! 🎉'
            }
          </Text>
        </View>

        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>80% Completion Rate</Text>
            <Text style={styles.goalProgress}>
              {totalStats.completionRate}%
            </Text>
          </View>
          <View style={styles.goalBarContainer}>
            <View
              style={[
                styles.goalBar,
                { width: `${Math.min(totalStats.completionRate, 100)}%` },
                totalStats.completionRate >= 80 && styles.goalAchieved,
              ]}
            />
          </View>
          <Text style={styles.goalText}>
            {totalStats.completionRate >= 80
              ? 'Excellent completion rate! 🌟'
              : `${80 - totalStats.completionRate}% more to reach your goal!`
            }
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  overviewSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  overviewNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  rateNumber: {
    color: '#4CAF50',
  },
  avgNumber: {
    color: '#FF9800',
  },
  overviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  overviewSubtext: {
    fontSize: 12,
    color: '#666',
  },
  chartSection: {
    padding: 20,
  },
  chartCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  changeIndicator: {
    alignItems: 'flex-end',
  },
  changeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positiveChange: {
    color: '#4CAF50',
  },
  negativeChange: {
    color: '#FF5722',
  },
  changeLabel: {
    fontSize: 12,
    color: '#666',
  },
  chartContainer: {
    marginBottom: 20,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingHorizontal: 10,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 30,
    height: 120,
    marginBottom: 10,
  },
  bar: {
    width: 30,
    borderRadius: 4,
    position: 'absolute',
    bottom: 0,
  },
  barBackground: {
    width: 30,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    position: 'absolute',
    bottom: 0,
  },
  dayLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 2,
  },
  dayValue: {
    fontSize: 10,
    color: '#999',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  insightsSection: {
    padding: 20,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  insightIcon: {
    fontSize: 24,
    marginRight: 15,
    marginTop: 2,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  insightText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  goalsSection: {
    padding: 20,
    paddingBottom: 40,
  },
  goalCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  goalProgress: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  goalBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 10,
  },
  goalBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  goalAchieved: {
    backgroundColor: '#4CAF50',
  },
  goalText: {
    fontSize: 14,
    color: '#666',
  },
});
