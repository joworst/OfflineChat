import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = '@offlinechat_profile';

export async function getProfile() {
  try {
    const json = await AsyncStorage.getItem(PROFILE_KEY);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

export async function saveProfile(profile) {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

const avatarColors = ['#00BCD4', '#4CAF50', '#FF9800', '#9C27B0', '#E91E63', '#3F51B5', '#00D4FF', '#FF5722'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateDefaultProfile() {
  const num = Math.floor(1000 + Math.random() * 9000);
  const color = randomItem(avatarColors);
  return {
    pseudo: 'User' + num,
    color: color,
    avatar: color,
  };
}
