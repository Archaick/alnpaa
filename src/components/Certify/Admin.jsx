// src/.../Admin.jsx - Final Refactored Version
import React, { useState, useEffect, useRef } from "react";
import styles from "./Admin.module.css";
import { db, auth } from "../../../firebaseConfig";
import QrStats from "./QrStats";
import BackupManager from "./BackupManager";
import {
    collection,
    getDocs,
    getDoc,
    setDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    startAfter,
    limit as firestoreLimit,
    getCountFromServer,
} from "firebase/firestore";
import {
    Button,
    TextInput,
    Table,
    Title,
    Group,
    Image,
    Pagination,
    Modal,
    Text,
    PasswordInput,
    Alert,
} from "@mantine/core";
import { IconCheck, IconX, IconAlertTriangle, IconInfoCircle, IconDownload, IconTrash } from '@tabler/icons-react';
import QRCode from "qrcode";
import LoadingOverlay from "../LoadingOverlay";
import {
    reauthenticateWithCredential,
    EmailAuthProvider,
    signOut,
} from "firebase/auth";
import { useTranslation } from "react-i18next";
import LanguageToggle from "../LanguageToggle";

const ITEMS_PER_PAGE = 5;
const MAX_RETRIES = 3;
const INPUT_MAX_LENGTH = 200;

