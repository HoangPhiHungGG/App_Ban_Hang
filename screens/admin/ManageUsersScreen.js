import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
  TextInput,
  ScrollView,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import api from "../../api";
import { Ionicons } from "@expo/vector-icons";
import DropDownPicker from "react-native-dropdown-picker";

const ManageUsersScreen = () => {
  const navigation = useNavigation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true); // State cho loading ban đầu / filter
  const [refreshing, setRefreshing] = useState(false); // State cho pull-to-refresh
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);

  // --- Filter States ---
  const [roleFilter, setRoleFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [roleOpen, setRoleOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const roleItems = [
    { label: "All Roles", value: null },
    { label: "User", value: "user" },
    { label: "Admin", value: "admin" },
  ];
  const statusItems = [
    { label: "Tất cả ", value: null },
    { label: "Kích hoạt/Đã xác minh", value: true },
    { label: "Bị khoá/Chưa được xác minh", value: false },
  ];

  // --- Fetch Logic ---
  // *** SỬA LẠI DEPENDENCY ARRAY ***
  const fetchAdminUsers = useCallback(
    async (isRefresh = false) => {
      console.log("Fetching admin users with:", {
        search: searchQuery,
        role: roleFilter,
        status: statusFilter,
      });
      // Chỉ set loading=true khi fetch MỚI (không phải refresh)
      if (!isRefresh) setLoading(true);
      setError(null);

      try {
        const params = {};
        if (searchQuery.trim()) params.search = searchQuery.trim();
        if (roleFilter !== null) params.role = roleFilter;
        if (statusFilter !== null) params.verified = statusFilter;

        const response = await api.get("/admin/users", { params });
        setUsers(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error(
          "Admin: Error fetching users:",
          err.response?.data || err.message
        );
        setError(
          "Could not load users. Pull down to refresh or check filters."
        );
        setUsers([]);
      } finally {
        setLoading(false); // Tắt loading chính
        if (isRefresh) setRefreshing(false); // Tắt indicator refresh nếu là refresh
      }
      // *** Chỉ phụ thuộc vào các filter state ***
    },
    [searchQuery, roleFilter, statusFilter]
  );

  // --- Fetch khi màn hình focus hoặc khi filter thay đổi ---
  // Kết hợp cả hai vào một useEffect duy nhất theo dõi filter
  // useFocusEffect sẽ đảm bảo fetch khi quay lại màn hình
  useFocusEffect(
    useCallback(() => {
      console.log(
        "ManageUsersScreen focused/filters changed, fetching users..."
      );
      fetchAdminUsers(false); // Gọi fetch khi focus hoặc filter thay đổi
    }, [fetchAdminUsers]) // Phụ thuộc vào hàm fetch (mà hàm fetch lại phụ thuộc filter)
  );

  // --- Refresh Logic ---
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAdminUsers(true); // Gọi fetch với cờ refresh
  }, [fetchAdminUsers]);

  // --- Dropdown Handlers --- (Giữ nguyên)
  const onRoleOpen = useCallback(() => setStatusOpen(false), []);
  const onStatusOpen = useCallback(() => setRoleOpen(false), []);

  // --- Action Handlers ---
  const handleAddUser = () => {
    Alert.alert("TODO", "Implement Add User Screen");
  };
  const handleEditUser = (userId) => {
    navigation.navigate("AdminEditUser", { userId: userId });
  };
  const handleViewDetails = (userId, userName) => {
    Alert.alert("TODO", `Implement User Details Screen for: ${userName}`);
  };

  const handleToggleLock = (userId, userName, isCurrentlyVerified) => {
    const newStatus = !isCurrentlyVerified;
    const actionText = newStatus ? "Unban/Verify" : "Ban/Unverify";
    Alert.alert(
      `Confirm ${actionText}`,
      `Are you sure you want to ${actionText.toLowerCase()} user "${userName}"?`,
      [
        { text: "Cancel" },
        {
          text: actionText,
          onPress: async () => {
            // *** Cập nhật UI trước, gọi API sau (Optimistic Update) ***
            const originalUsers = users; // Lưu lại state cũ để rollback nếu lỗi
            setUsers((prevUsers) =>
              prevUsers.map((u) =>
                u._id === userId ? { ...u, verified: newStatus } : u
              )
            );
            try {
              await api.put(`/admin/users/${userId}`, { verified: newStatus });
              // Không cần Alert success nữa vì UI đã cập nhật
            } catch (error) {
              Alert.alert(
                "Error",
                `Could not ${actionText.toLowerCase()} user.`
              );
              setUsers(originalUsers); // *** Rollback state nếu API lỗi ***
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = (userId, userName) => {
    Alert.alert(
      "Confirm Delete",
      `DELETE user "${userName}"? Consider banning first.`,
      [
        { text: "Cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // *** Cập nhật UI trước, gọi API sau ***
            const originalUsers = users;
            setUsers((prev) => prev.filter((u) => u._id !== userId));
            try {
              await api.delete(`/admin/users/${userId}`);
              // Alert("Success", `User "${userName}" deleted.`); // Không cần thiết nữa
            } catch (error) {
              Alert.alert(
                "Error",
                error.response?.data?.message || "Could not delete user."
              );
              setUsers(originalUsers); // *** Rollback state nếu API lỗi ***
            }
          },
        },
      ]
    );
  };

  const handleExport = () => {
    Alert.alert("TODO", "Implement Export Users functionality");
  };

  // --- Render Item --- (Giữ nguyên)
  const renderItem = ({ item } /* ... JSX render item ... */) => (
    <View style={styles.itemContainer}>
      <Pressable
        style={styles.itemInfo}
        onPress={() => handleViewDetails(item._id, item.name)}
      >
        <Text style={styles.itemName}>{item.name || "No Name"}</Text>
        <Text style={styles.itemDetail} numberOfLines={1}>
          Email: {item.email || "No Email"}
        </Text>
        <Text style={styles.itemDetail}>
          Role:{" "}
          <Text
            style={item.role === "admin" ? styles.adminRole : styles.userRole}
          >
            {item.role || "user"}
          </Text>
        </Text>
        <Text style={styles.itemDetail}>
          Status:{" "}
          <Text
            style={item.verified ? styles.activeStatus : styles.bannedStatus}
          >
            {item.verified ? "Active" : "Banned"}
          </Text>
        </Text>
        <Text style={styles.itemDetail}>
          Joined:{" "}
          {item.createdAt
            ? new Date(item.createdAt).toLocaleDateString()
            : "N/A"}
        </Text>
      </Pressable>
      <View style={styles.itemActions}>
        <Pressable
          style={styles.actionButton}
          onPress={() => handleEditUser(item._id)}
        >
          <Ionicons name="pencil-outline" size={21} color="#0d6efd" />
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => handleToggleLock(item._id, item.name, item.verified)}
        >
          <Ionicons
            name={item.verified ? "lock-open-outline" : "lock-closed"}
            size={21}
            color={item.verified ? "#ffc107" : "#6c757d"}
          />
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => handleDeleteUser(item._id, item.name)}
        >
          <Ionicons name="trash-outline" size={21} color="#dc3545" />
        </Pressable>
      </View>
    </View>
  );

  // --- Render Main ---
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Search & Filter UI */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="gray"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {searchQuery ? (
          <Pressable
            onPress={() => setSearchQuery("")}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="gray" />
          </Pressable>
        ) : null}
      </View>
      <View style={[styles.filterContainer, { zIndex: 10 }]}>
        <DropDownPicker
          listMode="MODAL"
          open={roleOpen}
          value={roleFilter}
          items={roleItems}
          setOpen={setRoleOpen}
          setValue={setRoleFilter}
          placeholder="Filter by Role"
          containerStyle={styles.dropdownFilter}
          style={styles.dropdownStyle}
          placeholderStyle={styles.placeholderStyle}
          zIndex={3000}
          onOpen={onRoleOpen}
        />
        <DropDownPicker
          listMode="MODAL"
          open={statusOpen}
          value={statusFilter}
          items={statusItems}
          setOpen={setStatusOpen}
          setValue={setStatusFilter}
          placeholder="Filter by Status"
          containerStyle={styles.dropdownFilter}
          style={styles.dropdownStyle}
          placeholderStyle={styles.placeholderStyle}
          zIndex={2000}
          onOpen={onStatusOpen}
        />
      </View>

      {/* Buttons Add/Export */}
      <View style={styles.topActionContainer}>
        <Pressable
          style={[styles.topActionButton, styles.addButton]}
          onPress={handleAddUser}
        >
          <Ionicons name="person-add-outline" size={18} color="white" />
          <Text style={styles.topActionButtonText}>Add User</Text>
        </Pressable>
        <Pressable
          style={[styles.topActionButton, styles.exportButton]}
          onPress={handleExport}
        >
          <Ionicons name="download-outline" size={18} color="white" />
          <Text style={styles.topActionButtonText}>Export</Text>
        </Pressable>
      </View>

      {/* Conditional Rendering */}
      {/* *** LUÔN RENDER FLATLIST, ĐỂ NÓ TỰ XỬ LÝ EMPTY/LOADING STATE BÊN TRONG *** */}
      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={(item) => item._id.toString()}
        ListEmptyComponent={
          // Hiển thị khi loading hoặc không có data
          loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#008E97" />
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <Ionicons
                name="cloud-offline-outline"
                size={50}
                color="#dc3545"
                style={{ marginBottom: 10 }}
              />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable
                onPress={() => fetchAdminUsers(false)}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>
                No users found
                {searchQuery || roleFilter !== null || statusFilter !== null
                  ? " matching filters"
                  : ""}
                .
              </Text>
            </View>
          )
        }
        contentContainerStyle={
          loading || error || users.length === 0
            ? styles.contentWhenEmpty
            : styles.listContainer
        } // Căn giữa nếu rỗng/lỗi/loading
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#008E97"]}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8f9fa" },
  // loader: { flex: 1, justifyContent: 'center', alignItems: 'center' }, // Dùng trong ListEmptyComponent
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginTop: 50,
  }, // Thêm marginTop
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchIcon: { position: "absolute", left: 20, zIndex: 1 },
  searchInput: {
    flex: 1,
    height: 42,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 25,
    paddingLeft: 40,
    paddingRight: 35,
    backgroundColor: "white",
  },
  clearButton: {
    position: "absolute",
    right: 15,
    height: 42,
    justifyContent: "center",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#f1f3f5",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownFilter: { width: "48%", height: 40 },
  dropdownStyle: {
    borderColor: "#ccc",
    height: 40,
    minHeight: 40,
    backgroundColor: "white",
  },
  placeholderStyle: { color: "grey", fontSize: 14 },
  topActionContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 5,
    backgroundColor: "#f8f9fa",
  },
  topActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 10,
  },
  addButton: { backgroundColor: "#198754" },
  exportButton: { backgroundColor: "#0dcaf0" },
  topActionButtonText: {
    color: "white",
    fontWeight: "500",
    fontSize: 14,
    marginLeft: 5,
  },
  listContainer: { paddingBottom: 20 },
  contentWhenEmpty: { flexGrow: 1, justifyContent: "center" }, // Style để căn giữa EmptyComponent
  itemContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 15,
    alignItems: "center",
  },
  separator: { height: 1, backgroundColor: "#f0f0f0", marginLeft: 15 },
  itemInfo: { flex: 1, marginRight: 10, justifyContent: "center" },
  itemName: { fontSize: 15, fontWeight: "bold", marginBottom: 4 },
  itemDetail: { fontSize: 13, color: "grey", marginTop: 2 },
  itemEmail: { fontSize: 13, color: "#555", marginBottom: 4 },
  itemRole: { fontSize: 13, marginBottom: 2 },
  adminRole: { fontWeight: "bold", color: "#007bff" },
  userRole: { color: "#6c757d" },
  itemStatus: { fontSize: 13 },
  activeStatus: { fontWeight: "bold", color: "#198754" },
  bannedStatus: { fontWeight: "bold", color: "#dc3545" },
  itemActions: { flexDirection: "column", justifyContent: "space-around" },
  actionButton: { paddingVertical: 6, paddingHorizontal: 8 },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    color: "grey",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: "#008E97",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  retryText: { color: "white", fontWeight: "bold", fontSize: 15 },
});

export default ManageUsersScreen;
