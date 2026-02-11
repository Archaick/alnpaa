// src/.../BackupManager.jsx - FINAL OPTIMIZED VERSION
import React, { useMemo, useState } from "react";
import {
    Button,
    Group,
    Text,
    Progress,
    FileInput,
    Modal,
} from "@mantine/core";

import {
    collection,
    getDocs,
    query,
    where,
    writeBatch,
    doc,
} from "firebase/firestore";

import { db } from "../../../firebaseConfig";

import {
    IconCheck,
    IconAlertCircle,
    IconDatabaseExport,
    IconDatabaseImport,
    IconRefresh,
} from "@tabler/icons-react";

import styles from "./BackupManager.module.css";
import { useTranslation } from "react-i18next";

const LAST_BACKUP_STORAGE_KEY = "alnpaa:lastBackupAt";

const BackupManager = ({ onImportComplete }) => {
    const { t, i18n } = useTranslation("dashboard/BackupManager");
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [file, setFile] = useState(null);
    const [lastBackupAt, setLastBackupAt] = useState(() => {
        try {
            return localStorage.getItem(LAST_BACKUP_STORAGE_KEY);
        } catch (err) {
            console.error("Failed to load last backup time:", err);
            return null;
        }
    });

    const [resultModal, setResultModal] = useState({
        open: false,
        success: false,
        message: "",
    });

    const certCollection = collection(db, "certificates");
    const QUERY_CHUNK_SIZE = 10; // Firestore "in" limit
    const BATCH_WRITE_LIMIT = 500; // Firestore batch limit

    const lastBackupText = useMemo(() => {
        if (!lastBackupAt) return t("lastBackupNever");
        const parsedDate = new Date(lastBackupAt);
        if (Number.isNaN(parsedDate.getTime())) return t("lastBackupNever");

        return new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-SA" : "en-US", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(parsedDate);
    }, [i18n.language, lastBackupAt, t]);

    /* -------------------------------------------------------
       EXPORT BACKUP - Optimized for large datasets
    ------------------------------------------------------- */
    const handleExport = async () => {
        setExporting(true);
        setProgress(0);

        try {
            const snapshot = await getDocs(certCollection);

            const allCertificates = snapshot.docs.map((doc) => ({
                name: doc.data().name,
                program: doc.data().program,
                code: doc.data().code,
                createdAt:
                    doc.data().createdAt?.toDate?.()?.toISOString() ||
                    new Date().toISOString(),
            }));

            const dataStr = JSON.stringify(allCertificates, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            const timestamp = new Date().toISOString().split("T")[0];
            link.download = `certificates-backup-${timestamp}.json`;
            link.click();

            URL.revokeObjectURL(url);
            const backupTime = new Date().toISOString();
            try {
                localStorage.setItem(LAST_BACKUP_STORAGE_KEY, backupTime);
                setLastBackupAt(backupTime);
            } catch (err) {
                console.error("Failed to save last backup time:", err);
            }

            setResultModal({
                open: true,
                success: true,
                message: t("messages.exportSuccess", { count: allCertificates.length }),
            });
        } catch (err) {
            console.error("Export error:", err);
            setResultModal({
                open: true,
                success: false,
                message: t("messages.exportFailed"),
            });
        } finally {
            setExporting(false);
            setProgress(0);
        }
    };

    /* -------------------------------------------------------
       IMPORT BACKUP - Optimized with smart duplicate checking
       - Uses batched queries (10 at a time due to 'in' limit)
       - Uses writeBatch for efficient writes (500 at a time)
       - Only queries codes being imported (not entire DB)
    ------------------------------------------------------- */
    const handleImport = async () => {
        if (!file) return alert(t("messages.noFile"));

        setImporting(true);
        setProgress(0);

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (!Array.isArray(data)) {
                throw new Error(t("messages.invalidFormat"));
            }

            // Validate all records first
            for (const cert of data) {
                if (!cert.name || !cert.program || !cert.code) {
                    throw new Error(t("messages.missingFields"));
                }
            }

            let imported = 0;
            let skipped = 0;
            const totalItems = data.length;
            let currentBatch = writeBatch(db);
            let batchCount = 0;

            // Process in chunks of 10 (Firestore 'in' query limit)
            for (let i = 0; i < data.length; i += QUERY_CHUNK_SIZE) {
                const chunk = data.slice(i, i + QUERY_CHUNK_SIZE);
                const codesToCheck = chunk.map((c) => c.code);

                // OPTIMIZATION: Only query the codes in this chunk
                const existingQuery = query(
                    certCollection,
                    where("code", "in", codesToCheck)
                );

                const existingSnapshot = await getDocs(existingQuery);

                const existingCodes = new Set();
                existingSnapshot.docs.forEach((doc) => {
                    existingCodes.add(doc.data().code);
                });

                // Add non-duplicates to batch
                for (const cert of chunk) {
                    if (existingCodes.has(cert.code)) {
                        skipped++;
                    } else {
                        const newDocRef = doc(certCollection);
                        currentBatch.set(newDocRef, {
                            name: cert.name,
                            program: cert.program,
                            code: cert.code,
                            createdAt: cert.createdAt
                                ? new Date(cert.createdAt)
                                : new Date(),
                        });

                        imported++;
                        batchCount++;

                        // Commit batch if we hit the 500 limit
                        if (batchCount >= BATCH_WRITE_LIMIT) {
                            await currentBatch.commit();
                            currentBatch = writeBatch(db);
                            batchCount = 0;
                        }
                    }
                }

                setProgress(((i + chunk.length) / totalItems) * 100);
            }

            // Commit any remaining writes
            if (batchCount > 0) {
                await currentBatch.commit();
            }

            setResultModal({
                open: true,
                success: true,
                message: `${t("messages.importSuccess", { imported, skipped: skipped > 0 ? t("messages.importSuccessSkipped", { skipped }) : "" })}`,
            });

            if (onImportComplete) onImportComplete();

            setFile(null);
        } catch (err) {
            console.error("Import error:", err);
            setResultModal({
                open: true,
                success: false,
                message: err.message || t("messages.importFailed"),
            });
        } finally {
            setImporting(false);
            setProgress(0);
        }
    };

    /* -------------------------------------------------------
       UI
    ------------------------------------------------------- */
    return (
        <div className={styles.backupContainer}>
            {/* ✅ Animated Header with Sync Icon */}
            <div className={styles.backupIndicator}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                    padding: "8px 14px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: "600",
                    border: "1px solid #bae6fd",
                    marginBottom: "12px",
                }}
            >
                <IconRefresh
                    size={24}
                    stroke={2}
                    color="#0284c7"
                    className={styles.syncIcon}
                />

                <div style={{ display: "flex", flexDirection: "column", lineHeight: "1.2" }}>
                    <span style={{ fontSize: "10px", fontWeight: "600", color: "#0369a1", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {t("dataSafety")}
                    </span>

                    <span style={{ fontSize: "15px", fontWeight: "700", color: "#0c4a6e" }}>
                        {t("backupRestore")}
                    </span>
                </div>
            </div>

            {/* ✅ Controls */}
            <div className={styles.lastBackupRow}>
                <Text size="xs" className={styles.lastBackupLabel}>
                    {t("lastBackupLabel")}
                </Text>
                <Text size="xs" className={styles.lastBackupValue}>
                    {lastBackupText}
                </Text>
            </div>

            <Group spacing="sm">
                <Button
                    leftIcon={<IconDatabaseExport size={16} />}
                    onClick={handleExport}
                    loading={exporting}
                    variant="light"
                    color="blue"
                    size="sm"
                >
                    {t("exportBackup")}
                </Button>

                <FileInput
                    placeholder={t("chooseBackupFile")}
                    value={file}
                    onChange={setFile}
                    accept=".json"
                    size="sm"
                    style={{ flex: 1, maxWidth: "200px" }}
                    disabled={importing}
                />

                <Button
                    leftIcon={<IconDatabaseImport size={16} />}
                    onClick={handleImport}
                    loading={importing}
                    disabled={!file}
                    variant="light"
                    color="green"
                    size="sm"
                >
                    {t("importBackup")}
                </Button>
            </Group>

            {/* ✅ Progress */}
            {(importing || exporting) && (
                <div className={styles.progressContainer}>
                    <Progress value={progress} size="sm" radius="xl" striped animate />
                    <Text size="xs" color="dimmed" mt={4}>
                        {importing ? t("importing") : t("exporting")}... {Math.round(progress)}%
                    </Text>
                </div>
            )}

            {/* ✅ Result Modal */}
            <Modal
                opened={resultModal.open}
                onClose={() =>
                    setResultModal({ open: false, success: false, message: "" })
                }
                title={resultModal.success ? t("success") : t("error")}
                centered
                size="sm"
            >
                <Group spacing="sm" align="flex-start">
                    {resultModal.success ? (
                        <IconCheck size={24} color="green" />
                    ) : (
                        <IconAlertCircle size={24} color="red" />
                    )}

                    <Text style={{ whiteSpace: "pre-line", flex: 1 }}>
                        {resultModal.message}
                    </Text>
                </Group>
            </Modal>
        </div>
    );
};

export default BackupManager; 
