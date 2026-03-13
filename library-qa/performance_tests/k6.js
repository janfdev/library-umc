import http from "k6/http";
import { check, sleep } from "k6";

let options = {
  stages: [
    {duration: "10s", target: 10},
    {duration: "30s", target: 10},
    {duration: "10s", target: 0}
  ],
  treshold: {
    // NFR-01: Waktu respon API harus di bawah 2000 ms (2 detik) untuk 95% request
    http_req_duration: ["p(95)<2000"],
    // Toleransi error maksimal 1%
    http_req_failed: ["rate<0.01"],
  }
}

const userScenario = () => {
  const url = "https://api-library-be.leapcell.app/api/books";
  let res = http.get(url);
  check(res,{
    "Status API adalah 200 OK": (r) => r.status === 200,
    "Waktu response di bawah 2 detik": (r) => r.timings.duration < 2000,
  });
  sleep(1);
}

export { options };
export default userScenario;