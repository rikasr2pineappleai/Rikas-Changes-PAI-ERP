const REMEMBERED_LOGIN_KEY = "paiERPRememberedLogin";

const emptyRememberedLogin = { email: "", password: "", remember: false };

const getStorage = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage;
};

export const getRememberedLogin = () => {
  try {
    const storage = getStorage();
    if (!storage) return emptyRememberedLogin;

    const savedLogin = storage.getItem(REMEMBERED_LOGIN_KEY);
    if (!savedLogin) return emptyRememberedLogin;

    const parsed = JSON.parse(savedLogin);
    return {
      email: typeof parsed.email === "string" ? parsed.email : "",
      password: typeof parsed.password === "string" ? parsed.password : "",
      remember: true,
    };
  } catch (error) {
    console.error("Error reading remembered login:", error);
    return emptyRememberedLogin;
  }
};

export const saveRememberedLogin = ({ email, password }) => {
  try {
    const storage = getStorage();
    if (!storage) return;

    storage.setItem(
      REMEMBERED_LOGIN_KEY,
      JSON.stringify({
        email: (email || "").trim(),
        password: password || "",
      })
    );
  } catch (error) {
    console.error("Error saving remembered login:", error);
  }
};

export const clearRememberedLogin = () => {
  try {
    const storage = getStorage();
    storage?.removeItem(REMEMBERED_LOGIN_KEY);
  } catch (error) {
    console.error("Error clearing remembered login:", error);
  }
};
