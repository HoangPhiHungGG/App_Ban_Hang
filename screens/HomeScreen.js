import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Platform,
  ScrollView, // Giữ lại ScrollView nếu ListHeaderComponent phức tạp, nhưng FlatList là chính
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Feather, AntDesign, Ionicons } from "@expo/vector-icons";
import { SliderBox } from "react-native-image-slider-box";
import DropDownPicker from "react-native-dropdown-picker"; // Thư viện dropdown
import MovieItem from "../components/ MovieItem";
import api from "../api";

const { width } = Dimensions.get("window");

const HomeScreen = () => {
  // ... (các state giữ nguyên: movies, loading, refreshing, error, searchQuery, ...)
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [movieStatus, setMovieStatus] = useState("now_showing");

  // --- Dropdown State ---
  const [genreOpen, setGenreOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  // --- Dropdown Items --- (Giữ nguyên)
  const [genres, setGenres] = useState([
    { label: "Tất cả thể loại", value: null },
    { label: "Hành động", value: "Action" },
    { label: "Hài", value: "Comedy" },
    { label: "Tình cảm", value: "Drama" },
    { label: "Khoa học viễn tưởng", value: "Sci-Fi" },
    { label: "Kinh dị", value: "Horror" },
    { label: "Lãng mạn", value: "Romance" },
    { label: "Hoạt hình", value: "Animation" },
    { label: "Giật gân", value: "Thriller" },
  ]);
  const [languages, setLanguages] = useState([
    { label: "Tất cả ngôn ngữ", value: null },
    { label: "Tiếng Anh", value: "English" },
    { label: "Tiếng Việt", value: "Vietnamese" },
    { label: "Tiếng Hàn", value: "Korean" },
    { label: "Tiếng Nhật", value: "Japanese" },
    { label: "Tiếng Tây Ban Nha", value: "Spanish" },
    { label: "Tiếng Ấn Độ", value: "Hindi" },
  ]);
  const [statuses, setStatuses] = useState([
    { label: "Đang chiếu", value: "now_showing" },
    { label: "Sắp chiếu", value: "coming_soon" },
  ]);

  // --- Fetching Data --- (Giữ nguyên)
  const fetchMovies = useCallback(async () => {
    console.log("Fetching movies with filters:", {
      status: movieStatus,
      genre: selectedGenre,
      language: selectedLanguage,
      search: searchQuery,
    });
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (movieStatus) params.status = movieStatus;
      if (selectedGenre) params.genre = selectedGenre;
      if (selectedLanguage) params.language = selectedLanguage;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const response = await api.get("/movies", { params });
      setMovies(response.data);
    } catch (err) {
      console.error("Error fetching movies:", err);
      setError("Failed to load movies. Pull down to refresh.");
      setMovies([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [movieStatus, selectedGenre, selectedLanguage, searchQuery]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMovies();
  }, [fetchMovies]);

  // --- Dropdown Open Handlers --- (Giữ nguyên)
  const onGenreOpen = useCallback(() => {
    setLanguageOpen(false);
    setStatusOpen(false);
  }, []);
  const onLanguageOpen = useCallback(() => {
    setGenreOpen(false);
    setStatusOpen(false);
  }, []);
  const onStatusOpen = useCallback(() => {
    setGenreOpen(false);
    setLanguageOpen(false);
  }, []);

  // --- Banner Images --- (Giữ nguyên)
  const bannerImages = [
    "https://image.tmdb.org/t/p/original/kDp1vUBnMpeSGlGaHfKPZneHnUZ.jpg",
    "https://image.tmdb.org/t/p/original/cDJ61O180tZNfS6B4MBLJkuzgpr.jpg",
    "https://image.tmdb.org/t/p/original/nTPFkLUARmo1bYHfkfdkWCcHMEk.jpg",
  ];

  // --- Render Header Component for FlatList ---
  const renderHeader = () => (
    <>
      {/* Banner Slider */}
      <SliderBox
        images={bannerImages}
        autoPlay
        circleLoop
        dotColor={"#008E97"}
        inactiveDotColor="#90A4AE"
        ImageComponentStyle={styles.sliderImage}
        resizeMode="cover"
        sliderBoxHeight={width * 0.5}
      />

      {/* Filter Section */}
      {/*
              Quan trọng: Container này cần zIndex cao để các dropdown *input*
              không bị che bởi list nếu list scroll lên gần header.
              Tuy nhiên, việc hiển thị list dropdown *lên trên* được xử lý bởi listMode="MODAL".
            */}
      <View style={styles.filterOuterContainer}>
        {/* Status Dropdown */}
        <DropDownPicker
          // *** THAY ĐỔI QUAN TRỌNG: Sử dụng Modal để hiển thị list ***
          listMode="MODAL"
          open={statusOpen}
          value={movieStatus}
          items={statuses}
          setOpen={setStatusOpen}
          setValue={setMovieStatus}
          setItems={setStatuses}
          placeholder="Trạng thái"
          containerStyle={styles.dropdownContainerNarrow}
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyles}
          modalProps={{
            // Tùy chỉnh modal nếu cần
            animationType: "slide", // hoặc "fade"
          }}
          modalTitle="Trạng thái" // Tiêu đề cho modal
          // zIndex và zIndexInverse ít quan trọng hơn với Modal mode
          // zIndex={3000}
          // zIndexInverse={1000}
          onOpen={onStatusOpen}
          // Đóng modal khi chọn item (thường là mặc định)
          // closeAfterSelecting={true}
        />
        {/* Genre Dropdown */}
        <DropDownPicker
          // *** THAY ĐỔI QUAN TRỌNG: Sử dụng Modal ***
          listMode="MODAL"
          open={genreOpen}
          value={selectedGenre}
          items={genres}
          setOpen={setGenreOpen}
          setValue={setSelectedGenre}
          setItems={setGenres}
          placeholder="Thể loại"
          containerStyle={styles.dropdownContainerWide}
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyles}
          searchable={true} // Giữ lại searchable trong modal
          searchPlaceholder="Tìm thể loại..."
          modalProps={{ animationType: "slide" }}
          modalTitle="Select Genre"
          // zIndex={2000}
          // zIndexInverse={2000}
          onOpen={onGenreOpen}
        />
        {/* Language Dropdown */}
        <DropDownPicker
          // *** THAY ĐỔI QUAN TRỌNG: Sử dụng Modal ***
          listMode="MODAL"
          open={languageOpen}
          value={selectedLanguage}
          items={languages}
          setOpen={setLanguageOpen}
          setValue={setSelectedLanguage}
          setItems={setLanguages}
          placeholder="Ngôn ngữ"
          containerStyle={styles.dropdownContainerWide}
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyles}
          modalProps={{ animationType: "slide" }}
          modalTitle="Chọn ngôn ngữ"
          // zIndex={1000}
          // zIndexInverse={3000}
          onOpen={onLanguageOpen}
        />
      </View>
      {/* Thêm tiêu đề cho danh sách phim nếu muốn */}
      {/* <Text style={styles.movieListTitle}>Movies</Text> */}
    </>
  );

  // --- Main Render ---
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        {/* ... (Search Bar JSX giữ nguyên) ... */}
        <View style={styles.searchBox}>
          <Ionicons
            style={{ paddingLeft: 10 }}
            name="search"
            size={20}
            color="gray"
          />
          <TextInput
            placeholder="Search movies..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={fetchMovies}
            returnKeyType="search"
          />
          {searchQuery ? (
            <Pressable
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={18} color="gray" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Main Content */}
      {loading && !refreshing && movies.length === 0 ? (
        <ActivityIndicator size="large" color="#00CED1" style={styles.loader} />
      ) : error && movies.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.errorContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#00CED1"]}
            />
          }
        >
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={fetchMovies} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <FlatList
          data={movies}
          renderItem={({ item }) => <MovieItem item={item} />}
          keyExtractor={(item) => item._id.toString()}
          numColumns={2} // Hiển thị 2 cột
          ListHeaderComponent={renderHeader} // Render banner và filter ở header
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#00CED1"]}
            />
          }
          ListEmptyComponent={
            !loading &&
            !error && <Text style={styles.emptyText}>No movies found.</Text>
          }
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={10}
        />
      )}
    </SafeAreaView>
  );
};

