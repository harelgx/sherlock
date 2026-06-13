const PROXY_URL = process.env.PROXY_URL ?? "http://localhost:3000";
const DEAD_URL = "http://localhost:9999/api/data";

const CALLS: { method: string; path: string }[] = [
  { method: "GET", path: "/posts/1" },
  { method: "GET", path: "/users/1" },
  { method: "GET", path: "/posts/2" },
  { method: "GET", path: "/users/2" },
  { method: "GET", path: "/posts/99999" },
  { method: "GET", path: "/nonexistent" },
  { method: "GET", path: "/users/0" },
  { method: "POST", path: "/posts" },
  { method: "GET", path: "http://fake-upstream-that-doesnt-exist.internal/api/data" },
  { method: "GET", path: DEAD_URL },
  { method: "POST", path: DEAD_URL },
  { method: "GET", path: DEAD_URL },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInterval(): number {
  return 3000 + Math.random() * 2000;
}

async function sendRequest(method: string, path: string): Promise<void> {
  const url = path.startsWith("http") ? path : PROXY_URL + path;
  const isPost = method === "POST";

  console.log(`→ ${method} ${url}`);

  try {
    const res = await fetch(url, {
      method,
      headers: isPost ? { "Content-Type": "application/json" } : undefined,
      body: isPost ? JSON.stringify({ title: "demo", body: "test", userId: 1 }) : undefined,
    });
    console.log(`← ${res.status} ${res.statusText}  (${method} ${path})`);
  } catch (err) {
    console.log(`✗ connection error  (${method} ${path}): ${(err as Error).message}`);
  }
}

async function loop(): Promise<void> {
  const { method, path } = pick(CALLS);
  await sendRequest(method, path);
  setTimeout(loop, randomInterval());
}

console.log(`Demo app started — sending requests to ${PROXY_URL} every 3–5s`);
loop();
