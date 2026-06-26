const PROXY_URL = process.env.PROXY_URL ?? "http://localhost:3000";

const CALLS: { method: string; path: string; upstream: string }[] = [
  // Valid calls
  {method: "GET", path: "/posts/10", upstream: "https://jsonplaceholder.typicode.com"},

  // HTTP errors — real API
  { method: "GET", path: "/posts/99999", upstream: "https://jsonplaceholder.typicode.com" },
  { method: "GET", path: "/nonexistent", upstream: "https://jsonplaceholder.typicode.com" },
  { method: "GET", path: "/users/0", upstream: "https://jsonplaceholder.typicode.com" },
  { method: "GET", path: "/9999", upstream: "https://jsonplaceholder.typicode.com" },
  { method: "POST", path: "/posts/99999", upstream: "https://jsonplaceholder.typicode.com" },

  // Connection errors — dead server
  { method: "GET", path: "/api/data", upstream: "http://localhost:9999" },
  { method: "POST", path: "/api/data", upstream: "http://localhost:9999" },
  { method: "GET", path: "/health", upstream: "http://localhost:9999" },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInterval(): number {
  return 3000 + Math.random() * 2000;
}

async function sendRequest(method: string, path: string, upstream: string): Promise<void> {
  const url = PROXY_URL + path;
  const isPost = method === "POST";

  console.log(`→ ${method} ${url} (upstream: ${upstream})`);

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "x-sherlock-upstream": upstream,
        "x-sherlock-service": "demo-app",
        ...(isPost ? { "Content-Type": "application/json" } : {}),
      },
      body: isPost ? JSON.stringify({ title: "demo", body: "test", userId: 1 }) : undefined,
    });
    console.log(`← ${res.status} ${res.statusText}  (${method} ${path})`);
  } catch (err) {
    console.log(`✗ connection error  (${method} ${path}): ${(err as Error).message}`);
  }
}

async function loop(): Promise<void> {
  const { method, path, upstream } = pick(CALLS);
  await sendRequest(method, path, upstream);
  setTimeout(loop, randomInterval());
}

console.log(`Demo app started — sending requests to ${PROXY_URL} every 3–5s`);
loop();