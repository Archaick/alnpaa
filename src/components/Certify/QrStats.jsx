// src/.../QrStats.jsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import CountUp from "react-countup";
import { IconQrcode } from "@tabler/icons-react";
import { db } from "../../../firebaseConfig";
import { collection, getCountFromServer } from "firebase/firestore";

const QrStats = () => {
    const { t } = useTranslation("dashboard/Admin");
    const [total, setTotal] = useState(0);

    useEffect(() => {
        const fetchTotal = async () => {
            try {
                const certCollection = collection(db, "certificates");
                const snapshot = await getCountFromServer(certCollection);
                setTotal(snapshot.data().count);
            } catch (err) {
                console.error("QR count error:", err);
            }
        };

        fetchTotal();
    }, []);

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "#f5f6f7",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                border: "1px solid #e1e4e7",
            }}
        >
            <IconQrcode size={24} stroke={1.5} />

            <div style={{ display: "flex", flexDirection: "column", lineHeight: "1.1" }}>
                <span style={{ fontSize: "11px", fontWeight: "500", color: "#666" }}>
                    {t("labels.totalQRCodes")}
                </span>

                <span style={{ fontSize: "15px", fontWeight: "700" }}>
                    <CountUp end={total} duration={3} separator="," />
                </span>
            </div>
        </div>

    );
};

export default QrStats;
