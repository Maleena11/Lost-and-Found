📌 Lost and Found Item Management System for University students

The Lost and Found Item Management System is a web-based application designed for university students to efficiently report, track, and recover lost or found items within the campus. This system helps reduce the hassle of manually searching for lost belongings and improves communication between students and administrators.

The project is developed as a group system with four main subsystems, each handling a specific functionality to ensure smooth operation and user-friendly experience.

🚀 System Overview
This system allows students to:

Report lost or found items
ة
View available notices about items

Claim items securely

Verify ownership through an organized process

It also provides administrators with tools to manage users, items, and system activities effectively.

🧩 Subsystems

🔹 Administrative Subsystem

Handles overall system management including user management, system settings, monitoring activities, and maintaining data integrity.

🔹 Item Reporting Subsystem

Allows users to report lost or found items by submitting details such as item description, category, date, and location.

🔹 Notice Management Subsystem

Manages the display of notices related to lost and found items, helping users easily browse and search for relevant information.

🔹 Claim & Verification Subsystem

Enables users to claim items and ensures proper verification of ownership before returning items to the rightful owner.

👥 Team Structure

This project is developed by a group of four members, where each member is responsible for one subsystem to ensure modular development and efficient collaboration.

🎯 Objective
The main objective of this system is to:

Provide a centralized platform for lost and found items
Reduce item loss and improve recovery rate
Ensure a secure and transparent claiming process
Enhance user convenience within the university environment

🛠️ Technologies Used

Frontend: HTML, CSS, JavaScript

Backend: Node.js / Java 

Database: MongoDB

📌 Conclusion
This system improves the traditional lost and found process by digitizing it, making it faster, more reliable, and accessible for all university students.

## Automated Testing

The project includes automated backend integration testing with `Jest`, `Supertest`, and `mongodb-memory-server`.

For the admin dashboard contribution area, the suite in [backend/subsystems/admin/__tests__/adminDashboardUserSettings.test.js](/e:/ITPM-PROJECT/Lost-and-Found/backend/subsystems/admin/__tests__/adminDashboardUserSettings.test.js) covers these user journeys:

- Dashboard overview: verifies the APIs that feed overview cards and widgets for users, items, notices, and verification requests.
- User management: verifies create, list, update, delete, duplicate-email handling, and login flows for both users and admins.
- System settings: verifies default singleton creation on first load and safe updates of persisted settings.

Run the admin-focused suite with:

```bash
cd backend
npm test -- --runInBand subsystems/admin/__tests__/adminDashboardUserSettings.test.js
```
