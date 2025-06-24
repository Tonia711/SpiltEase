# How to Run and Test the Project

## 1. Prerequisites

- Node.js (version 18 or above)
- MongoDB (local or Atlas)
- (Optional) Postman – for API testing

## 2. Project Structure

/frontend → React (Next.js) frontend  
/backend → Express backend

## 3. Installation Steps

### Step 1: Clone the repository

```
git clone https://github.com/UOA-CS732-S1-2025/group-project-pokemasters.git
```

### Step 2: Install dependencies

Backend

```
cd backend
npm  install
```

Frontend

```
cd frontend
npm install
```

### Step 3: Configure environment variables

In the `/backend` directory, create a .env file with the following contents :

### Step 4: Running the Application

Start the backend

```
cd backend
npm start
```

Start the frontend

```
cd  frontend
npm run dev
```

### Step 5: Testing

Backend tests

```
cd backend
npm run test
```

Frontend tests

```
cd frontend
npm run  test
```

### Step 6: Test Account Credentials

- Use the following test account to log in and test features:
- Email: mike@gmail.com
- Password：password1
- Join group code: code02

# Features

1. **OCR Bill Recognition**  
   The system supports OCR technology to scan and recognize receipt content automatically. It extracts key details such as date, amount, and item description to reduce manual data entry and improve efficiency.

2. **Mobile & Web Accessibility (PWA)**  
   Designed as a Progressive Web App (PWA), the system works smoothly on both desktop and mobile devices. It ensures a consistent user experience with responsive layouts.

3. **Real-Time Collaborative Expense Tracking**  
   Multiple users can participate in the same ledger with real-time updates. Any modifications to expenses, balances, or group data are synchronized instantly across all devices and members.

4. **Team Ledger Management**  
   Users can create and manage team-based ledgers by organizing expenses into categories. Each record can include an amount, description, image, or note, providing better clarity and shared understanding.

5. **Smart Expense Splitting**  
   The application supports flexible expense splitting methods, allowing users to:

   - Share equally among all members
   - Assign fixed amounts to specific users
   - Randomly allocate any leftover balance from rounding errors

6. **Personal Expense Overview**  
   Each user has access to their personal dashboard, displaying:

   - Total spending and a breakdown by category
   - Borrowing and lending information, including debts and receivables  
     This helps users understand their financial contributions and relationships within the group.

7. **User Authentication & Account Management**  
   Secure user authentication is implemented, supporting registration, login, and logout. Users can manage their personal profiles and group memberships safely and independently.

8. **Data Analytics & Visualization**  
   Built-in charts and summaries provide users with clear financial insights. These include:

   - Overall group spendin
   - Individual spending patterns
   - Final balance summaries to simplify settlement and review

9. **Undo/Redo Expense Edits**  
   The system allows users to undo or redo changes made to expenses, reducing accidental errors and maintaining the accuracy of financial records.
