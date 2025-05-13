# CS732 project - Team PokeMasters

Welcome to the CS732 project. We look forward to seeing the amazing things you create this semester! This is your team's repository.

Your team members are:

- Xingxing Tao _(xtao093@aucklanduni.ac.nz)_
- Mingming Liu _(mliu947@aucklanduni.ac.nz)_
- Shan Liu _(sliu734@aucklanduni.ac.nz)_
- Lingyi Yin _(lyin610@aucklanduni.ac.nz)_
- Pan Wang _(pwan744@aucklanduni.ac.nz)_
- Exa Fann _(xfan744@aucklanduni.ac.nz)_

You have complete control over how you run this repo. All your members will have admin access. The only thing setup by default is branch protections on `main`, requiring a PR with at least one code reviewer to modify `main` rather than direct pushes.

Please use good version control practices, such as feature branching, both to make it easier for markers to see your group's history and to lower the chances of you tripping over each other during development

![](./PokeMasters.png)

# How to Run and Test the Project
## 1. Prerequisites
Node.js (version 18 or above)
MongoDB (local or Atlas)
(Optional) Postman – for API testing
## 2. Project Structure
/frontend     → React (Next.js) frontend  
/backend     → Express backend  
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
In the `/backend` directory, create a .env file with the following contents (has been submitted into Assignment - Private info / API key / etc submission):
```
PORT=3000
DATABASE = mongodb+srv://pokemasters:<PASSWORD>@cluster0.c5u4t48.mongodb.net/splitmate?retryWrites=true&w=majority&appName=Cluster0
DATABASE_LOCAL = mongodb://localhost:27017/pokemasters
DATABASE_PASSWORD = pw123456

MONGO_URI=mongodb+srv://pokemasters:pw123456@cluster0.c5u4t48.mongodb.net/splitmate?retryWrites=true&w=majority&appName=Cluster0

JWT_SECRET=yourSecretKey123
JWT_EXPIRES_IN=7d

AZURE_FORM_RECOGNIZER_ENDPOINT=https://pokemasters-receipt-ocr.cognitiveservices.azure.com/
AZURE_FORM_RECOGNIZER_KEY=w1jrMsm2sLNQaz5zJtxatBG9LYrBGUKnoxNhBUuovJZ7GnMXVNvdJQQJ99BEACL93NaXJ3w3AAALACOGeyu7
```
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
Use the following test account to log in and test features:
Email: mike@gmail.com
Password：password1
Join group code: code02

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

# other documents

### [00 proposal](https://github.com/UOA-CS732-S1-2025/group-project-pokemasters/wiki/01-Have-you-shown-the-ability-to-carry-out-further-learning-beyond-the-course-material-to-add-value-to-your-prototype%3F)

### [01 Have you shown the ability to carry out further learning beyond the course material to add value to your prototype?](https://github.com/UOA-CS732-S1-2025/group-project-pokemasters/wiki/01-Have-you-shown-the-ability-to-carry-out-further-learning-beyond-the-course-material-to-add-value-to-your-prototype%3F)

### [02 How well is your product designed, especially from a user's perspective?](https://github.com/UOA-CS732-S1-2025/group-project-pokemasters/wiki/02-How-well-is-your-product-designed,-especially-from-a-user's-perspective%3F)

### [03 How well have you applied principles such as design thinking in the construction of your prototype?](https://github.com/UOA-CS732-S1-2025/group-project-pokemasters/wiki/03-How-well-have-you-applied-principles-such-as-design-thinking-in-the-construction-of-your-prototype%3F)

### [04 Has your code been developed according to best-practices within your applied frameworks?](https://github.com/UOA-CS732-S1-2025/group-project-pokemasters/wiki/04-Has-your-code-been-developed-according-to-best%E2%80%90practices-within-your-applied-frameworks%3F)

### [05 Has your code been tested? How?](https://github.com/UOA-CS732-S1-2025/group-project-pokemasters/wiki/05-Has-your-code-been-tested%3F-How%3F)

### [06 Has your project been deployed?](https://github.com/UOA-CS732-S1-2025/group-project-pokemasters/wiki/06-Has-your-project-been-deployed%3F)

### [07 Meetings](https://github.com/UOA-CS732-S1-2025/group-project-pokemasters/wiki)