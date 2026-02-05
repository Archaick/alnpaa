import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../firebaseConfig";
import { TextInput, PasswordInput, Button, Card, Stack, Title, Text } from "@mantine/core";
import { IconLock, IconAlertCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import LanguageToggle from "../LanguageToggle";
import styles from "./AdminLogin.module.css";

const AdminLogin = ({ onLoginSuccess }) => {
  const { t } = useTranslation("auth/AdminLogin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        // If no callback, reload or redirect
        window.location.href = "/admin";
      }
    } catch (err) {
      console.error("Login error:", err);

      // User-friendly error messages
      let errorMessage = t("errors.invalidEmailOrPassword");

      if (err && err.code === "auth/invalid-email") {
        errorMessage = t("errors.invalidEmail");
      } else if (err && err.code === "auth/user-not-found") {
        errorMessage = t("errors.userNotFound");
      } else if (err && err.code === "auth/wrong-password") {
        errorMessage = t("errors.wrongPassword");
      } else if (err && err.code === "auth/too-many-requests") {
        errorMessage = t("errors.tooManyRequests");
      } else if (err && err.code === "auth/network-request-failed") {
        errorMessage = t("errors.networkError");
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
    // Fallback: if still no error and not loading, show generic error
    setTimeout(() => {
      if (!loading && !error) {
        setError(t("errors.loginFailed"));
      }
    }, 2000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.backgroundPattern}></div>

      <LanguageToggle position="top-right" />

      <Card className={styles.loginCard}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <IconLock size={36} />
          </div>
          <Title order={1} className={styles.title}>
            {t("title")}
          </Title>
          <Text className={styles.subtitle}>
            {t("subtitle")}
          </Text>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <Text>
              <IconAlertCircle size={18} />
              {error}
            </Text>
          </div>
        )}

        <form onSubmit={handleLogin} className={styles.form}>
          <TextInput
            label={t("emailLabel")}
            placeholder={t("emailPlaceholder")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            size="md"
            classNames={{
              input: styles.input,
              label: styles.label
            }}
          />

          <PasswordInput
            label={t("passwordLabel")}
            placeholder={t("passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            size="md"
            classNames={{
              input: styles.input,
              label: styles.label
            }}
          />

          <Button
            type="submit"
            className={styles.submitButton}
            loading={loading}
            disabled={loading || !email || !password}
            fullWidth
            size="md"
          >
            {loading ? t("signingInButton") : t("signInButton")}
          </Button>
        </form>

        <div className={styles.footer}>
          <Text className={styles.footerText}>
            {t("footerText")}
          </Text>
        </div>

        <div className={styles.subFooter}>
          <Text className={styles.subFooterText}>
            {t("subFooterText")}
          </Text>
        </div>

      </Card>
    </div>
  );
};

export default AdminLogin;