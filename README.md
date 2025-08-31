# 🌱 Agro: Fertilizer Company Management App

A comprehensive web application for fertilizer companies to manage farmer relationships, track crop health, record sales visits, manage purchases, and monitor revenue and lending activities.
<img width="1160" height="642" alt="Screenshot 2025-08-31 at 3 56 59 PM" src="https://github.com/user-attachments/assets/32deaaf4-ad4d-4b8e-8e89-a2a0c34f6dee" />

## 🚀 Features

### 👥 Farmer Management

- **Farmer Profiles**: Store farmer information including name, phone, location, zone, and profile images
- **Crop Tracking**: Associate multiple crops with each farmer
- **Contact Management**: Maintain farmer contact details and location information

### 🏥 Crop Health Monitoring

- **Health Assessment**: Rate crop health as Good, Average, or Poor
- **Visit Logging**: Record detailed farm visits with notes and recommendations
- **Image Documentation**: Capture and store crop images for health assessment
- **Recommendation Tracking**: Log fertilizer and treatment recommendations

### 💰 Sales & Revenue Management

- **Purchase Tracking**: Record fertilizer sales with item details and quantities
- **Payment Management**: Track paid amounts, remaining dues, and payment history
- **Working Combo Tracking**: Monitor special fertilizer combinations and their effectiveness
- **Revenue Analytics**: Calculate total sales, collections, and pending amounts

### 📊 Dashboard & Analytics

- **Financial Overview**: Real-time tracking of total dues, collections, and pending amounts
- **Crop Health Statistics**: Visual representation of crop health distribution
- **Visit Analytics**: Monitor overdue visits and farmer attention requirements
- **Performance Metrics**: Track employee performance and farmer engagement

### 🔐 User Management

- **Role-based Access**: Admin and Employee roles with different permissions
- **Authentication**: Secure phone-based login system with OTP verification
- **User Profiles**: Manage employee information and access levels

### 📱 Progressive Web App

- **Offline Support**: Service worker for offline functionality
- **Mobile Responsive**: Optimized for mobile devices and field use
- **Image Management**: Efficient image compression and storage

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **PWA**: Service Worker for offline capabilities

## 📋 Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- Firebase project with Firestore, Authentication, and Storage enabled
- Modern web browser with PWA support

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd fertilizer-app
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Build & Deploy

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

```bash
npm run build
vercel --prod
```

## 📱 App Structure

```
src/
├── app/                    # Next.js app router
│   ├── (admin)/          # Admin-only routes
│   │   └── dashboard/    # Admin dashboard
│   ├── (auth)/           # Authentication routes
│   │   └── login/        # Login page
│   └── (protected)/      # Protected routes
│       ├── (farmers)/    # Farmer management
│       ├── visits/       # Visit tracking
│       ├── purchases/    # Purchase management
│       └── profile/      # User profile
├── components/            # Reusable UI components
├── lib/                   # Utilities and Firebase config
└── types/                 # TypeScript type definitions
```

## 🔐 Test Credentials

- **Phone**: `+918903831084`
  --**Otp**: 666666
- **Role**: Admin
- **Access**: Full system access, dashboard, analytics

> **Note**: These are test credentials. Replace with actual user data in production.

## 🌐 Live Demo

- [https://fertiliser-app.netlify.app/](https://fertiliser-app.

## 📊 Key Metrics Tracked

- **Financial**: Total dues, collections, pending amounts
- **Operational**: Visit frequency, crop health trends
- **Performance**: Employee productivity, farmer engagement
- **Inventory**: Fertilizer sales, working combo effectiveness

## 🔒 Security Features

- Firebase Authentication with phone verification
- Role-based access control
- Secure API endpoints
- Image compression and secure storage
- Form validation with Zod schemas

## 📱 PWA Features

- Offline functionality
- Installable on mobile devices
- Push notifications (configurable)
- Background sync capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- **Email**: support@yourcompany.com
- **Documentation**: [https://docs.yourcompany.com](https://docs.yourcompany.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/fertilizer-app/issues)

## 🔄 Version History

- **v0.1.0** - Initial release with core functionality
- **v0.2.0** - Added dashboard and analytics
- **v0.3.0** - Enhanced PWA features and offline support

---

**Built with ❤️ for the agricultural community**
