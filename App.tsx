import {StatusBar, useColorScheme} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {createNavigationContainerRef} from '@react-navigation/native';
import {AppProvider} from './src/utilities/AppContext';
import MainNavigator from './src/navigation/AppNavigator';
import {ToastProvider} from './src/utilities/ToastContext';
import {useAuthStore} from './src/store/useAuthStore';
import {useEffect} from 'react';

const navigationRef = createNavigationContainerRef();

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const bootstrap = useAuthStore(state => state.bootstrap);

  useEffect(() => {
    bootstrap();
  }, []);

  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <NavigationContainer ref={navigationRef}>
          <ToastProvider>
            <MainNavigator />
          </ToastProvider>
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}
