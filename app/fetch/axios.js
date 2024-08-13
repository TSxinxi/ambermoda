import axios from "axios";

const service = axios.create({
  // baseURL: '',  // api的base_url
  // withCredentials: true,
  timeout: 60000 // 请求超时时间
});

service.interceptors.request.use(config => {
  return config;
}, error => { //请求错误处理
  Promise.reject(error)
});


service.interceptors.response.use(
  response => {
    return response
  },
  error => {
    return Promise.reject(error)
  }
);

export default service
