import AnalyticsIcon from "@mui/icons-material/Analytics";
import MicIcon from "@mui/icons-material/Mic";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import {
  Box,
  Button,
  Card,
  CardContent,
  Fade,
  Grid,
  Grow,
  IconButton,
  Skeleton,
  TextField,
   Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import SkeletonCard from "../../components/SkeletonCard";
import {
  useGetTotalCountDashboard,
  useRegisterMutation,
  useRequestLatePermission,
  useGetAllLatePermissions,
  useUpdateLatePermission,
} from "./components/function";
import { SalesTodayCard } from "./components/matrix";
import "./components/style/index.css";
import Constant from "../../utils/constant";
import lateEntryPermissionService from "../../service/lateEntryPermission.service";
import clientEnquiryService from '../../service/clientinquiry.service';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  TablePagination,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
// import CancelIcon from "@mui/icons-material/Cancel";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

const COLORS = ["#667eea", "#764ba2", "#f093fb"];
const GRADIENT_COLORS = {
  primary: ["#667eea", "#764ba2"],
  secondary: ["#f093fb", "#f5576c"],
  tertiary: ["#4facfe", "#00f2fe"],
};

// Consistent TextField styling for white background
const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    transition: "all 0.3s ease",
    "&:hover": {
      background: "#f1f5f9",
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "#667eea",
      },
    },
    "&.Mui-focused": {
      background: "#ffffff",
      boxShadow: "0 0 0 3px rgba(102, 126, 234, 0.1)",
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "#667eea",
        borderWidth: "2px",
      },
    },
  },
  "& .MuiInputLabel-root": {
    color: "#64748b",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#667eea",
  },
};

