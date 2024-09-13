import React, { useState } from "react";
import {
  TextField,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  Container,
  Box,
  Snackbar,
  Alert,
  Divider,
  IconButton,
  Avatar,
  createTheme,
  ThemeProvider,
  CssBaseline,
} from "@mui/material";
import {
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
} from "@mui/icons-material";
import axios from "axios";
axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL;
axios.defaults.headers.post["Content-Type"] = "application/json";
axios.defaults.withCredentials = true;
const API_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [question, setQuestion] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");
  const [scraped, setScraped] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Create a theme based on the mode
  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: "#1976d2",
      },
      secondary: {
        main: "#dc004e",
      },
      background: {
        default: darkMode ? "#121212" : "#f5f5f5",
        paper: darkMode ? "#424242" : "#ffffff",
      },
      text: {
        primary: darkMode ? "#ffffff" : "#000000",
        secondary: darkMode ? "#b0b0b0" : "#333333",
      },
    },
  });

  const handleScrape = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/scrape`, { url });
      setChatHistory([
        {
          type: "system",
          text: "Website scraped successfully. You can now ask questions.",
        },
      ]);
      setSnackbarMessage("Website scraped successfully.");
      setSnackbarSeverity("success");
      setScraped(true);
    } catch (error) {
      setSnackbarMessage("Error scraping website. Please try again.");
      setSnackbarSeverity("error");
    }
    setLoading(false);
    setSnackbarOpen(true);
  };

  const handleAsk = async () => {
    if (!question.trim()) return;

    setChatHistory([...chatHistory, { type: "user", text: question }]);
    setQuestion("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/ask`, { question });
      setChatHistory((prev) => [
        ...prev,
        { type: "ai", text: response.data.answer },
      ]);
      setSnackbarMessage("Answer received.");
      setSnackbarSeverity("success");
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        { type: "error", text: "Error getting answer. Please try again." },
      ]);
      setSnackbarMessage("Error getting answer. Please try again.");
      setSnackbarSeverity("error");
    }
    setLoading(false);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container
        maxWidth="lg"
        sx={{ p: 0, height: "100vh", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
          }}
        >
          <Typography variant="h3">
            web<span style={{ color: "crimson" }}>Master</span>
          </Typography>
          <IconButton onClick={toggleDarkMode} color="inherit">
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>

        {/* Main Content */}
        <Box sx={{ display: "flex", flexGrow: 1 }}>
          {!scraped ? (
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 2,
                mx: "auto",
                maxWidth: "600px",
                width: "100%",
                margin: "auto",
                animation: "fadeIn 0.5s",
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
                Scrape a Website
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                label="Website URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                onClick={handleScrape}
                disabled={loading}
                fullWidth
                sx={{
                  height: "56px",
                  position: "relative",
                  backgroundColor: "crimson",
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Scrape Website"
                )}
              </Button>
            </Paper>
          ) : (
            <Box sx={{ display: "flex", flexGrow: 1, height: "100%" }}>
              {/* Left Side */}
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  maxWidth: "350px",
                  height: "100%",
                }}
              >
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    mb: 2,
                    animation: "fadeIn 0.5s",
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Ask a Question
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    label="Ask a question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleAsk}
                    disabled={loading}
                    fullWidth
                    sx={{ height: "56px", position: "relative" }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      "Ask"
                    )}
                  </Button>
                </Paper>
              </Box>

              {/* Right Side */}
              <Box
                sx={{
                  flex: 2,
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Chat History
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box
                    sx={{
                      flex: 1,
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <List sx={{ padding: 0 }}>
                      {chatHistory.map((msg, index) => (
                        <ListItem
                          key={index}
                          sx={{
                            bgcolor:
                              msg.type === "user" ? "#d0f0c0" : "#e0e0e0",
                            color: msg.type === "user" ? "#000000" : "#333333",
                            mb: 1,
                            borderRadius: "20px",
                            p: 1,
                            alignSelf:
                              msg.type === "user" ? "flex-end" : "flex-start",
                            maxWidth: "75%",
                            animation: "slideIn 0.5s",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              mr: 1,
                              bgcolor:
                                msg.type === "user"
                                  ? "primary.main"
                                  : "secondary.main",
                            }}
                          >
                            {msg.type === "user" ? "U" : "B"}
                          </Avatar>
                          <ListItemText
                            primary={msg.text}
                            sx={{ whiteSpace: "pre-line" }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Paper>
              </Box>
            </Box>
          )}
        </Box>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          action={
            <Button color="inherit" onClick={handleCloseSnackbar}>
              Close
            </Button>
          }
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbarSeverity}
            sx={{
              backgroundColor:
                snackbarSeverity === "error" ? "#f8d7da" : "#d4edda",
              color: snackbarSeverity === "error" ? "#721c24" : "#155724",
            }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default App;
