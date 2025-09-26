# ClassSync 📚✨  
*A modern educational web application built with React and Firebase*  

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://class-sync-green.vercel.app)  
[![GitHub Repo](https://img.shields.io/badge/github-ClassSync-blue)](https://github.com/syedsabbir-git/ClassSync)  
[![Firebase](https://img.shields.io/badge/firebase-9.0+-orange)](https://firebase.google.com/)  

---

## 🚀 Overview  
**ClassSync** is a **Progressive Web Application (PWA)** that streamlines educational management by providing students and educators with a **centralized platform** for course management, notifications, and learning resources.  

---

## ✨ Features  
- 🔐 **Firebase Authentication** – Secure email/password authentication  
- 📚 **Course Management** – Dashboard for courses and sections  
- 🔔 **Push Notifications** – Real-time notifications via Firebase Cloud Messaging  
- 📱 **Progressive Web App** – Installable on any device  
- 📋 **Task Management** – Assignment tracking & deadlines  
- 📢 **Announcements** – Course-specific updates  
- 🎯 **Activities Dashboard** – Overview of recent course activities  
- 📊 **Real-time Updates** – Live data sync with Firestore  

---

## 🔴 Live Demo  
👉 [ClassSync Demo](https://class-sync-green.vercel.app)  

---

## 🛠️ Built With  
- ⚛️ [React](https://react.dev/) – Frontend framework  
- 🔐 [Firebase Authentication](https://firebase.google.com/docs/auth) – User authentication  
- 📊 [Firebase Firestore](https://firebase.google.com/docs/firestore) – Real-time database  
- 🔔 [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging) – Push notifications  
- 🎨 [Tailwind CSS](https://tailwindcss.com/) – Utility-first styling  
- 📱 **PWA Features** – Offline support & installable app  

---

## 🏃‍♂️ Quick Start  

### ✅ Prerequisites  
- [Node.js](https://nodejs.org/) **14+**  
- npm or yarn  
- Firebase project  

### 🔧 Installation  

```bash
# Clone the repository
git clone https://github.com/syedsabbir-git/ClassSync.git
cd ClassSync

# Install dependencies
npm install
```

### ⚙️ Environment Setup  
Create a `.env.local` file:  

```bash
cp .env.example .env.local
```

Add your Firebase config:  

```env
REACT_APP_FIREBASE_API_KEY=your_api_key  
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com  
REACT_APP_FIREBASE_PROJECT_ID=your_project_id  
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com  
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id  
REACT_APP_FIREBASE_APP_ID=your_app_id  
```

### ▶️ Start Development  

```bash
npm start
```

Visit: [http://localhost:3000](http://localhost:3000)  

---

## 📁 Project Structure  

```text
ClassSync/
├── public/
│   ├── manifest.json
│   ├── sw.js
│   └── icons/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── utils/
├── .env.example
└── package.json
```

---

## 🔧 Scripts  

| Command       | Description                  |
|---------------|------------------------------|
| `npm start`   | Start development server     |
| `npm build`   | Build for production         |
| `npm test`    | Run tests                    |

---

## 🚀 Deployment  

### **Netlify (Recommended)**  
- Connect GitHub repo  
- Build command: `npm run build`  
- Publish directory: `build`  
- Add environment variables  

### **Vercel**  
- Import GitHub repo  
- Configure build settings  
- Add environment variables  

---

## 🤝 Contributing  
1. Fork the repository  
2. Create a feature branch (`git checkout -b feature/amazing-feature`)  
3. Commit changes (`git commit -m 'Add amazing feature'`)  
4. Push to branch (`git push origin feature/amazing-feature`)  
5. Open a Pull Request  

---

## 📝 License  
This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.  

---

## 🙏 Acknowledgments  
- ⚛️ React team for the amazing framework  
- 🔥 Firebase for backend services  
- 🎨 Tailwind CSS for styling utilities  

---

## 📞 Contact  
**Syed Sabbir** – [@syedsabbir-git](https://github.com/syedsabbir-git)  

📌 Project Link: [https://github.com/syedsabbir-git/ClassSync](https://github.com/syedsabbir-git/ClassSync)  

⭐ *Star this repo if you found it helpful!*  