export default HomeScreen;

// --- Styles --- (Giữ nguyên các style khác)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingTop: Platform.OS === "android" ? 25 : 0,
  },
  searchContainer: {
    backgroundColor: "white",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    height: 40,
  },
  searchInput: {
    flex: 1,
    paddingLeft: 10,
    paddingRight: 5,
    height: "100%",
    fontSize: 15,
  },
  clearButton: {
    padding: 8,
  },
  sliderImage: {
    width: "100%",
    // height được đặt trong props sliderBoxHeight
  },
  filterOuterContainer: {
    flexDirection: "row",
    justifyContent: "space-around", // Phân bố đều không gian
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 12, // Tăng padding dọc
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    // zIndex vẫn có thể cần thiết để đảm bảo các ô input dropdown
    // nằm trên các phần tử khác trong header nếu có overlap
    zIndex: 10,
  },
  dropdownContainerNarrow: {
    width: "30%", // Chiều rộng cho Status
  },
  dropdownContainerWide: {
    width: "33%", // Chiều rộng cho Genre/Language
  },
  dropdown: {
    borderColor: "#BDBDBD", // Border màu xám nhạt hơn
    height: 42, // Chiều cao cố định cho dropdown input
    minHeight: 42,
    borderRadius: 5,
    backgroundColor: "#f5f5f5", // Nền input hơi xám
  },
  placeholderStyles: {
    color: "grey",
    fontSize: 14, // Font size cho placeholder
  },
  listContainer: {
    paddingHorizontal: 5,
    paddingBottom: 20,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
    textAlign: "center",
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: "#008E97",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  retryText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 60,
    fontSize: 16,
    color: "gray",
  },
  // movieListTitle: { // Style nếu bạn thêm tiêu đề cho list
  //     fontSize: 18,
  //     fontWeight: 'bold',
  //     paddingHorizontal: 15,
  //     paddingTop: 15,
  //     paddingBottom: 5,
  // }
});
