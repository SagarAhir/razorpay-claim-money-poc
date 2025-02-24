import { Alert, Platform } from "react-native";

export const showAlert = (
  title: string,
  message: string,
  onPress?: () => void
) => {
  if (Platform.OS === "web") {
    window.alert(`${title}: ${message}`);
    if (onPress) onPress();
  } else {
    Alert.alert(title, message, [{ text: "OK", onPress }]);
  }
};
