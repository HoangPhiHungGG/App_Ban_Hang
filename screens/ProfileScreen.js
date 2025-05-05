import React, {
  useLayoutEffect,
  useEffect,
  useContext,
  useState,
  useCallback,
} from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserType } from "../UserContext";

const ProfileScreen = () => {
  const { userId, setUserId } = useContext(UserType);
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const userRole = user?.role || "user"; // Lấy role từ user, mặc định là 'user'

  // Thiết lập header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "",
      headerStyle: {
        backgroundColor: "#00CED1",
      },
      headerLeft: () => (
        <Image
          style={{ width: 140, height: 120, resizeMode: "contain" }}
          source={{
            uri: "https://assets.stickpng.com/thumbs/580b57fcd9996e24bc43c518.png",
          }}
        />
      ),
      headerRight: () => (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginRight: 12,
          }}
        >
          <Ionicons name="notifications-outline" size={24} color="black" />
          <AntDesign name="search1" size={24} color="black" />
        </View>
      ),
    });
  }, [navigation]);

  // Fetch thông tin profile
  const fetchUserProfile = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token || !userId) {
        throw new Error("Please log in to view your profile.");
      }
      const response = await axios.get(
        `http://localhost:8000/profile/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const { user } = response.data;
      setUser(user);
      setError(null);
    } catch (err) {
      console.error(
        "Error fetching profile:",
        err.response?.data || err.message
      );
      setError(
        err.response?.data?.message ||
          "Could not load profile. Please try again."
      );
      setUser(null);
    } finally {
      setFetchingData(false);
      setLoading(false);
    }
  }, [userId]);

  // Fetch lịch sử đặt vé
  const fetchOrders = useCallback(async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/bookings/user/${userId}`
      );
      const bookings = response.data;
      setOrders(bookings);
    } catch (error) {
      console.error(
        "Error fetching bookings:",
        error.response?.data || error.message
      );
    }
  }, [userId]);

  // Chạy fetch khi component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchUserProfile(), fetchOrders()]);
      setLoading(false);
    };
    fetchData();
  }, [fetchUserProfile, fetchOrders]);

  // Xử lý refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchUserProfile(), fetchOrders()]);
    setRefreshing(false);
  }, [fetchUserProfile, fetchOrders]);

  // Xử lý logout
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      setUserId(null);
      setUser(null);
      setOrders([]);
      console.log("Logged out successfully");
      navigation.replace("Login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Điều hướng
  const navigateToBookingHistory = () => navigation.navigate("BookingHistory");
  const navigateToAdmin = () => {
    if (userRole === "admin") navigation.navigate("AdminDashboard");
  };
  const navigateToAccountSettings = () =>
    navigation.navigate("AccountSettings");
  const handleBuyAgain = () => navigation.navigate("BuyAgain");

  // Component nút bấm
  const ProfileButton = ({
    title,
    onPress,
    iconName,
    iconType = Ionicons,
    buttonStyle,
    textStyle,
    iconColor = "#495057",
  }) => {
    const Icon = iconType;
    return (
      <Pressable style={[styles.profileButton, buttonStyle]} onPress={onPress}>
        <Icon
          name={iconName}
          size={24}
          color={iconColor}
          style={styles.buttonIcon}
        />
        <Text style={[styles.buttonText, textStyle]}>{title}</Text>
        <Ionicons name="chevron-forward" size={20} style={styles.chevron} />
      </Pressable>
    );
  };

  // Render nội dung
  const renderContent = () => {
    if (loading && !refreshing && !user) {
      return (
        <ActivityIndicator size="large" color="#00CED1" style={styles.loader} />
      );
    }
    if (error && !user) {
      return (
        <View style={styles.centeredMessageContainer}>
          <Ionicons
            name="cloud-offline-outline"
            size={50}
            color="#dc3545"
            style={{ marginBottom: 10 }}
          />
          <Text style={styles.errorText}>{error}</Text>
          {error.includes("log in") && (
            <Pressable
              style={styles.loginButton}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.loginButtonText}>Go to Login</Text>
            </Pressable>
          )}
        </View>
      );
    }
    if (user) {
      return (
        <>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person-circle" size={100} color="#008E97" />
            </View>
            <Text style={styles.welcomeText}>{user.name || "User"}</Text>
            <Text style={styles.emailText}>{user.email || "No email"}</Text>
            {userRole === "admin" && (
              <View style={styles.roleBadge}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={14}
                  color="#007bff"
                />
                <Text style={styles.roleText}>Administrator</Text>
              </View>
            )}
          </View>

          {/* Nút bấm */}
          <View style={styles.buttonContainer}>
            <ProfileButton
              title="My Bookings"
              onPress={navigateToBookingHistory}
              iconName="receipt-outline"
            />
            <ProfileButton
              title="Account Settings"
              onPress={navigateToAccountSettings}
              iconName="settings-outline"
            />
            <ProfileButton
              title="Buy Again"
              onPress={handleBuyAgain}
              iconName="cart-outline"
            />
            {userRole === "admin" && (
              <ProfileButton
                title="Admin Panel"
                onPress={navigateToAdmin}
                iconName="build-outline"
                buttonStyle={styles.adminButton}
                textStyle={styles.adminButtonText}
                iconColor="white"
              />
            )}
            <ProfileButton
              title="Logout"
              onPress={handleLogout}
              iconName="log-out-outline"
              buttonStyle={styles.logoutButton}
              textStyle={styles.logoutButtonText}
              iconColor="#D32F2F"
            />
          </View>

          {/* Hiển thị lịch sử đặt vé */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {orders.length > 0 ? (
              orders.map((order) => (
                <Pressable
                  style={{
                    marginTop: 20,
                    padding: 15,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "#d0d0d0",
                    marginHorizontal: 10,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  key={order._id}
                  onPress={() =>
                    navigation.navigate("BookingDetail", {
                      bookingId: order._id,
                    })
                  }
                >
                  {order.movie && (
                    <View style={{ marginVertical: 10 }}>
                      <Image
                        source={{ uri: order.movie.posterImage }}
                        style={{
                          width: 100,
                          height: 100,
                          resizeMode: "contain",
                        }}
                      />
                      <Text style={{ marginTop: 5, textAlign: "center" }}>
                        {order.movie.title}
                      </Text>
                    </View>
                  )}
                </Pressable>
              ))
            ) : (
              <Text style={{ marginTop: 20, textAlign: "center" }}>
                No bookings found
              </Text>
            )}
          </ScrollView>
        </>
      );
    }
    return (
      <View style={styles.centeredMessageContainer}>
        <Text style={styles.infoText}>Log in to manage profile.</Text>
        <Pressable
          style={styles.loginButton}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.loginButtonText}>Login / Register</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#00CED1"]}
            tintColor={"#00CED1"}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {renderContent()}
        <Text style={styles.footerText}>MovieTime App v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8f9fa" },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 30 },
  loader: { marginTop: "50%" },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
    textAlign: "center",
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    color: "grey",
    textAlign: "center",
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  loginButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 20,
  },
  avatarContainer: { marginBottom: 15 },
  welcomeText: { fontSize: 24, fontWeight: "600", color: "#343a40" },
  emailText: { fontSize: 15, color: "grey", marginTop: 5 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "#e7f3ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#cfe2ff",
  },
  roleText: {
    fontSize: 13,
    color: "#0056b3",
    fontWeight: "600",
    marginLeft: 5,
  },
  buttonContainer: { paddingHorizontal: 15 },
  profileButton: {
    backgroundColor: "white",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  buttonIcon: { marginRight: 18 },
  buttonText: { flex: 1, fontSize: 16, fontWeight: "500", color: "#343a40" },
  chevron: { color: "grey" },
  adminButton: { backgroundColor: "#007bff", borderColor: "#0069d9" },
  adminButtonText: { color: "white" },
  logoutButton: { backgroundColor: "#fff0f1", borderColor: "#ffdfe2" },
  logoutButtonText: { color: "#D32F2F", fontWeight: "600" },
  footerText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 12,
    color: "lightgrey",
  },
});

export default ProfileScreen;
