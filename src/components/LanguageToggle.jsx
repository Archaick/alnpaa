import React, { useEffect, useState } from "react";
import { SegmentedControl } from "@mantine/core";
import { useTranslation } from "react-i18next";

const LanguageToggle = ({ position = "top-right" }) => {
  const { i18n } = useTranslation();
  const [value, setValue] = useState(i18n?.language || "en");

  const positionStyles = {
    "top-right": { position: "absolute", top: "20px", right: "20px" },
    "top-left": { position: "absolute", top: "20px", left: "20px" },
    "inline": { position: "static" }
  };

  useEffect(() => {
    const handleChange = (lng) => {
      setValue(lng);
      if (typeof document !== "undefined") {
        document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
      }
    };

    i18n?.on && i18n.on("languageChanged", handleChange);

    // initialize direction
    handleChange(i18n?.language || "en");

    return () => {
      i18n?.off && i18n.off("languageChanged", handleChange);
    };
  }, [i18n]);

  const handleSelect = (lang) => {
    setValue(lang);
    i18n.changeLanguage(lang);
  };

  return (
    <div style={positionStyles[position]}>
      <SegmentedControl
        value={value}
        onChange={handleSelect}
        data={[
          { label: "English", value: "en" },
          { label: "العربية", value: "ar" }
        ]}
        size="sm"
      />
    </div>
  );
};

export default LanguageToggle;
