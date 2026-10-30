import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, phone = "+79990000000") {
  await page.goto("/login");
  await page.getByLabel("Телефон", { exact: true }).fill(phone);
  await page.getByLabel("Пароль", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.getByRole("status", { name: "", exact: true }).filter({ hasText: /^connected$/ })).toBeVisible();
  await expect(page.getByText("Загрузка сообщений...", { exact: true })).toHaveCount(0);
}

async function send(page: Page, text: string) {
  await page.getByLabel("Сообщение", { exact: true }).fill(text);
  await page.getByRole("button", { name: "Отправить", exact: true }).click();
}

test("защита маршрутов, сохранение токена, перезагрузка и выход", async ({ page }) => {
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("link", { name: "Профиль" })).toHaveCount(0);
  await login(page);
  expect(await page.evaluate(() => localStorage.getItem("messenger_token"))).toBe("token-u1");
  await page.reload();
  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.getByRole("list", { name: "Сообщения" })).toContainText("Привет! Это история сообщений.");
  await page.goto("/login");
  await expect(page).toHaveURL(/\/chat$/);
  await page.getByRole("button", { name: "Выйти", exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem("messenger_token"))).toBeNull();
  await page.goto("/chat");
  await expect(page).toHaveURL(/\/login$/);
});

test("неверный пароль и блокировка кнопки при входе", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Пароль", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Неверный телефон или пароль");
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem("messenger_token"))).toBeNull();
  await page.route("**/auth/login", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    await route.fulfill({ status: 401, json: { message: "Неверный телефон или пароль" } });
  });
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page.getByRole("button", { name: "Входим..." })).toBeDisabled();
});

test("профиль: Fetch GET, Axios PUT и сохранение после перезагрузки", async ({ page, request }) => {
  await login(page);
  await page.getByRole("link", { name: "Профиль", exact: true }).click();
  await expect(page.getByLabel("Никнейм", { exact: true })).toBeVisible();
  const oldName = await page.getByLabel("Никнейм", { exact: true }).inputValue();
  const oldBio = await page.getByLabel("Описание", { exact: true }).inputValue();
  try {
    await page.getByLabel("Никнейм", { exact: true }).fill("Студент второго курса");
    await page.getByLabel("Описание", { exact: true }).fill("Изучаю React и WebSocket.");
    const update = page.waitForRequest((req) => req.method() === "PUT" && req.url().endsWith("/users/me"));
    await page.getByRole("button", { name: "Сохранить", exact: true }).click();
    const req = await update;
    expect(req.headers().authorization).toBe("Bearer token-u1");
    expect(req.postDataJSON()).toEqual({ nickname: "Студент второго курса", bio: "Изучаю React и WebSocket." });
    await expect(page.getByRole("status")).toHaveText("Профиль сохранён.");
    await expect(page.getByRole("region", { name: "Данные профиля" })).toContainText("+79990000000");
    await page.reload();
    await expect(page.getByLabel("Никнейм", { exact: true })).toHaveValue("Студент второго курса");
    await expect(page.getByLabel("Описание", { exact: true })).toHaveValue("Изучаю React и WebSocket.");
    await page.getByLabel("Никнейм", { exact: true }).fill("   ");
    await expect(page.getByRole("button", { name: "Сохранить", exact: true })).toBeDisabled();
  } finally {
    await request.put("http://localhost:3001/users/me", {
      headers: { Authorization: "Bearer token-u1" }, data: { nickname: oldName, bio: oldBio }
    });
  }
});

test("три пользователя получают сообщения по WebSocket и HTTP без дублей", async ({ browser }) => {
  const contexts = await Promise.all([browser.newContext(), browser.newContext(), browser.newContext()]);
  try {
    const pages = await Promise.all(contexts.map((context) => context.newPage()));
    for (let index = 0; index < pages.length; index++) {
      await login(pages[index], `+7999000000${index}`);
    }
    const texts = [`WS Alex ${Date.now()}`, `HTTP Maria ${Date.now()}`, `WS Sam ${Date.now()}`];
    await pages[1].getByLabel("Способ отправки", { exact: true }).selectOption("http");
    for (let index = 0; index < pages.length; index++) {
      await send(pages[index], `  ${texts[index]}  `);
      for (const page of pages) {
        await expect(page.getByRole("list", { name: "Сообщения" }).getByText(texts[index], { exact: true })).toHaveCount(1);
      }
      await expect(pages[index].getByLabel("Сообщение", { exact: true })).toHaveValue("");
    }
    await pages[0].getByLabel("Сообщение", { exact: true }).fill("   ");
    await expect(pages[0].getByRole("button", { name: "Отправить", exact: true })).toBeDisabled();
    await pages[2].reload();
    for (const text of texts) {
      await expect(pages[2].getByRole("list", { name: "Сообщения" }).getByText(text, { exact: true })).toHaveCount(1);
    }
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
  }
});

test("401 с пустым телом очищает недействительный токен", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("messenger_token", "invalid-token"));
  await page.route("**/users/me", (route) => route.fulfill({ status: 401, body: "" }));
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("status")).toHaveText("Сессия завершена. Войдите снова.");
  expect(await page.evaluate(() => localStorage.getItem("messenger_token"))).toBeNull();
});

