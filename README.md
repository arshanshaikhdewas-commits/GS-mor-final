# GS EarthMovers Billing App

A polished, professional, and full-featured Android application built with **Kotlin**, **Jetpack Compose**, and **Material 3** for generating, persisting, and exporting industrial work bills and invoices.

## 🛠️ App Features & Capabilities

1. **Dashboard & History (Home Screen)**
   - Displays a dynamic history of all previously created and saved bills.
   - Live query searching that filters client names or work descriptions in real-time.
   - Quick visual card metrics showing invoice numbers, dates, client names, and bold amounts in Indian Rupees (₹).
   - In-app preference controls for **Light/Dark Mode** and **English/Hindi Language Switching** instantly.

2. **Sequential Bill Generation (Create Screen)**
   - Smart form with input validations for client names, optional addresses, mobile numbers, dates (with a calendar dialog picker), work descriptions, total working hours (decimal-supported), rates per hour, additional fees, discounts, and custom remarks/notes.
   - **Automatic Calculations**: Computes the exact subtotal and final amount in real-time as the user types:
     $$\text{Total Amount} = (\text{Working Hours} \times \text{Rate Per Hour}) + \text{Additional Charges} - \text{Discount}$$
   - **Sequential Invoicing**: Queries the local Room database to automatically generate invoice identifiers in the sequential format: `GS-2026-001`, `GS-2026-002`, and so on.

3. **Digital Invoice & PDF Export (View Screen)**
   - Renders a clean digital preview of the paper invoice before generation.
   - **Custom A4 PDF Engine**: Uses `android.graphics.pdf.PdfDocument` with `Canvas` and `StaticLayout` to draw a vector-perfect A4-sized printable sheet.
   - Supports robust bilingual character drawing (both Devanagari Hindi and English glyphs) with automatic multiline text wrapping.
   - **Share**: Integrates with Android's system Share Sheet to share generated PDFs with other applications (WhatsApp, Email, etc.).
   - **Print**: Integrates with Android's system `PrintManager` to print invoices directly from the mobile device to standard printers or save as native system PDF files.
   - **Download**: Instantly saves the PDF to the device's shared `Downloads` folder using MediaStore (which requires no intrusive permissions on modern Android versions).

---

## 🏗️ Architecture & Technical Stack

The app is built using modern Android development best practices and follows the **MVVM (Model-View-ViewModel)** architectural pattern:

- **Kotlin & Jetpack Compose**: High-fidelity declarative UI styled around Material Design 3 guidelines.
- **Room Database**: Strongly typed local SQLite persistence with reactive data streams via Kotlin `Flow`s.
- **Repository Pattern**: Clean decoupling of local data operations from view layer models.
- **Navigation Compose**: Fluid, standard-compliant, backstack-managed page navigation.
- **Edge-to-Edge Design**: Full-bleed content drawing conforming to status and system navigation bar insets.
- **Dynamic Context Localization**: Utilizes custom context-configuration wrapping in Compose. This allows instant in-app language switching between English and Hindi without requiring configuration recreation hacks, while retaining standard `stringResource()` lookups!

---

## 📂 Project Directory Structure

```text
/app
 ├── src
 │    ├── main
 │    │    ├── java/com/example
 │    │    │    ├── data
 │    │    │    │    ├── Bill.kt          (Room entity representing work bill)
 │    │    │    │    ├── BillDao.kt       (Reactive queries and deletion)
 │    │    │    │    ├── BillDatabase.kt  (Room SQLite database singleton)
 │    │    │    │    └── BillRepository.kt(Data layer abstraction repository)
 │    │    │    ├── ui
 │    │    │    │    ├── screens
 │    │    │    │    │    ├── HomeScreen.kt (Dashboard, searching, toggles)
 │    │    │    │    │    ├── CreateBillScreen.kt (Inputs, date picker, live totals)
 │    │    │    │    │    └── ViewBillScreen.kt (Digital receipt sheet, PDF actions)
 │    │    │    │    ├── theme
 │    │    │    │    │    ├── Color.kt      (Construction Slate & Amber palette)
 │    │    │    │    │    ├── Theme.kt      (Centralized M3 Light/Dark Themes)
 │    │    │    │    │    └── Type.kt       (Modern Material Typography pairing)
 │    │    │    │    └── BillViewModel.kt  (Dynamic computations, state flows, logic)
 │    │    │    └── MainActivity.kt        (Edge-to-Edge, NavHost, dynamic Locale wrapping)
 │    │    ├── res
 │    │    │    ├── drawable              (Custom adaptive launcher logo)
 │    │    │    ├── values                (English strings.xml and styles)
 │    │    │    ├── values-hi             (Hindi localized strings.xml)
 │    │    │    └── xml                   (Backup rules and FileProvider file_paths)
 │    │    └── AndroidManifest.xml        (Declared providers and scoped storage settings)
 └── build.gradle.kts                     (Kotlin DSL build dependencies)
```

---

## 🎨 Design System: Construction Slate & Gold Theme

Designed specifically for **GS EarthMovers** heavy machinery:
- **Primary Color (Slate Blue)**: `#1E3A8A` representing industrial stability and quality.
- **Accent Color (Gold/Amber)**: `#F59E0B` representing heavy construction equipment, bulldozers, and precision earthwork.
- **Surfaces**: Ultra-clean off-white background with subtle rounded card contours and high contrast typography.
- **Adaptive App Icon**: A custom excavator silhouette centered inside the safe-zone over an elegant sweeping linear color gradient.
