import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api/v1", // Replace with your server URL
});

export default api;