for (const [label, body, message] of [
  ["пустой ответ", "", "Сервер вернул пустой ответ."],
  ["некорректный JSON", "{broken", "Сервер вернул некорректный JSON."],
  ["неверная схема", "{}", "Сервер вернул неверный список сообщений."]
]) {
  test(`Fetch: ${label} отображается пользователю`, async ({ page }) => {
    await login(page);
    await page.route("**/messages", (route) => route.fulfill({ status: 200, contentType: "application/json", body }));
    await page.getByRole("button", { name: "Обновить чат", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText(message);
    await page.unroute("**/messages");
    await page.getByRole("button", { name: "Обновить чат", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveCount(0);
  });
}

for (const [label, body, message] of [
  ["пустой ответ", "", "Сервер вернул пустой ответ."],
  ["некорректный JSON", "{broken", "Сервер вернул некорректный JSON."]
]) {
  test(`Axios: ${label} при входе`, async ({ page }) => {
    await page.route("**/auth/login", (route) => route.fulfill({ status: 200, contentType: "application/json", body }));
    await page.goto("/login");
    await page.getByRole("button", { name: "Войти", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText(message);
    await expect(page).toHaveURL(/\/login$/);
  });
}

test("ошибка сети Axios при входе", async ({ page }) => {
  await page.route("**/auth/login", (route) => route.abort("failed"));
  await page.goto("/login");
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Не удалось связаться с сервером");
});

test("ошибка сети Fetch и повторная загрузка истории", async ({ page }) => {
  await login(page);
  await page.route("**/messages", (route) => route.abort("failed"));
  await page.getByRole("button", { name: "Обновить чат", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Не удалось связаться с сервером");
  await page.unroute("**/messages");
  await page.getByRole("button", { name: "Обновить чат", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("при ошибке HTTP-отправки текст сохраняется, 401 завершает сессию", async ({ page }) => {
  await login(page);
  await page.getByLabel("Способ отправки", { exact: true }).selectOption("http");
  await page.route("**/messages", (route) => route.request().method() === "POST"
    ? route.fulfill({ status: 500, json: { message: "Не удалось сохранить сообщение" } }) : route.continue());
  await send(page, "Текст не должен пропасть");
  await expect(page.getByRole("alert")).toHaveText("Не удалось сохранить сообщение");
  await expect(page.getByLabel("Сообщение", { exact: true })).toHaveValue("Текст не должен пропасть");
  await page.unroute("**/messages");
  await page.route("**/messages", (route) => route.request().method() === "POST"
    ? route.fulfill({ status: 401, body: "" }) : route.continue());
  await page.getByRole("button", { name: "Отправить", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem("messenger_token"))).toBeNull();
});

test("disconnected блокирует отправку", async ({ page }) => {
  await page.routeWebSocket("ws://localhost:3001", (socket) => socket.close());
  await page.goto("/login");
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page.getByText("disconnected", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Сообщение", { exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Отправить", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Подключиться снова", exact: true })).toBeVisible();
});

test("ошибки WebSocket: некорректный JSON и отказ в авторизации", async ({ page }) => {
  await page.routeWebSocket("ws://localhost:3001", (socket) => {
    socket.send("{broken");
    socket.onMessage(() => socket.send(JSON.stringify({ type: "error", payload: "Нет доступа: авторизуйтесь" })));
  });
  await login(page);
  await expect(page.getByRole("alert")).toHaveText("Сервер вернул некорректный JSON.");
  await send(page, "Проверка авторизации");
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem("messenger_token"))).toBeNull();
});

test("событие сокета не теряется при запоздавшем ответе истории", async ({ page }) => {
  await page.route("**/messages", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    await new Promise((resolve) => setTimeout(resolve, 400));
    await route.fulfill({ status: 200, json: [] });
  });
  const text = `Сообщение во время загрузки ${Date.now()}`;
  await page.routeWebSocket("ws://localhost:3001", (socket) => {
    socket.send(JSON.stringify({ type: "message:new", payload: {
      id: "race-test-message", userId: "u2", author: "Maria", text, createdAt: new Date().toISOString()
    } }));
  });
  await login(page);
  await expect(page.getByText(text, { exact: true })).toBeVisible();
  await expect(page.getByText("Загрузка сообщений...", { exact: true })).toHaveCount(0);
  await expect(page.getByText(text, { exact: true })).toHaveCount(1);
});

test("мобильный экран не имеет горизонтального переполнения", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("link", { name: "Профиль", exact: true }).click();
  await expect(page.getByLabel("Никнейм", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("страницы открываются без ошибок JavaScript", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/login");
  await page.screenshot({ path: "../docs/login.png", fullPage: true });
  await login(page);
  await page.screenshot({ path: "../docs/chat.png", fullPage: true });
  await page.getByRole("link", { name: "Профиль", exact: true }).click();
  await expect(page.getByLabel("Никнейм", { exact: true })).toBeVisible();
  await page.screenshot({ path: "../docs/profile.png", fullPage: true });
  expect(errors).toEqual([]);
});
