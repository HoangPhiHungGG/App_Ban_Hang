import React, { createContext, useState, useEffect } from "react"; // Import React
import AsyncStorage from "@react-native-async-storage/async-storage";
import jwt_decode from "jwt-decode";

// Khởi tạo context với giá trị mặc định hợp lý
const defaultValue = {
  userId: "",
  setUserId: () => {}, // Cung cấp hàm no-op mặc định
  userRole: null,
  setUserRole: () => {}, // Cung cấp hàm no-op mặc định
};
const UserType = createContext(defaultValue); // Khởi tạo với default value

const UserContext = ({ children }) => {
  const [userId, setUserId] = useState("");
  const [userRole, setUserRole] = useState(null);

  // --- Bỏ qua useEffect ở đây nếu App.js đã xử lý ---
  // ... useEffect logic ...

  // Value cung cấp cho context provider
  const contextValue = {
    userId,
    setUserId,
    userRole,
    setUserRole,
  };

  return <UserType.Provider value={contextValue}>{children}</UserType.Provider>;
};

export { UserType, UserContext }; // Export đúng tên
