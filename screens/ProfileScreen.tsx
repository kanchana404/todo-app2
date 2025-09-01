import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProfileScreenProps {
  navigation: any;
  onLogout: () => void;
}

interface UserStats {
  totalTasks: number;
  completedTasks: number;
  todayTasks: number;
  streak: number;
}

export default function ProfileScreen({ navigation, onLogout }: ProfileScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    totalTasks: 0,
    completedTasks: 0,
    todayTasks: 0,
    streak: 0,
  });

  useEffect(() => {
    loadUserData();
    loadUserStats();
  }, []);

  const loadUserData = async () => {
    try {
      const userName = await AsyncStorage.getItem('userName') || 'User';
      const userEmail = await AsyncStorage.getItem('userEmail') || '';
      const userBio = await AsyncStorage.getItem('userBio') || 'Productivity enthusiast';
      
      setName(userName);
      setEmail(userEmail);
      setBio(userBio);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      const todos = await AsyncStorage.getItem('todos');
      const todosArray = todos ? JSON.parse(todos) : [];
      
      const totalTasks = todosArray.length;
      const completedTasks = todosArray.filter((todo: any) => todo.completed).length;
      
      // Calculate today's tasks (simplified - in real app, you'd use proper date comparison)
      const todayTasks = todosArray.filter((todo: any) => {
        const todoDate = new Date(parseInt(todo.id));
        const today = new Date();
        return todoDate.toDateString() === today.toDateString();
      }).length;

      // Calculate streak (simplified - consecutive days with completed tasks)
      const streak = Math.floor(completedTasks / 5); // Simple calculation

      setStats({
        totalTasks,
        completedTasks,
        todayTasks,
        streak,
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const saveProfile = async () => {
    try {
      const profileData = {
        action: "saveProfile",
        name: name,
        email: email,
        bio: bio
      };

      const profileDataJson = JSON.stringify(profileData);
      console.log('Sending profile data:', profileDataJson);
      
      console.log('Making API request to:', "ttps://bf99a4731c09.ngrok-free.app/ReactNative_ToDo_App/CreateUser/ReactNative_ToDo_App");
      
      const response = await fetch("ttps://bf99a4731c09.ngrok-free.app/ReactNative_ToDo_App/CreateUser/ReactNative_ToDo_App", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: profileDataJson,
      });
      
      console.log('Profile update response status:', response.status);

      if (response.ok) {
        const responseText = await response.text();
        console.log('Profile API Response:', responseText);
        
        // Save locally after successful API call
        await AsyncStorage.setItem('userName', name);
        await AsyncStorage.setItem('userBio', bio);
        
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        const errorText = await response.text();
        console.error('Profile API Error Response:', errorText);
        Alert.alert('Error', `Failed to update profile. Status: ${response.status}\n${errorText}`);
      }
    } catch (error) {
      console.error('Network Error:', error);
      Alert.alert('Error', `Network error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check your internet connection and try again.`);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'isLoggedIn',
                'userEmail',
                'userName',
                'userBio',
              ]);
              onLogout();
            } catch (error) {
              console.error('Error during logout:', error);
            }
          },
        },
      ]
    );
  };

  const getCompletionPercentage = () => {
    if (stats.totalTasks === 0) return 0;
    return Math.round((stats.completedTasks / stats.totalTasks) * 100);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.placeholder} />
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(name)}</Text>
          </View>
          <View style={styles.onlineIndicator} />
        </View>

        {isEditing ? (
          <View style={styles.editForm}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Full Name"
            />
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Bio"
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{name}</Text>
            <Text style={styles.userEmail}>{email}</Text>
            <Text style={styles.userBio}>{bio}</Text>
          </View>
        )}
      </View>

      {/* Stats Cards */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Your Statistics</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalTasks}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, styles.completedStat]}>
              {stats.completedTasks}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, styles.todayStat]}>
              {stats.todayTasks}
            </Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, styles.streakStat]}>
              {stats.streak}
            </Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <Text style={styles.sectionTitle}>Overall Progress</Text>
        
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Task Completion</Text>
            <Text style={styles.progressPercentage}>
              {getCompletionPercentage()}%
            </Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${getCompletionPercentage()}%` },
              ]}
            />
          </View>
          
          <Text style={styles.progressText}>
            {stats.completedTasks} of {stats.totalTasks} tasks completed
          </Text>
        </View>
      </View>

      {/* Achievement Section */}
      <View style={styles.achievementSection}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        
        <View style={styles.achievementCard}>
          <Text style={styles.achievementIcon}>🏆</Text>
          <View style={styles.achievementContent}>
            <Text style={styles.achievementTitle}>Task Master</Text>
            <Text style={styles.achievementDescription}>
              Completed {stats.completedTasks} tasks
            </Text>
          </View>
        </View>
        
        <View style={styles.achievementCard}>
          <Text style={styles.achievementIcon}>🔥</Text>
          <View style={styles.achievementContent}>
            <Text style={styles.achievementTitle}>On Fire</Text>
            <Text style={styles.achievementDescription}>
              {stats.streak} day productivity streak
            </Text>
          </View>
        </View>
        
        <View style={styles.achievementCard}>
          <Text style={styles.achievementIcon}>⭐</Text>
          <View style={styles.achievementContent}>
            <Text style={styles.achievementTitle}>Getting Started</Text>
            <Text style={styles.achievementDescription}>
              Created your first todo list
            </Text>
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
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
  placeholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#007AFF',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  profileSection: {
    backgroundColor: '#fff',
    padding: 30,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  userBio: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  editForm: {
    width: '100%',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 15,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  completedStat: {
    color: '#4CAF50',
  },
  todayStat: {
    color: '#FF9800',
  },
  streakStat: {
    color: '#FF5722',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  progressSection: {
    padding: 20,
  },
  progressCard: {
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  achievementSection: {
    padding: 20,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementIcon: {
    fontSize: 30,
    marginRight: 15,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#FF5722',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
