import React, { useEffect, useContext, Suspense } from "react"; // Import React
import { StatusBar } from "expo-status-bar";
import { Provider, useDispatch, useSelector } from "react-redux";
import store from "./store"; // Đảm bảo import đúng store
import StackNavigator from "./navigation/StackNavigator";
import { ModalPortal } from "react-native-modals";
import { UserContext, UserType } from "./UserContext"; // Đảm bảo import đúng context
import AsyncStorage from "@react-native-async-storage/async-storage";
import jwt_decode from "jwt-decode";
import { setAuthState, setLoading } from "./redux/AuthReducer"; // Đảm bảo import đúng actions
import { ActivityIndicator, View, StyleSheet, Text } from "react-native";

// Wrapper component để cung cấp Redux và Context
function AppWrapper() {
  return (
    // Provider Redux phải bao ngoài cùng
    <Provider store={store}>
      {/* Context Provider bao trong Provider Redux */}
      <UserContext>
        <App />
      </UserContext>
    </Provider>
  );
}

// Component App chính
function App() {
  const dispatch = useDispatch();
  // Lấy state từ Redux
  const isLoadingAuth = useSelector((state) => state.auth.isLoading);
  // Lấy hàm cập nhật từ Context, đảm bảo contextValue tồn tại
  const contextValue = useContext(UserType);
  // Kiểm tra contextValue trước khi lấy hàm để tránh lỗi nếu context chưa sẵn sàng
  const setUserId =
    contextValue?.setUserId ||
    (() => console.warn("setUserId from context not ready"));
  const setUserRole =
    contextValue?.setUserRole ||
    (() => console.warn("setUserRole from context not ready"));

  useEffect(() => {
    const checkAuth = async () => {
      // Không cần log "App.js: Checking initial auth status..." nữa nếu quá nhiều log
      // Đặt loading trong Redux
      // !!! Quan trọng: Đảm bảo `dispatch` là một hàm hợp lệ
      if (typeof dispatch !== "function") {
        console.error("App.js useEffect: dispatch is not a function!");
        return; // Thoát sớm nếu dispatch không hợp lệ
      }
      if (typeof setLoading !== "function") {
        console.error("App.js useEffect: setLoading action is not a function!");
        // Không cần thoát, nhưng báo lỗi
      } else {
        dispatch(setLoading(true));
      }

      try {
        const token = await AsyncStorage.getItem("authToken");
        if (token) {
          try {
            const decoded = jwt_decode(token);
            // Check expiry here if needed
            // const isExpired = decoded.exp * 1000 < Date.now();
            // if (isExpired) throw new Error("Token expired");

            // console.log("App.js: Token found and decoded:", decoded);
            // Cập nhật Context và Redux
            // !!! Quan trọng: Đảm bảo `setUserId` và `setUserRole` là hàm hợp lệ
            if (typeof setUserId === "function") setUserId(decoded.userId);
            else console.error("setUserId is not a function");
            if (typeof setUserRole === "function") setUserRole(decoded.role);
            else console.error("setUserRole is not a function");
            if (typeof setAuthState === "function")
              dispatch(
                setAuthState({
                  token,
                  userId: decoded.userId,
                  userRole: decoded.role,
                })
              );
            else console.error("setAuthState action is not a function");
          } catch (decodeError) {
            console.error(
              "App.js: Invalid token found during initial check:",
              decodeError
            );
            await AsyncStorage.removeItem("authToken");
            // Reset state
            if (typeof setUserId === "function") setUserId("");
            if (typeof setUserRole === "function") setUserRole(null);
            if (typeof setAuthState === "function")
              dispatch(
                setAuthState({ token: null, userId: null, userRole: null })
              );
          }
        } else {
          // console.log("App.js: No token found initially.");
          // Reset state nếu không có token
          if (typeof setUserId === "function") setUserId("");
          if (typeof setUserRole === "function") setUserRole(null);
          if (typeof setAuthState === "function")
            dispatch(
              setAuthState({ token: null, userId: null, userRole: null })
            );
        }
      } catch (err) {
        console.error("App.js: Error checking auth status:", err);
        // Reset state khi có lỗi
        if (typeof setUserId === "function") setUserId("");
        if (typeof setUserRole === "function") setUserRole(null);
        if (typeof setAuthState === "function")
          dispatch(setAuthState({ token: null, userId: null, userRole: null }));
      } finally {
        // console.log("App.js: Finished auth check.");
        // Đảm bảo setLoading được gọi ngay cả khi có lỗi ở trên
        if (typeof setLoading === "function") dispatch(setLoading(false));
      }
    };

    checkAuth();
    // !!! Quan trọng: Đảm bảo các dependencies là ổn định. Nếu setUserId/setUserRole thay đổi liên tục
    // (không nên xảy ra với cách tạo context ở trên), nó có thể gây vòng lặp.
  }, [dispatch, setUserId, setUserRole]);

  // Hiển thị màn hình loading trong khi kiểm tra auth ban đầu
  if (isLoadingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00CED1" />
        <Text>Loading Application...</Text>
      </View>
    );
  }

  // Hiển thị Navigator chính sau khi kiểm tra auth xong
  return (
    <>
      <StatusBar style="dark" />
      {/* Suspense có thể cần thiết nếu bạn lazy load component, nhưng không bắt buộc ở đây */}
      {/* <Suspense fallback={<ActivityIndicator />}> */}
      <StackNavigator />
      {/* </Suspense> */}
      <ModalPortal />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
});

export default AppWrapper; // Export wrapper
