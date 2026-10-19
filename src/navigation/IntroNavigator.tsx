import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SplashScreenChaircareMobileScreen,
  Intro1YourChairAlwaysReadyChaircareMobileScreen,
  Intro2TrustedTechniciansChaircareMobileScreen,
  Intro3TrackYourServiceChaircareMobileScreen,
  Intro4OneAppEveryChairServiceChaircareMobileScreen,
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
          animation: 'slide_from_right',
        }}
        initialRouteName="Splash"
      >
        <Stack.Screen name="Splash" component={SplashScreenChaircareMobileScreen} />
        <Stack.Screen name="Intro1" component={Intro1YourChairAlwaysReadyChaircareMobileScreen} />
        <Stack.Screen name="Intro2" component={Intro2TrustedTechniciansChaircareMobileScreen} />
        <Stack.Screen name="Intro3" component={Intro3TrackYourServiceChaircareMobileScreen} />
        <Stack.Screen name="Intro4" component={Intro4OneAppEveryChairServiceChaircareMobileScreen} />
      </Stack.Navigator>
    </IntroContext.Provider>
  );
};