const Dashboard = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    mode: "onChange",
  });
  const [countData, setCountData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // ✅ NEW STATES — For Late Entry Permission
  // const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [selectedExecutive, setSelectedExecutive] = useState("");
const [executives, setExecutives] = useState([]);
  // const [lateEntryData, setLateEntryData] = useState(null);
  const [pendingFormData, setPendingFormData] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [permLoading, setPermLoading] = useState(false);
  const [permPage, setPermPage] = useState(0);
  const [permRowsPerPage] = useState(50);

  const loginRes = useSelector((state) => state.auth.data);
  const authToken = loginRes.authToken;
  const userId = loginRes.user.id;

  const roleId = loginRes.user.roleId;

  // const registerUser = useRegisterMutation(userId, authToken, reset, toast).mutate;
  // ✅ NEW — Passed extra setters for late entry handling
  const registerMutation = useRegisterMutation(
    userId,
    authToken,
    reset,
    toast,
  );
  const registerUser = registerMutation.mutate;
  const getCountMutation = useGetTotalCountDashboard(
    authToken,
    setCountData,
    setIsLoading,
  );
  const getCount = useCallback(getCountMutation.mutate, [getCountMutation]);

  // const requestPermission = async (data) => {
  //   try {
  //     const response = await lateEntryPermissionService.requestPermission(
  //       data,
  //       authToken,
  //     );
  //     if (response.statusCode === 201) {
  //       toast.success("Permission request has been sent to the admin!");
  //       setShowPermissionDialog(false);
  //     } else {
  //       toast.error(response.message || "Failed to send the request.");
  //     }
  //   } catch (err) {
  //     console.log("requestPermission error:", err);
  //     toast.error("An error occurred while sending the request.");
  //   }
  // };
  const fetchPermissions = async () => {
    try {
      setPermLoading(true);
      const response = await lateEntryPermissionService.getAllPermissions(
        authToken,
        "",
      );
      if (response.statusCode === 200) {
        setPermissions(response.data || []);
      } else {
        setPermissions([]);
      }
    } catch (err) {
      console.log("fetchPermissions error:", err);
      toast.error("Error fetching permissions.");
    } finally {
      setPermLoading(false);
    }
  };

  const updatePermission = async (data) => {
    try {
      const response = await lateEntryPermissionService.updatePermissionStatus(
        data,
        authToken,
      );
      if (response.statusCode === 200) {
        toast.success("Permission status has been updated!");
        fetchPermissions();
      } else {
        toast.error(response.message || "Update Error");
      }
    } catch (err) {
      console.log("updatePermission error:", err);
      toast.error("An error occurred while updating the status.");
    }
  };

  useEffect(() => {
    console.log("Dashboard mounted, fetching count data...");
    getCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debug: Log countData to see what we're getting
  useEffect(() => {
    console.log("Dashboard countData:", countData);
  }, [countData]);

  const data = [
    { name: "Followup Call", value: countData?.totalNosOfFollowupCall || 0 },
    { name: "New Call", value: countData?.totalNosOfNewCall || 0 },
    { name: "Office Visit", value: countData?.totalNosOfOfficeVisit || 0 },
  ];

  // const onSubmit = (formData) => {
  //     registerUser(formData);
  //     getCount();
  // };

  const onSubmit = (formData) => {
    // ✅ executive id store karo
formData.team = selectedExecutive || "";
    setPendingFormData(formData);
    registerUser(formData);
    getCount();
};

  // const handlePermissionRequest = () => {
  //   const currentFormData = watch();

  //   console.log("currentFormData:", currentFormData);
  //   console.log("requestPermission function:", requestPermission);
  //   requestPermission({
  //     clientName: currentFormData.clientName || "",
  //     phoneNumber: currentFormData.customerPhoneNumber || "",
  //     inquiryDate: currentFormData.inquiryDate || "",
  //   });
  // };

  useEffect(() => {
    if (roleId === Constant.adminRoleId) {
      fetchPermissions();
    }
    // ✅ NAYA — executives fetch 
    const loadExecutives = async () => {
        try {
            const response = await clientEnquiryService.getALlExecutive(authToken);
            if (response.statusCode === 200) {
                setExecutives(response.data || []);
            }
        } catch (err) {
            console.log("executives fetch error:", err);
        }
    };
    loadExecutives();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#ffffff",
        position: "relative",
        overflow: "hidden",
        // Subtle background pattern
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
                        radial-gradient(circle at 25% 25%, rgba(102, 126, 234, 0.03) 0%, transparent 50%),
                        radial-gradient(circle at 75% 75%, rgba(118, 75, 162, 0.02) 0%, transparent 50%),
                        linear-gradient(180deg, rgba(248, 250, 252, 0.8) 0%, rgba(255, 255, 255, 1) 100%)
                    `,
          zIndex: 0,
        },
      }}
    >
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastStyle={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
        }}
      />

      {/* Main Container */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          padding: { xs: "20px", md: "40px" },
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {/* Statistics Cards */}
        {isLoading ? (
          <Box sx={{ mb: 6 }}>
            <Grid container spacing={4} justifyContent="center">
              {[0, 1, 2].map((i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Grow in={true} timeout={800 + i * 200}>
                    <Card
                      sx={{
                        background: "#ffffff",
                        borderRadius: "24px",
                        border: "1px solid rgba(226, 232, 240, 0.8)",
                        boxShadow:
                          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                        overflow: "hidden",
                        position: "relative",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: "4px",
                          background: `linear-gradient(90deg, ${COLORS[i]} 0%, ${COLORS[(i + 1) % 3]} 100%)`,
                          animation: "shimmer 2s linear infinite",
                          backgroundSize: "200% 100%",
                          "@keyframes shimmer": {
                            "0%": { backgroundPosition: "-200% 0" },
                            "100%": { backgroundPosition: "200% 0" },
                          },
                        },
                      }}
                    >
                      <Box sx={{ p: 3 }}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", mb: 2 }}
                        >
                          <Skeleton
                            variant="rectangular"
                            width={48}
                            height={48}
                            sx={{
                              borderRadius: "12px",
                              mr: 2,
                              bgcolor: `${COLORS[i]}20`,
                              animation: "pulse 2s ease-in-out infinite",
                              "@keyframes pulse": {
                                "0%, 100%": { opacity: 1 },
                                "50%": { opacity: 0.7 },
                              },
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Skeleton
                              variant="text"
                              width="70%"
                              height={24}
                              sx={{ mb: 1, bgcolor: `${COLORS[i]}15` }}
                            />
                            <Skeleton
                              variant="text"
                              width="50%"
                              height={20}
                              sx={{ bgcolor: `${COLORS[i]}10` }}
                            />
                          </Box>
                        </Box>
                        <Skeleton
                          variant="text"
                          width="60%"
                          height={40}
                          sx={{ bgcolor: `${COLORS[i]}20` }}
                        />
                      </Box>
                    </Card>
                  </Grow>
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : (
          <Fade in={!isLoading} timeout={1000}>
            <Box sx={{ mb: 6 }}>
              <Grid container spacing={4} justifyContent="center">
                <Grid item xs={12} sm={6} md={4}>
                  <Fade in={!isLoading} timeout={800}>
                    <div>
                      <Link
                        to="/clientEnquiry"
                        style={{ textDecoration: "none" }}
                      >
                        <SalesTodayCard
                          countData={
                            countData?.totalNumberOfClientRegistration || 0
                          }
                          headerName={"Total Clients"}
                          imageName={"Management.png"}
                          backgroundColor={"#667eea"}
                          counterColor={"#4c63d2"}
                        />
                      </Link>
                    </div>
                  </Fade>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Fade in={!isLoading} timeout={1000}>
                    <div>
                      <Link
                        to="/Agentdetails"
                        style={{ textDecoration: "none" }}
                      >
                        <SalesTodayCard
                          countData={countData?.totalNumberOfAgent || 0}
                          headerName={"Active Agents"}
                          imageName={"Real Estate Agent.png"}
                          backgroundColor={"#764ba2"}
                          counterColor={"#5d3a7d"}
                        />
                      </Link>
                    </div>
                  </Fade>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Fade in={!isLoading} timeout={1200}>
                    <div>
                      <SalesTodayCard
                        countData={countData?.totalNosOfNewCall || 0}
                        headerName={"Total New Calls"}
                        imageName={"Incoming Call.png"}
                        backgroundColor={"#f093fb"}
                        counterColor={"#e066d8"}
                      />
                    </div>
                  </Fade>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        )}

        {/* Main Content Grid */}
        <Grid container spacing={4}>
          {/* Customer Registration Form */}
          <Grid item xs={12} lg={7}>
            {isLoading ? (
              <Grow in={true} timeout={1200}>
                <div>
                  <SkeletonCard variant="form" />
                </div>
              </Grow>
            ) : (
              <Fade in={!isLoading} timeout={1200}>
                <Card
                  sx={{
                    background: "#ffffff",
                    borderRadius: "24px",
                    border: "1px solid rgba(226, 232, 240, 0.8)",
                    boxShadow: `
                                            0 20px 25px -5px rgba(0, 0, 0, 0.1),
                                            0 10px 10px -5px rgba(0, 0, 0, 0.04)
                                        `,
                    overflow: "hidden",
                    position: "relative",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "4px",
                      background:
                        "linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
                    },
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: `
                                                0 25px 50px -12px rgba(0, 0, 0, 0.15),
                                                0 20px 25px -5px rgba(0, 0, 0, 0.1)
                                            `,
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                      <IconButton
                        sx={{
                          background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          color: "white",
                          mr: 2,
                          width: 56,
                          height: 56,
                          boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)",
                          "&:hover": {
                            background:
                              "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                            transform: "translateY(-2px)",
                            boxShadow: "0 12px 32px rgba(102, 126, 234, 0.4)",
                          },
                        }}
                      >
                        <PersonAddIcon fontSize="large" />
                      </IconButton>
                      <Box>
                        <Typography
                          variant="h4"
                          sx={{
                            fontFamily: '"SF Pro Display", "Inter", sans-serif',
                            fontWeight: "700",
                            color: "#1a202c",
                            mb: 0.5,
                            fontSize: "28px",
                          }}
                        >
                          Customer Registration
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            color: "#64748b",
                            fontWeight: "400",
                          }}
                        >
                          Add new client information to your database
                        </Typography>
                      </Box>
                    </Box>

                    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Client Name"
                            variant="outlined"
                            {...register("clientName")}
                            error={!!errors.clientName}
                            helperText={errors.clientName?.message}
                            sx={textFieldSx}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            required
                            fullWidth
                            label="Phone Number"
                            variant="outlined"
                            {...register("customerPhoneNumber")}
                            error={!!errors.customerPhoneNumber}
                            helperText={errors.customerPhoneNumber?.message}
                            sx={textFieldSx}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Alternate Phone"
                            variant="outlined"
                            {...register("customerAlternatePhoneNumber")}
                            sx={textFieldSx}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            required
                            fullWidth
                            label="Property Name"
                            variant="outlined"
                            {...register("propertyName")}
                            sx={textFieldSx}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Address"
                            variant="outlined"
                            {...register("address")}
                            sx={textFieldSx}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            required
                            fullWidth
                            label="Budget"
                            variant="outlined"
                            {...register("budget")}
                            error={!!errors.budget}
                            helperText={errors.budget?.message}
                            sx={textFieldSx}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            required
                            fullWidth
                            label="Inquiry Date"
                            variant="outlined"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            {...register("inquiryDate")}
                            error={!!errors.inquiryDate}
                            helperText={errors.inquiryDate?.message}
                            sx={textFieldSx}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            required
                            fullWidth
                            label="Next Call Date"
                            variant="outlined"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            {...register("nextCallDate")}
                            error={!!errors.nextCallDate}
                            helperText={errors.nextCallDate?.message}
                            sx={textFieldSx}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Button
                            variant="contained"
                            component="label"
                            fullWidth
                            startIcon={<MicIcon />}
                            sx={{
                              height: "56px",
                              borderRadius: "12px",
                              background:
                                "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                              boxShadow: "0 8px 24px rgba(240, 147, 251, 0.3)",
                              textTransform: "none",
                              fontSize: "16px",
                              fontWeight: "600",
                              "&:hover": {
                                background:
                                  "linear-gradient(135deg, #e066d8 0%, #e04e62 100%)",
                                transform: "translateY(-2px)",
                                boxShadow:
                                  "0 12px 32px rgba(240, 147, 251, 0.4)",
                              },
                            }}
                          >
                            Upload Audio Recording
                            <input
                              type="file"
                              {...register("AudioFile")}
                              hidden
                              accept="audio/*"
                            />
                          </Button>
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            required
                            fullWidth
                            label="Remarks"
                            variant="outlined"
                            multiline
                            rows={4}
                            {...register("remark")}
                            error={!!errors.remarks}
                            helperText={errors.remarks?.message}
                            sx={textFieldSx}
                          />
                        </Grid>
                         {/*  Team dropdown */}
<Grid item xs={12} >
 <FormControl fullWidth>
  <InputLabel>Executive (Optional)</InputLabel>
  <Select
  required
    label="Executive (Optional)"
    value={selectedExecutive}
    onChange={(e) => setSelectedExecutive(e.target.value)}
    sx={{ borderRadius: "12px", backgroundColor: "white" }}
  >
    {/* ✅ None option — optional hai */}
    <MenuItem value=""><em>None</em></MenuItem>
    {/* ✅ Database se executives dikhao */}
    {executives.map((exec) => (
      <MenuItem key={exec.id} value={exec.id}>
        {exec.name}
      </MenuItem>
    ))}
  </Select>
</FormControl>
</Grid>
                        <Grid item xs={12}>
                          <Box
                            sx={{
                              display: "flex",
                              gap: 2,
                              justifyContent: "flex-end",
                            }}
                          >
                            <Button
                              variant="outlined"
                              sx={{
                                borderRadius: "12px",
                                px: 4,
                                py: 1.5,
                                borderColor: "#e2e8f0",
                                color: "#64748b",
                                textTransform: "none",
                                fontWeight: "600",
                                "&:hover": {
                                  borderColor: "#cbd5e1",
                                  background: "rgba(248, 250, 252, 0.5)",
                                },
                              }}
                             onClick={() => {
    reset();
    setSelectedExecutive("");
}}
                            >
                              Reset Form
                            </Button>
                            <Button
                              type="submit"
                              variant="contained"
                              disabled={registerMutation.isPending}
                              sx={{
                                borderRadius: "12px",
                                px: 4,
                                py: 1.5,
                                background:
                                  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                boxShadow:
                                  "0 8px 24px rgba(102, 126, 234, 0.3)",
                                textTransform: "none",
                                fontWeight: "600",
                                fontSize: "16px",
                                "&:hover": {
                                  background:
                                    "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                                  transform: "translateY(-2px)",
                                  boxShadow:
                                    "0 12px 32px rgba(102, 126, 234, 0.4)",
                                },
                              }}
                            >
                              {registerMutation.isPending ? "Registering..." : "Register Client"}
                            </Button>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            )}
          </Grid>

          {/* Analytics Chart */}
          <Grid item xs={12} lg={5}>
            {isLoading ? (
              <Grow in={true} timeout={1400}>
                <div>
                  <SkeletonCard variant="stats" />
                </div>
              </Grow>
            ) : (
              <Fade in={!isLoading} timeout={1400}>
                <Card
                  sx={{
                    background: "#ffffff",
                    borderRadius: "24px",
                    border: "1px solid rgba(226, 232, 240, 0.8)",
                    boxShadow: `
                                            0 20px 25px -5px rgba(0, 0, 0, 0.1),
                                            0 10px 10px -5px rgba(0, 0, 0, 0.04)
                                        `,
                    overflow: "hidden",
                    position: "relative",
                    height: "fit-content",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "4px",
                      background:
                        "linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
                    },
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: `
                                                0 25px 50px -12px rgba(0, 0, 0, 0.15),
                                                0 20px 25px -5px rgba(0, 0, 0, 0.1)
                                            `,
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                      <IconButton
                        sx={{
                          background:
                            "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                          color: "white",
                          mr: 2,
                          width: 56,
                          height: 56,
                          boxShadow: "0 8px 24px rgba(240, 147, 251, 0.3)",
                          "&:hover": {
                            background:
                              "linear-gradient(135deg, #e066d8 0%, #e04e62 100%)",
                            transform: "translateY(-2px)",
                            boxShadow: "0 12px 32px rgba(240, 147, 251, 0.4)",
                          },
                        }}
                      >
                        <AnalyticsIcon fontSize="large" />
                      </IconButton>
                      <Box>
                        <Typography
                          variant="h5"
                          sx={{
                            fontFamily: '"SF Pro Display", "Inter", sans-serif',
                            fontWeight: "700",
                            color: "#1a202c",
                            mb: 0.5,
                          }}
                        >
                          Call Analytics
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            color: "#64748b",
                            fontWeight: "400",
                          }}
                        >
                          Track your team's performance
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ height: 400, width: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={data}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient
                              id="colorFollowup"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#667eea"
                                stopOpacity={0.8}
                              />
                              <stop
                                offset="95%"
                                stopColor="#667eea"
                                stopOpacity={0.1}
                              />
                            </linearGradient>
                            <linearGradient
                              id="colorNew"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#764ba2"
                                stopOpacity={0.8}
                              />
                              <stop
                                offset="95%"
                                stopColor="#764ba2"
                                stopOpacity={0.1}
                              />
                            </linearGradient>
                            <linearGradient
                              id="colorOffice"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#f093fb"
                                stopOpacity={0.8}
                              />
                              <stop
                                offset="95%"
                                stopColor="#f093fb"
                                stopOpacity={0.1}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(148, 163, 184, 0.2)"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: "#64748b",
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: "#64748b",
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "rgba(255, 255, 255, 0.95)",
                              backdropFilter: "blur(20px)",
                              border: "1px solid rgba(255, 255, 255, 0.3)",
                              borderRadius: "12px",
                              boxShadow: "0 12px 32px rgba(0, 0, 0, 0.1)",
                              color: "#1a202c",
                            }}
                            labelStyle={{ color: "#1a202c", fontWeight: 600 }}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#667eea"
                            strokeWidth={3}
                            fill="url(#colorFollowup)"
                            dot={{
                              fill: "#667eea",
                              strokeWidth: 2,
                              r: 6,
                              stroke: "#fff",
                            }}
                            activeDot={{
                              r: 8,
                              stroke: "#667eea",
                              strokeWidth: 2,
                              fill: "#fff",
                            }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>

                    {/* Quick Stats */}
                    <Box sx={{ mt: 4 }}>
                      <Grid container spacing={3}>
                        {data.map((item, index) => (
                          <Grid item xs={4} key={index}>
                            <Fade in={!isLoading} timeout={1800 + index * 200}>
                              <Box
                                sx={{
                                  textAlign: "center",
                                  p: 2,
                                  borderRadius: "12px",
                                  background: `linear-gradient(135deg, ${COLORS[index]}15 0%, ${COLORS[index]}08 100%)`,
                                  border: `1px solid ${COLORS[index]}20`,
                                  transition: "all 0.3s ease",
                                  "&:hover": {
                                    transform: "translateY(-2px)",
                                    boxShadow: `0 8px 24px ${COLORS[index]}20`,
                                  },
                                }}
                              >
                                <Typography
                                  variant="h4"
                                  sx={{
                                    fontWeight: "700",
                                    color: COLORS[index],
                                    mb: 1,
                                  }}
                                >
                                  {item.value}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "#64748b",
                                    fontWeight: "500",
                                    fontSize: "11px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                  }}
                                >
                                  {item.name}
                                </Typography>
                              </Box>
                            </Fade>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            )}
          </Grid>
        </Grid>
      </Box>
      {/* Late Entry Permission Dialog */}

      {/* <Dialog
        open={showPermissionDialog}
        onClose={() => setShowPermissionDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <WarningAmberIcon sx={{ color: "#f59e0b", fontSize: 28 }} />
          <Typography variant="h6" fontWeight={700} color="#b45309">
            Admin permission is required.
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              backgroundColor: "#fef3c7",
              border: "1px solid #fcd34d",
              borderRadius: 2,
              p: 2,
              mb: 2,
            }}
          >
            <Typography variant="body2" color="#92400e" fontWeight={500}>
              {lateEntryData?.message ||
                "The inquiry date is older than 5 days. Please get permission from the admin."}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Click the "Request Permission" button — a request will be sent to
            the admin. Once the admin approves it, the entry can be made.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setShowPermissionDialog(false)}
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePermissionRequest}
            variant="contained"
            sx={{
              borderRadius: "12px",
              px: 4,
              py: 1.5,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)",
              textTransform: "none",
              fontWeight: "600",
              fontSize: "16px",
              "&:hover": {
                background: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                transform: "translateY(-2px)",
                boxShadow: "0 12px 32px rgba(102, 126, 234, 0.4)",
              },
            }}
          >
            Request Permission
          </Button>
        </DialogActions>
      </Dialog> */}

      {/* ✅ NEW — Admin Panel — Visible only to Admin */}

      {roleId === Constant.adminRoleId && (
        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            px: { xs: "20px", md: "40px" },
            pb: 4,
            maxWidth: "1400px",
            margin: "0 auto",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid #e5e7eb",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <Box
              sx={{
                px: 3,
                py: 2,
                background: "linear-gradient(135deg, #fef3c7 0%, #fff7ed 100%)",
                borderBottom: "1px solid #fcd34d",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AccessTimeIcon sx={{ color: "#f59e0b" }} />
                <Typography variant="h6" fontWeight={700} color="#92400e">
                  Late Entry Permission Requests
                </Typography>
                {permissions.filter((p) => p.status === "PENDING").length >
                  0 && (
                  <Chip
                    label={`${permissions.filter((p) => p.status === "PENDING").length} Pending`}
                    size="small"
                    color="warning"
                  />
                )}
              </Box>
              <Button
                size="small"
                variant="outlined"
                onClick={() => fetchPermissions()}
                sx={{ borderRadius: 2 }}
              >
                Refresh
              </Button>
            </Box>

            {/* Table */}
            {permLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : permissions.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 5 }}>
                <Typography color="text.secondary">
                  Koi request nahi hai.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: "#f9fafb" }}>
                    <TableRow>
                      <TableCell>
                        <b>Executive</b>
                      </TableCell>
                      <TableCell>
                        <b>Client Name</b>
                      </TableCell>
                      <TableCell>
                        <b>Phone</b>
                      </TableCell>
                      <TableCell>
                        <b>Inquiry Date</b>
                      </TableCell>
                      <TableCell>
                        <b>Requested On</b>
                      </TableCell>
                      <TableCell>
                        <b>Status</b>
                      </TableCell>
                      <TableCell align="center">
                        <b>Action</b>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* ✅ slice se sirf current page ke records dikhao */}
                    {permissions
                      .slice(
                        permPage * permRowsPerPage,
                        permPage * permRowsPerPage + permRowsPerPage,
                      )
                      .map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell>
                            {row.requestedByUser?.name || "—"}
                          </TableCell>
                          <TableCell>{row.clientName || "—"}</TableCell>
                          <TableCell>{row.phoneNumber || "—"}</TableCell>
                          <TableCell>{row.inquiryDate || "—"}</TableCell>
                          <TableCell>
                            {row.createdAt
                              ? new Date(row.createdAt).toLocaleDateString(
                                  "en-IN",
                                )
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={row.status}
                              size="small"
                              color={
                                row.status === "PENDING"
                                  ? "warning"
                                  : row.status === "APPROVED"
                                    ? "success"
                                    : row.status === "REJECTED"
                                      ? "error"
                                      : "default"
                              }
                            />
                          </TableCell>
                          <TableCell align="center">
                            {row.status === "PENDING" ? (
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                  justifyContent: "center",
                                }}
                              >
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  startIcon={<CheckCircleIcon />}
                                  onClick={() =>
                                    updatePermission({
                                      id: row.id,
                                      status: "APPROVED",
                                    })
                                  }
                                  sx={{ borderRadius: 2, fontSize: "0.75rem" }}
                                >
                                  Approve
                                </Button>
                                {/* <Button
                                  size="small"
                                  variant="contained"
                                  color="error"
                                  startIcon={<CancelIcon />}
                                  onClick={() =>
                                    updatePermission({
                                      id: row.id,
                                      status: "REJECTED",
                                    })
                                  }
                                  sx={{ borderRadius: 2, fontSize: "0.75rem" }}
                                >
                                  Reject
                                </Button> */}
                              </Box>
                            ) : (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {row.status === "USED"
                                  ? "Entry Completed✅"
                                  : "—"}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          <TablePagination
            component="div"
            count={permissions.length}
            page={permPage}
            onPageChange={(e, newPage) => setPermPage(newPage)}
            rowsPerPage={permRowsPerPage}
            rowsPerPageOptions={[50]}
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} of ${count} requests`
            }
            sx={{
              borderTop: "1px solid #e5e7eb",
              backgroundColor: "#f9fafb",
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;
