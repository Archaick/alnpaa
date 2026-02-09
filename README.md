# Digital Authentication System - Alnpaa Foundation

**A secure digital authentication and verification platform for documents and certificates using QR code technology**

---

## 🎯 Project Overview

This is a comprehensive **Digital Authentication Platform** developed by **Alnpaa Foundation (مؤسسة النبأ العظيم)** in partnership with **Markaz Tadarus Indonesia**. The platform enables organizations to issue, archive, and verify digital records using QR code-based authentication—similar to e-signature systems but optimized for bulk document verification.

## 📋 Purpose & Role

### What This Platform Does:
- **Issues QR Codes**: Generates unique, tamper-proof QR codes for documents and certificates
- **Archives Records**: Stores all issued records in a secure Firestore database for future reference
- **Verifies Authenticity**: Allows public verification of any document using its QR code
- **Manages Certificates**: Provides an admin interface for managing issued certificates/documents

### Key Features:
✅ **Admin Panel**: Manage and issue digital records with automatic QR code generation  
✅ **QR Code Verification**: Public-facing verification page to authenticate any record  
✅ **Multilingual Support**: Full support for English (EN) and Arabic (AR) with RTL text support  
✅ **Data Backup & Restore**: Export and import certificates in bulk with duplicate checking  
✅ **Digital Authentication**: Each record has a unique verification code  
✅ **Real-time Statistics**: Display total QR codes issued  
✅ **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices  

## 🛠️ Technology Stack

- **Frontend**: React 19 + Vite
- **UI Framework**: Mantine (v8)
- **Backend**: Firebase (Authentication + Firestore)
- **Internationalization**: i18next (English & Arabic)
- **QR Generation**: qrcode.js
- **Icons**: Tabler Icons
- **Styling**: CSS Modules + Mantine CSS

## 📁 Project Structure

```
├── src/
│   ├── components/
│   │   ├── Certify/
│   │   │   ├── Admin.jsx              # Admin dashboard for managing records
│   │   │   ├── AdminLogin.jsx         # Admin authentication
│   │   │   ├── BackupManager.jsx      # Backup/restore functionality
│   │   │   ├── CertificateVerify.jsx  # Public verification page
│   │   │   ├── QrStats.jsx            # QR statistics widget
│   │   │   └── *.module.css           # Component styles
│   │   └── LanguageToggle.jsx         # Language switcher
│   ├── auth-context.jsx               # Firebase auth provider
│   ├── i18n.js                        # i18next configuration
│   ├── App.jsx                        # Main app & router
│   └── main.jsx                       # App entry point
├── public/
│   └── locales/                       # Translation files
│       ├── en/                        # English translations
│       └── ar/                        # Arabic translations
├── firebaseConfig.js                  # Firebase configuration
└── README.md                          # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Firebase Project
- Environment variables configured

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables** (.env):
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## 🔐 Firebase Setup

### Required Configuration:

1. **Authentication**:
   - Enable Email/Password sign-in
   - Create admin user(s)

2. **Firestore Database**:
   - Create database in native mode
   - Add collection: `certificates`

3. **Security Rules**:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

## 🌐 Routes

| Route | Purpose | Access |
|-------|---------|--------|
| `/` | Redirects to login | Public |
| `/cert-login` | Admin login page | Public |
| `/admin` | Admin dashboard | Authenticated |
| `/verify/:code` | Verify record by QR code | Public |

## 📱 Languages

- **English (EN)**: Default language
- **Arabic (AR)**: Full RTL support with proper text directionality

Switch languages using the language toggle in the admin panel or verification page.

## 📦 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.2.0 | UI framework |
| firebase | ^12.8.0 | Backend services |
| @mantine/core | ^8.3.14 | UI components |
| i18next | ^25.8.0 | Translations |
| qrcode | ^1.5.4 | QR code generation |
| react-router-dom | ^7.13.0 | Routing |

## 🔄 Workflow

### Issuing a Record:
1. Admin logs in to `/admin`
2. Enters participant name and program/document type
3. System generates unique QR code automatically
4. Record is stored in Firestore

### Verifying a Record:
1. User visits `/verify/{code}` with QR code
2. System queries Firestore for matching record
3. Displays record details with authenticity badge
4. User can view in English or Arabic

### Backup & Restore:
1. Admin can export all records as JSON
2. Later import records with automatic duplicate detection
3. Useful for data migration and backup

## 🤝 Partnership

**Developed by**: Alnpaa Foundation (مؤسسة النبأ العظيم)  
**In partnership with**: Markaz Tadarus Indonesia (مركز التدارس إندونيسيا)

## 📝 License

This project is proprietary software of Alnpaa Foundation. Use with proper authorization only.

## 📧 Support

For issues or inquiries, please contact the development team.

---

**Last Updated**: February 2026