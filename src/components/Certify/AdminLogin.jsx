import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../firebaseConfig";
import { TextInput, PasswordInput, Button, Card, Stack, Title, Text } from "@mantine/core";
import { IconLock, IconAlertCircle } from "@tabler/icons-react";
import styles from "./AdminLogin.module.css";

const AdminLogin = ({ onLoginSuccess }) => {
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
      let errorMessage = "Invalid email or password";

      if (err && err.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address";
      } else if (err && err.code === "auth/user-not-found") {
        errorMessage = "No account found with this email";
      } else if (err && err.code === "auth/wrong-password") {
        errorMessage = "Incorrect password";
      } else if (err && err.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later";
      } else if (err && err.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
    // Fallback: if still no error and not loading, show generic error
    setTimeout(() => {
      if (!loading && !error) {
        setError("Login failed. Please try again or check your credentials.");
      }
    }, 2000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.backgroundPattern}></div>

      <Card className={styles.loginCard}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <IconLock size={36} />
          </div>
          <Title order={1} className={styles.title}>
            Admin Login
          </Title>
          <Text className={styles.subtitle}>
            MTI Certificate Management
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
            label="Email Address"
            placeholder="admin@example.com"
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
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            size="md"
            visibilityToggle
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
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className={styles.footer}>
          <Text className={styles.footerText}>
            Secure Certificate Management System
          </Text>
        </div>

        <div className={styles.subFooter}>
          <Text className={styles.subFooterText}>
            Product by Markaz Tadarus Indonesia
          </Text>
        </div>

      </Card>
    </div>
  );
};

export default AdminLogin;