const Admin = () => {
    const { t } = useTranslation("dashboard/Admin");
    const [certificates, setCertificates] = useState([]);
    const [newCert, setNewCert] = useState({ name: "", program: "" });
    const [searchTerm, setSearchTerm] = useState("");
    const [qrCodes, setQrCodes] = useState({});
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(null);
    const [needsCountRefresh, setNeedsCountRefresh] = useState(true);
    const pageCursorsRef = useRef({});
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [reauthPassword, setReauthPassword] = useState("");
    const [notification, setNotification] = useState(null);

    const certCollection = collection(db, "certificates");

    // ========== NOTIFICATION SYSTEM ==========
    const showNotification = (type, title, message) => {
        const config = {
            success: { icon: <IconCheck size={20} />, color: "teal" },
            error: { icon: <IconX size={20} />, color: "red" },
            warning: { icon: <IconAlertTriangle size={20} />, color: "yellow" },
            info: { icon: <IconInfoCircle size={20} />, color: "blue" },
        };

        setNotification({ ...config[type], title, message });
        setTimeout(() => setNotification(null), type === "error" ? 5000 : 4000);
    };

    // ========== CODE GENERATION ==========
    const generateSecureCode = () => {
        const array = new Uint8Array(6);
        crypto.getRandomValues(array);
        return Array.from(array)
            .map((b) => b.toString(36).toUpperCase())
            .join("")
            .substring(0, 8);
    };

    const isCodeUnique = async (code) => {
        try {
            const certRef = doc(db, "certificates", code);
            const snapshot = await getDoc(certRef);
            return !snapshot.exists();
        } catch (err) {
            console.error("Error checking code uniqueness:", err);
            return false;
        }
    };

    const generateUniqueCode = async () => {
        for (let i = 0; i < MAX_RETRIES; i++) {
            const code = generateSecureCode();
            if (await isCodeUnique(code)) return code;
        }
        throw new Error("Failed to generate unique code after multiple attempts");
    };

    // ========== UTILITIES ==========
    const sanitizeInput = (input) =>
        input.trim().replace(/[<>]/g, "").substring(0, INPUT_MAX_LENGTH);

    const sanitizeFilename = (s) =>
        s.replace(/[^\w\-_. ]+/g, "").replace(/\s+/g, "_");

    const verifyAdminAuth = () => {
        const user = auth?.currentUser;
        if (!user) {
            showNotification("error", t("errors.notAuthenticated"), t("errors.notAuthenticatedMessage"));
            setTimeout(() => signOut(auth).then(() => (window.location.href = "/cert-login")), 2000);
            return false;
        }
        return true;
    };

    // ========== QR CODE GENERATION ==========
    const generateQRCodes = async (certData) => {
        try {
            const results = await Promise.all(
                certData.map(async (cert) => {
                    const qrDataUrl = await QRCode.toDataURL(
                        `${window.location.origin}/verify/${cert.code}`,
                        { errorCorrectionLevel: "H", margin: 2, width: 300 }
                    );
                    return [cert.id, qrDataUrl];
                })
            );
            return Object.fromEntries(results);
        } catch (err) {
            console.error("QR generation error:", err);
            return {};
        }
    };

    // ========== FETCH CERTIFICATES ==========
    const ensureCursorForPage = async (pageNum) => {
        if (pageNum <= 1) return null;
        if (pageCursorsRef.current[pageNum - 1]) {
            return pageCursorsRef.current[pageNum - 1];
        }

        let cursor = null;
        for (let p = 1; p <= pageNum - 1; p++) {
            const q = cursor
                ? query(certCollection, orderBy("createdAt", "desc"), startAfter(cursor), firestoreLimit(ITEMS_PER_PAGE))
                : query(certCollection, orderBy("createdAt", "desc"), firestoreLimit(ITEMS_PER_PAGE));
            const snap = await getDocs(q);
            if (snap.docs.length === 0) {
                return null;
            }
            cursor = snap.docs[snap.docs.length - 1];
            pageCursorsRef.current[p] = cursor;
        }
        return cursor;
    };

    const fetchCountIfNeeded = async () => {
        if (!needsCountRefresh && totalCount !== null) return;
        const snapshot = await getCountFromServer(certCollection);
        const count = snapshot.data().count || 0;
        setTotalCount(count);
        setTotalPages(Math.max(1, Math.ceil(count / ITEMS_PER_PAGE)));
        setNeedsCountRefresh(false);
    };

    const fetchCertificates = async (pageNum = 1) => {
        // Only sign out if truly unauthenticated
        if (!verifyAdminAuth()) return;

        setLoading(true);
        try {
            const cursor = await ensureCursorForPage(pageNum);
            const qQuery = cursor
                ? query(certCollection, orderBy("createdAt", "desc"), startAfter(cursor), firestoreLimit(ITEMS_PER_PAGE))
                : query(certCollection, orderBy("createdAt", "desc"), firestoreLimit(ITEMS_PER_PAGE));

            const snapshot = await getDocs(qQuery);
            const certData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

            setCertificates(certData);
            if (snapshot.docs.length > 0) {
                pageCursorsRef.current[pageNum] = snapshot.docs[snapshot.docs.length - 1];
            }

            setQrCodes(await generateQRCodes(certData));
            await fetchCountIfNeeded();
        } catch (err) {
            console.error("Error fetching certificates:", err);
            // Do NOT sign out, just show error
            showNotification("error", t("errors.failedToLoad"), err.message || t("errors.failedToLoadMessage"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCertificates(1);
    }, []);

    // ========== ADD CERTIFICATE ==========
    const handleAdd = async () => {
        const sanitizedName = sanitizeInput(newCert.name);
        const sanitizedProgram = sanitizeInput(newCert.program);

        if (!sanitizedName || !sanitizedProgram) {
            showNotification("warning", t("errors.invalidInput"), t("errors.invalidInputMessage"));
            return;
        }

        if (!verifyAdminAuth()) return;

        setActionLoading(true);
        try {
            const code = await generateUniqueCode();
            const newData = {
                name: sanitizedName,
                program: sanitizedProgram,
                code,
                createdAt: new Date(),
                createdBy: auth.currentUser.email,
            };

            const certRef = doc(db, "certificates", code);
            await setDoc(certRef, newData);
            const addedCert = { id: code, ...newData };

            const qrDataUrl = await QRCode.toDataURL(
                `${window.location.origin}/verify/${code}`,
                { errorCorrectionLevel: "H", margin: 2, width: 300 }
            );

            setCertificates((prev) => [addedCert, ...prev.slice(0, ITEMS_PER_PAGE - 1)]);
            setQrCodes((prev) => ({ ...prev, [code]: qrDataUrl }));
            setNewCert({ name: "", program: "" });
            setNeedsCountRefresh(true);

            showNotification("success", t("notifications.certificateAdded"), t("notifications.certificateAddedSuccess", { name: sanitizedName }));
        } catch (err) {
            console.error("Error adding certificate:", err);
            const errorMessage = err.code === "permission-denied"
                ? t("errors.permissionDenied")
                : err.message || "An unexpected error occurred.";
            showNotification("error", t("errors.addFailed"), errorMessage);
        } finally {
            setActionLoading(false);
        }
    };

    // ========== DELETE CERTIFICATE ==========
    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setReauthPassword("");
        setDeleteTargetId(null);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTargetId) {
            showNotification("warning", t("errors.noSelection"), t("errors.noSelectionMessage"));
            return;
        }

        const currentUser = auth?.currentUser;
        if (!currentUser) {
            showNotification("error", t("errors.notAuthenticated"), t("errors.notAuthenticatedMessage"));
            return;
        }

        if (!reauthPassword) {
            showNotification("warning", t("errors.passwordRequired"), t("errors.passwordRequiredMessage"));
            return;
        }

        setActionLoading(true);
        try {
            const cred = EmailAuthProvider.credential(currentUser.email, reauthPassword);
            await reauthenticateWithCredential(currentUser, cred);
            await deleteDoc(doc(db, "certificates", deleteTargetId));

            setCertificates((prev) => prev.filter((c) => c.id !== deleteTargetId));
            setQrCodes((prev) => {
                const { [deleteTargetId]: _, ...rest } = prev;
                return rest;
            });
            setNeedsCountRefresh(true);

            closeDeleteModal();
            showNotification("success", t("notifications.certificateDeleted"), t("notifications.certificateDeletedSuccess"));
        } catch (err) {
            console.error("Delete error:", err);
            const errorMessage = err.code === "auth/wrong-password"
                ? t("errors.incorrectPassword")
                : err.code === "permission-denied"
                    ? t("errors.permissionDenied")
                    : err.message || "Deletion failed.";
            showNotification("error", t("errors.deleteFailed"), errorMessage);
        } finally {
            setActionLoading(false);
        }
    };

    // ========== DOWNLOAD QR ==========
    const handleDownloadQR = (cert) => {
        const url = qrCodes[cert.id];
        if (!url) {
            showNotification("error", t("notifications.qrNotFound"), t("notifications.qrNotFoundMessage"));
            return;
        }

        const link = document.createElement("a");
        link.href = url;
        link.download = `QR_${sanitizeFilename(cert.name)}_${cert.code}.png`;
        link.click();

        showNotification("success", t("notifications.downloadStarted"), t("notifications.downloadSuccess"));
    };

    // ========== FILTERED CERTIFICATES ==========
    const filteredCertificates = certificates.filter((cert) =>
        cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.program.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <div className={styles.languageToggleWrapper}>
                <LanguageToggle position="inline" />
            </div>
            <Title order={2}>{t("title")}</Title>

            {notification && (
                <Alert
                    icon={notification.icon}
                    title={notification.title}
                    color={notification.color}
                    withCloseButton
                    onClose={() => setNotification(null)}
                    mb="md"
                    style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        zIndex: 1000,
                        maxWidth: '400px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                >
                    {notification.message}
                </Alert>
            )}

            <div className={styles.headerActions}>
                <QrStats />
                <Button
                    variant="outline"
                    color="red"
                    onClick={() => signOut(auth).then(() => (window.location.href = "/cert-login"))}
                    className={styles.logoutBtn}
                >
                    {t("buttons.logout")}
                </Button>
            </div>

            <BackupManager onImportComplete={() => { setNeedsCountRefresh(true); setPage(1); fetchCertificates(1); }} />

            <div className={styles.form}>
                <TextInput
                    label={t("labels.name")}
                    placeholder={t("placeholders.participantName")}
                    value={newCert.name}
                    onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                    disabled={actionLoading}
                    maxLength={INPUT_MAX_LENGTH}
                />
                <TextInput
                    label={t("labels.program")}
                    placeholder={t("placeholders.programName")}
                    value={newCert.program}
                    onChange={(e) => setNewCert({ ...newCert, program: e.target.value })}
                    disabled={actionLoading}
                    maxLength={INPUT_MAX_LENGTH}
                />
                <Button mt="sm" onClick={handleAdd} loading={actionLoading}>
                    {t("buttons.addCertificate")}
                </Button>
            </div>

            <TextInput
                placeholder={t("labels.search")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                mb="md"
            />

            {loading ? (
                <LoadingOverlay />
            ) : (
                <>
                    <Table striped highlightOnHover withBorder>
                        <thead className="table-head">
                            <tr>
                                <th>{t("labels.name")}</th>
                                <th>{t("labels.program")}</th>
                                <th>{t("labels.code")}</th>
                                <th>{t("labels.qr")}</th>
                                <th>{t("labels.actions")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCertificates.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: "2rem", textAlign: "center" }}>
                                        {t("notifications.certificateNotFound")}
                                    </td>
                                </tr>
                            ) : (
                                filteredCertificates.map((cert) => (
                                    <tr className="table-row" key={cert.id}>
                                        <td>{cert.name}</td>
                                        <td>{cert.program}</td>
                                        <td>{cert.code}</td>
                                        <td className={styles.qrCell}>
                                            {qrCodes[cert.id] && (
                                                <Image src={qrCodes[cert.id]} w={60} h={60} radius="md" />
                                            )}
                                        </td>
                                        <td>
                                            <Group spacing="xs" justify="center">
                                                <Button
                                                    color="blue"
                                                    size="s"
                                                    onClick={() => handleDownloadQR(cert)}
                                                    title="Download QR Code"
                                                    p="xs"
                                                >
                                                    <IconDownload size={16} />
                                                </Button>
                                                <Button
                                                    color="red"
                                                    size="s"
                                                    onClick={() => {
                                                        setDeleteTargetId(cert.id);
                                                        setReauthPassword("");
                                                        setDeleteModalOpen(true);
                                                    }}
                                                    title="Delete Certificate"
                                                    p="xs"
                                                >
                                                    <IconTrash size={16} />
                                                </Button>
                                            </Group>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>

                    {!searchTerm && totalPages > 1 && (
                        <Group justify="center" mt="lg">
                            <Pagination
                                value={page}
                                onChange={(p) => { setPage(p); fetchCertificates(p); }}
                                total={totalPages}
                            />
                        </Group>
                    )}
                </>
            )}

            <Modal
                opened={deleteModalOpen}
                onClose={closeDeleteModal}
                title={t("modals.deleteTitle")}
                centered
                size="sm"
            >
                <Text mb="sm">{t("modals.deleteMessage")}</Text>
                <PasswordInput
                    placeholder={t("placeholders.password")}
                    value={reauthPassword}
                    onChange={(e) => setReauthPassword(e.target.value)}
                    required
                />
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={closeDeleteModal}>{t("buttons.cancel")}</Button>
                    <Button color="red" loading={actionLoading} onClick={handleConfirmDelete}>
                        {t("buttons.confirmDelete")}
                    </Button>
                </Group>
            </Modal>
        </div>
    );
};

export default Admin;
