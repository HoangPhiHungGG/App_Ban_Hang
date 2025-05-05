import { registerRootComponent } from "expo";
import "react-native-gesture-handler";
import App from "./App"; // Assuming you create AppWrapper.js or modify App.js

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// import { registerRootComponent } from "expo";
// import "react-native-gesture-handler"; // Recommended for gesture handling (e.g., with react-navigation)

// // Make sure to import AppWrapper which includes the Redux Provider and Context
// import AppWrapper from "./AppWrapper"; // Assuming you create AppWrapper.js or modify App.js

// // registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// // It also ensures that whether you load the app in Expo Go or in a native build,
// // the environment is set up appropriately
// registerRootComponent(AppWrapper); // Register the wrapper component
