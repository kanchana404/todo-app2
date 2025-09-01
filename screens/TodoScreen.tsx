import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoScreenProps {
  onLogout: () => void;
  navigation?: any;
}

export default function TodoScreen({ onLogout, navigation }: TodoScreenProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0,
    todayTasks: 0,
  });

  useEffect(() => {
    loadUserData();
    loadTodos();
  }, []);

  const loadUserData = async () => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      if (email) {
        setUserEmail(email);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadTodos = async () => {
    try {
      const savedTodos = await AsyncStorage.getItem('todos');
      if (savedTodos) {
        const todosArray = JSON.parse(savedTodos);
        setTodos(todosArray);
        calculateStats(todosArray);
        generateWeeklyData(todosArray);
      }
    } catch (error) {
      console.error('Error loading todos:', error);
    }
  };

  const calculateStats = (todosArray: Todo[]) => {
    const totalTasks = todosArray.length;
    const completedTasks = todosArray.filter(todo => todo.completed).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Calculate today's tasks (simplified)
    const today = new Date().toDateString();
    const todayTasks = todosArray.filter(todo => {
      const todoDate = new Date(parseInt(todo.id));
      return todoDate.toDateString() === today;
    }).length;

    setStats({
      totalTasks,
      completedTasks,
      completionRate,
      todayTasks,
    });
  };

  const generateWeeklyData = (todosArray: Todo[]) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    
    const weekData = days.map((day, index) => {
      // Calculate the date for this day of the week
      const dayDate = new Date(today);
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Monday start
      dayDate.setDate(today.getDate() + mondayOffset + index);
      
      // Filter tasks for this specific day
      const dayTasks = todosArray.filter(todo => {
        const todoDate = new Date(parseInt(todo.id));
        return todoDate.toDateString() === dayDate.toDateString();
      });
      
      const totalTasks = dayTasks.length;
      const completedTasks = dayTasks.filter(todo => todo.completed).length;
      
      return {
        day,
        completed: completedTasks,
        total: totalTasks,
        hasData: totalTasks > 0,
      };
    });

    setWeeklyData(weekData);
  };

  const saveTodos = async (newTodos: Todo[]) => {
    try {
      // Save locally first
      await AsyncStorage.setItem('todos', JSON.stringify(newTodos));
      
      // Sync with API
      await syncTodosWithAPI(newTodos);
    } catch (error) {
      console.error('Error saving todos:', error);
    }
  };

  const syncTodosWithAPI = async (todosArray: Todo[]) => {
    try {
      const userEmail = await AsyncStorage.getItem('userEmail');
      if (!userEmail) return;

      const syncData = {
        action: "saveTodos",
        userEmail: userEmail,
        todos: todosArray
      };

      const syncDataJson = JSON.stringify(syncData);
      console.log('Syncing todos with API:', syncDataJson);
      
      const response = await fetch("ttps://bf99a4731c09.ngrok-free.app/ReactNative_ToDo_App/CreateUser/ReactNative_ToDo_App", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: syncDataJson,
      });
      
      console.log('Sync response status:', response.status);

      if (response.ok) {
        const responseText = await response.text();
        console.log('Sync API Response:', responseText);
      } else {
        console.error('Failed to sync todos with API');
      }
    } catch (error) {
      console.error('Error syncing todos with API:', error);
    }
  };

  const addTodo = () => {
    if (inputText.trim()) {
      const newTodo: Todo = {
        id: Date.now().toString(),
        text: inputText.trim(),
        completed: false,
      };
          const newTodos = [...todos, newTodo];
    setTodos(newTodos);
    saveTodos(newTodos);
    calculateStats(newTodos);
    generateWeeklyData(newTodos);
    setInputText('');
    }
  };

  const toggleTodo = (id: string) => {
    const newTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(newTodos);
    saveTodos(newTodos);
    calculateStats(newTodos);
    generateWeeklyData(newTodos);
  };

  const deleteTodo = (id: string) => {
    const newTodos = todos.filter(todo => todo.id !== id);
    setTodos(newTodos);
    saveTodos(newTodos);
    calculateStats(newTodos);
    generateWeeklyData(newTodos);
  };



  const getBarHeight = (count: number) => {
    const maxHeight = 50;
    const maxTasks = 10; // Adjust based on your expected max tasks per day
    return Math.max((count / maxTasks) * maxHeight, count > 0 ? 8 : 0);
  };

  const renderTodo = ({ item }: { item: Todo }) => (
    <View style={styles.todoItem}>
      <TouchableOpacity
        style={styles.todoContent}
        onPress={() => toggleTodo(item.id)}
      >
        <View style={[styles.checkbox, item.completed && styles.checkboxCompleted]}>
          {item.completed && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={[styles.todoText, item.completed && styles.todoTextCompleted]}>
          {item.text}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteTodo(item.id)}
      >
        <Text style={styles.deleteButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Todos</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Add a new todo..."
          onSubmitEditing={addTodo}
        />
        <TouchableOpacity style={styles.addButton} onPress={addTodo}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsOverview}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.completedTasks}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, styles.rateNumber]}>{stats.completionRate}%</Text>
          <Text style={styles.statLabel}>Success Rate</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, styles.todayNumber]}>{stats.todayTasks}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
      </View>

      {/* Weekly Progress Chart */}
      {weeklyData.length > 0 && (
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Weekly Progress</Text>
            <TouchableOpacity onPress={() => navigation?.navigate?.('Progress')}>
              <Text style={styles.viewMoreText}>View More →</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.chartContainer}>
            <View style={styles.barsContainer}>
              {weeklyData.map((dayData, index) => (
                <View key={index} style={styles.barColumn}>
                  {dayData.hasData ? (
                    <View style={styles.barWrapper}>
                      {/* Total tasks bar (red) */}
                      <View
                        style={[
                          styles.totalBar,
                          {
                            height: getBarHeight(dayData.total),
                          },
                        ]}
                      />
                      {/* Completed tasks bar (green) */}
                      <View
                        style={[
                          styles.completedBar,
                          {
                            height: getBarHeight(dayData.completed),
                          },
                        ]}
                      />
                    </View>
                  ) : (
                    <View style={styles.barWrapper}>
                      <View style={styles.emptyBar} />
                    </View>
                  )}
                  <Text style={styles.dayLabel}>{dayData.day}</Text>
                  {dayData.hasData && (
                    <Text style={styles.taskCount}>
                      {dayData.completed}/{dayData.total}
                    </Text>
                  )}
                </View>
              ))}
            </View>
            
            {/* Legend */}
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#FF5722' }]} />
                <Text style={styles.legendText}>Total Tasks</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.legendText}>Completed</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <FlatList
        data={todos}
        renderItem={renderTodo}
        keyExtractor={item => item.id}
        style={styles.todoList}
        showsVerticalScrollIndicator={false}
      />

      {todos.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No todos yet!</Text>
          <Text style={styles.emptyStateSubtext}>Add your first todo above</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },

  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  todoList: {
    flex: 1,
    padding: 20,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  todoContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  todoText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  todoTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  deleteButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff4757',
    borderRadius: 15,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ccc',
  },
  statsOverview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  rateNumber: {
    color: '#4CAF50',
  },
  todayNumber: {
    color: '#FF9800',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  chartSection: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 10,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  viewMoreText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  chartContainer: {
    height: 140,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 80,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 60,
    marginBottom: 8,
    gap: 3,
  },
  totalBar: {
    width: 12,
    backgroundColor: '#FF5722',
    borderRadius: 2,
    minHeight: 0,
  },
  completedBar: {
    width: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 2,
    minHeight: 0,
  },
  emptyBar: {
    width: 12,
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
  },
  dayLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    marginBottom: 2,
  },
  taskCount: {
    fontSize: 9,
    color: '#999',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});
