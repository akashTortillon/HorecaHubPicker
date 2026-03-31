import React, {useState, useEffect} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAuthStore} from '../store/useAuthStore';

// Screens
import MainTabs from './MainTab';
import LoginScreen from '../screens/LoginScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import WarehouseInventory from '../screens/WareHouseInventoryScreen';
import ReturnsListingScreen from '../screens/ReturnsListingScreen';
import ReturnDetailsScreen from '../screens/ReturnsDetailsScreen';
import WarehouseScannerScreen from '../screens/WarehouseScannerScreen';

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  OrderDetails: {orderId: string};
  WarehouseInventory: undefined;
  Returns: undefined;
  ReturnsDetail: {item: any};
  WarehouseScanner:{rmaId:any, rmaNumber:any};
};


const Stack = createNativeStackNavigator<RootStackParamList>();

const MainNavigator = () => {
  const token = useAuthStore(state => state.token);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate a splash/check delay or wait for your store hydration
    // If your store has a 'hasHydrated' property, use that instead of a timeout
    const checkToken = async () => {
      // Small delay to prevent flicker if the token is found instantly
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
    };

    checkToken();
  }, []);

  // --- SHOW LOADER ---
  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#C62828" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      key={token ? 'authenticated' : 'unauthenticated'}
      screenOptions={{headerShown: false}}>
      {token === null ? (
        <Stack.Screen name="Auth" component={LoginScreen} />
      ) : (
        <Stack.Group>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="OrderDetails"
            component={OrderDetailsScreen}
            options={{headerShown: true, title: 'Order Details'}}
          />
          <Stack.Screen
            name="WarehouseInventory"
            component={WarehouseInventory}
            options={{headerShown: true, title: 'Inventory'}}
          />

          <Stack.Screen
            name="Returns"
            component={ReturnsListingScreen}
            options={{headerShown: true, title: 'Returns Hub'}}
          />
          <Stack.Screen
            name="ReturnsDetail"
            component={ReturnDetailsScreen}
            options={{headerShown: false, title: 'Returns Hub'}}
          />
            <Stack.Screen
            name="WarehouseScanner"
            component={WarehouseScannerScreen}
            options={{headerShown: false, title: 'Returns Hub'}}
          />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
});

export default MainNavigator;
