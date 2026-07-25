# Software Requirements Specification (SRS)

## NitroClinic — AI-Assisted Patient Management & Ward Management System

**Prepared for:** Dr. Haider Ali Khan (Neurosurgeon)
**Practice / Clinic Brand:** Health Next
**Version:** 1.0
**Date:** July 25, 2026

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for **NitroClinic**, a web-based clinical management system built for Dr. Haider Ali Khan's neurosurgery practice (**Health Next**). The system digitizes patient record-keeping, assists diagnosis and medicine recommendation through an AI assistant, generates printable prescription slips with custom doctor letterhead & branding, visualizes patient history through charts, and manages hospital ward operations — all within a single application.

### 1.2 Scope
NitroClinic will:
- Store and retrieve patient records persistently, tracked by a unique Medical Record Number (MRN), including visit count history.
- Record symptoms, vitals, prescribed tests, diagnoses, and medicines for every visit.
- Provide an AI assistant (Google Gemini) tuned for Neurosurgery & Clinical practice that suggests possible diagnoses and medicines based on entered symptoms and patient history, and supports doctor follow-up questions.
- Generate a printable prescription slip ("cheque") pre-filled with **Health Next** branding, Dr. Haider Ali Khan's photo (`/DR-IMAGE.png`), full qualifications, specializations, and clinic letterhead.
- Provide Document & Scan attachments (MRI/CT scans, lab reports).
- Export Full Patient History into a single PDF.
- Visualize patient visit trends and vitals using Chart.js charts.
- Provide a Ward Management module to track ward beds, patient admissions, and related ward operations.
- Support Secure Expiring Public Share Links for referrals and second opinions.

### 1.3 Intended Audience
- Development team (frontend, backend, DevOps)
- Dr. Haider Ali Khan (primary end user / product owner)
- Clinic/hospital administrative staff (secondary users)

### 1.4 Doctor & Practice Profile

| Attribute | Details |
|---|---|
| **Doctor Name** | Dr. Haider Ali Khan |
| **Title / Role** | Neurosurgeon |
| **Qualifications** | MBBS, FCPS (Neurosurgery), Fellowship Endoscopic Neurosurgery, CHPE, Arab Spine Diploma |
| **Clinic / Brand Name** | Health Next |
| **Doctor Photo** | `/DR-IMAGE.png` |
| **Specializations** | • Brain & Spine Surgeries<br>• Brain Tumor Treatment<br>• Spinal Disorders (Slip Disc, Sciatica)<br>• Diagnosis & Treatment<br>• Hydrocephalus Treatment<br>• Numbness, Dizziness & Nerve Weakness |

---

## 2. Overall Description

### 2.1 Product Perspective
NitroClinic is a standalone, self-contained web application (Next.js-based, per existing project conventions) with a MongoDB backend. Scoped for Dr. Haider Ali Khan's practice at **Health Next**.

### 2.2 Operating Environment & Constraints
- **Frontend:** Responsive Web App (Desktop & Tablet) styled with Tailwind CSS, Icons from `react-icons`.
- **Theme:** White / Light Clinical Theme only.
- **Branding Assets:** Dr. Haider Ali Khan photo (`/DR-IMAGE.png`) and Health Next logo featured in Header, Sidebar, Doctor Profile, Prescription Slips, and PDF Exports.
- **Database:** MongoDB (reusing existing connection).
- **AI Engine:** Google Gemini API (Flash-Lite model tier).

---

## 3. System Features

### 3.1 Patient Records & Vitals Management
- **MRN System:** Auto-generated unique Medical Record Number (`NC-YYYY-XXXX`).
- **Demographics:** Full name, age/DOB, gender, contact number, address, blood group, allergies, chronic conditions.
- **Vitals Tracking:** Optional quick-entry for BP, temperature, pulse, weight per visit, with Chart.js trend charts on patient profile.
- **Document & Report Attachments:** Upload MRI/CT scans, lab reports (PDF/JPG/PNG) to patient profile or visit timeline.

### 3.2 AI Diagnosis & Medicine Assistant (Neurosurgery-Aware)
- Gemini-powered advisory assistant pre-conditioned with Dr. Haider Ali Khan's neurosurgical context.
- Returns ranked differential diagnoses, suggested confirmatory tests, and medicines with dosage reference.
- Allergy conflict detection banner.
- Doctor retains 100% final decision authority.

### 3.3 Prescription Slip ("Cheque") Generation
- Auto-populates header with **Health Next** branding, Dr. Haider Ali Khan's photo (`/DR-IMAGE.png`), full qualifications (`MBBS, FCPS (Neurosurgery)...`), specializations list, registration number, and contact info.
- Auto-fills patient MRN, demographics, vitals, confirmed diagnosis, prescribed medicines, tests, and doctor notes.
- `@media print` optimized for direct browser printing (A4/A5) and PDF download.

### 3.4 Full Patient History PDF Export
- Single-click export of complete patient history timeline, vitals trends, visits, medicines, and attached scan summaries with Health Next & Dr. Haider Ali Khan letterhead header.

### 3.5 Medicine & Test Master List (Autocomplete)
- Autocomplete master list (`medicineTestMasterList`) with common medicines, neurosurgical tests (e.g. MRI Brain, CT Spine, EMG), and custom entries.

### 3.6 Follow-Up Reminders
- Visit "Next Follow-up Date" field + Dashboard widget "Follow-ups Due This Week".

### 3.7 Secure Share Links (Referrals / Second Opinions)
- Generate 48–72h expiring read-only public links (`/share/[token]`) for referring neurosurgical cases to other specialists without login requirements.

### 3.8 Ward Management Module
- Manage wards (ICU, Neuro Ward, General Ward) and bed capacities.
- Real-time bed grid (Available, Occupied, Under Maintenance).
- Patient admission & discharge flows linked to MRN.

### 3.9 Settings & Master List Management
- Configurable doctor credentials, qualifications, Health Next branding, logo/photo URL (`/DR-IMAGE.png`), wards, beds, and master autocomplete list.

---

## 4. Technology & Data Model Summary

### MongoDB Collections
1. `patients` (MRN, demographics, allergies, chronic conditions, visitCount)
2. `visits` (MRN, symptoms, AI suggestions, confirmed diagnosis, medicines, tests, notes, vitals, attachments, nextFollowUpDate)
3. `medicineTestMasterList` (type, name, defaultDosage)
4. `shareLinks` (MRN, visitId, token, expiresAt, revoked)
5. `wards` & `beds` & `admissions`
6. `settings` (doctorName, title, qualifications, brandName, logoUrl, specializations, contactDetails)
7. `users` (Doctor login credentials)

---

*End of SRS Document*