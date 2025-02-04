import axios from "axios";

export function fetchJsonData(dataPath) {
  return new Promise((resolve, reject) => {
    axios
      .get(dataPath)
      .then((res) => {
        if (res?.status === 200) {
          resolve(res.data);
        } else {
          resolve(null);
        }
      })
      .catch((err) => {
        ElMessage.error("错误(" + err.code + "): " + err.message);
        reject(err);
      });
  });
}
