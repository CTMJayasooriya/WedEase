/**
 * Health check controller.
 * Returns basic API status so we can verify the backend server is running.
 */
export const getHealthStatus = (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "WedEase API is running",
    timestamp: new Date().toISOString(),
  });
};

