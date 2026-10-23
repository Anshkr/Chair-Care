import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SplashScreenChaircareMobileScreen,
} from '../screens/intro';
import { IntroContext, useIntro } from '../context/IntroContext';

export { useIntro };

const Stack = createNativeStackNavigator();

export const IntroNavigator: React.FC<{ onFinishIntro?: () => void }> = ({ onFinishIntro }) => {
  return (
    <IntroContext.Provider value={{ onFinishIntro }}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
        initialRouteName="Splash"
      >
        <Stack.Screen name="Splash" component={SplashScreenChaircareMobileScreen} />
      </Stack.Navigator>
    </IntroContext.Provider>
  );
};
