import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Container, Title, Text, Card, Stack, Badge, Loader, Center, Button, Menu } from "@mantine/core";
import { IconCertificate, IconAlertCircle, IconCheck, IconWorld } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import styles from "./CertificateVerify.module.css";
import stampImg from "../../assets/imgs/stamp.png"


const CertificateVerify = () => {
    const { code } = useParams();
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { t, i18n } = useTranslation("verification/CertificateVerify");

    const changeLang = (lng) => i18n.changeLanguage(lng);

    useEffect(() => {
        const verifyCertificate = async () => {
            if (!code) {
                setError(t("errors.no_code"));
                setLoading(false);
                return;
            }

            try {
                const certCollection = collection(db, "certificates");
                const q = query(certCollection, where("code", "==", code.toUpperCase()));
                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    setError(t("errors.not_found"));
                    setLoading(false);
                    return;
                }

                setCertificate({
                    id: snapshot.docs[0].id,
                    ...snapshot.docs[0].data(),
                });

            } catch (err) {
                console.error(err);
                setError(t("errors.failed"));
            } finally {
                setLoading(false);
            }
        };

        verifyCertificate();
    }, [code, i18n.language]); // re-run if language changes so error messages update

    /** Loading **/
    if (loading) {
        return (
            <Center style={{ minHeight: "100vh" }}>
                <Stack align="center">
                    <Loader size="lg" />
                    <Text>{t("loading")}</Text>
                </Stack>
            </Center>
        );
    }

    /** Error **/
    if (error) {
        return (
            <Container size="sm" className={styles.container}>

                {/* Language Toggle */}
                <div className={styles.langToggle}>
                    <Menu shadow="md" width={160}>
                        <Menu.Target>
                            <Button variant="white" leftSection={<IconWorld size={18} />}>
                                {i18n.language.toUpperCase()}
                            </Button>
                        </Menu.Target>

                        <Menu.Dropdown>
                            <Menu.Item onClick={() => changeLang("en")}>EN – English</Menu.Item>
                            <Menu.Item onClick={() => changeLang("ar")}>AR – العربية</Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </div>

                <Card shadow="md" padding="xl" radius="md" withBorder className={styles.errorCard}>
                    <Stack align="center" spacing="lg">
                        <IconAlertCircle size={64} color="red" />
                        <Title order={2} className={styles.errorTitle}>{t("invalid_title")}</Title>
                        <Text>{error}</Text>
                        <Text size="sm" color="dimmed" align="center">
                            {t("invalid_subtext")}
                        </Text>
                    </Stack>
                </Card>
            </Container>
        );
    }

    /** Success **/
    return (
        <Container size="sm" className={styles.container}>

            {/* Top Right Language Toggle */}
            <div className={styles.langToggle}>
                <Menu shadow="md" width={160}>
                    <Menu.Target>
                        <Button variant="white" leftSection={<IconWorld size={18} />}>
                            {i18n.language.toUpperCase()}
                        </Button>
                    </Menu.Target>

                    <Menu.Dropdown>
                        <Menu.Item onClick={() => changeLang("en")}>EN – English</Menu.Item>
                        <Menu.Item onClick={() => changeLang("ar")}>AR – العربية</Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </div>

            <Card shadow="lg" padding="xl" radius="md" withBorder className={styles.successCard}>
                <Stack spacing="xl">
                    <Center>
                        <Stack align="center">
                            <div className={styles.iconWrapper}>
                                <IconCheck size={64} color="white" />
                            </div>
                            <Badge size="lg" color="green">
                                {t("authentic_badge")}
                            </Badge>
                        </Stack>
                    </Center>

                    <Title align="center" className={styles.title}>
                        {certificate.title || t("verified_document")}
                    </Title>

                    <div className={styles.divider} />

                    <Stack spacing="md">
                        {certificate.name && (
                            <div>
                                <Text size="sm" color="dimmed">{t("issued_to")}</Text>
                                <Title order={2} className={styles.name}>{certificate.name}</Title>
                            </div>
                        )}

                        {certificate.program && (
                            <div>
                                <Text size="sm" color="dimmed">{t("program")}</Text>
                                <Title order={3} className={styles.program}>{certificate.program}</Title>
                            </div>
                        )}

                        {certificate.description && (
                            <Text size="sm" color="dimmed" align="center">
                                {certificate.description}
                            </Text>
                        )}
                    </Stack>

                    <div className={styles.divider} />

                    <Stack spacing="xs" className={styles.metadata}>
                        <Text>
                            <strong>{t("document_code")}</strong>

                            {i18n.language === "ar" ? (
                                <>
                                    <br />
                                    <span className={styles.ltrCode}>{certificate.code}</span>
                                </>
                            ) : (
                                <span className={styles.ltrCode}> {certificate.code}</span>
                            )}
                        </Text>


                        {certificate.createdAt && (
                            <Text>
                                <strong>{t("issued_on")}</strong>{" "}
                                {certificate.createdAt.toDate().toLocaleDateString("id-ID")}
                            </Text>
                        )}
                    </Stack>

                    <Center className={styles.footerWrapper}>
                        <img src={stampImg} alt="Stamp" className={styles.stamp} />
                        <Text size="xs" color="dimmed">{t("footer_text")}</Text>
                    </Center>

                </Stack>
            </Card>
        </Container>
    );
};

export default CertificateVerify;
