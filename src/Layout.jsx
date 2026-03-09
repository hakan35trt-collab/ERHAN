import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import {
  Home,
  UserPlus,
  Search,
  Users,
  Settings,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
  LogIn,
  BookOpen,
  Megaphone,
  Shield,
  Image,
  Crown,
  List,
  DatabaseBackup,
  Briefcase,
  FileText,
  CalendarClock,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationCenter from "../components/notifications/NotificationCenter";
import AnnouncementBanner from "../components/announcements/AnnouncementBanner";
import VIPBadge from "../components/ui/VIPBadge";
import DayBadge from "../components/ui/DayBadge";
import UserBadges from "../components/ui/UserBadges";
import { format } from "date-fns";
import { dailyUpdateService } from "../components/services/DailyUpdateService";
import { logCleanupService } from "../components/services/LogCleanupService";

const navigationItems = [
  {
    title: "Ana Sayfa",
    url: createPageUrl("Dashboard"),
    icon: Home,
    allowedRoles: ["admin", "vip-3", "vip-2", "vip-1"]
  },
  {
    title: "Ziyaretçi Kaydı",
    url: createPageUrl("VisitorRegistration"),
    icon: UserPlus,
    allowedRoles: ["admin", "vip-3", "vip-2"]
  },
  {
    title: "Ziyaretçi Listesi",
    url: createPageUrl("VisitorList"),
    icon: List,
    allowedRoles: ["admin", "vip-3", "vip-2", "vip-1"]
  },
  {
    title: "Ziyaretçi Arama",
    url: createPageUrl("VisitorSearch"),
    icon: Search,
    allowedRoles: ["admin", "vip-3", "vip-2", "vip-1"]
  },
  {
    title: "İçerideki Ziyaretçiler",
    url: createPageUrl("InsideVisitors"),
    icon: LogIn,
    allowedRoles: ["admin", "vip-3", "vip-2", "vip-1"]
  },
  {
    title: "Personel Rehberi",
    url: createPageUrl("StaffDirectory"),
    icon: Briefcase,
    allowedRoles: ["admin", "vip-3", "vip-2", "vip-1"]
  },
  {
    title: "Notlar",
    url: createPageUrl("Notes"),
    icon: FileText,
    allowedRoles: ["admin", "vip-3", "vip-2", "vip-1"]
  }
];

const managementItems = [
  {
    title: "Haber Ver",
    url: createPageUrl("VisitorAlert"),
    icon: Bell,
    allowedRoles: ["admin", "vip-3", "vip-2"]
  },
  {
    title: "Kullanıcı Yönetimi",
    url: createPageUrl("UserManagement"),
    icon: Users,
    allowedRoles: ["admin", "vip-3"]
  },
  {
    title: "Log Kayıtları",
    url: createPageUrl("LogPanel"),
    icon: BookOpen,
    allowedRoles: ["admin", "vip-3"]
  },
  {
    title: "Duyuru Yönetimi",
    url: createPageUrl("Announcement"),
    icon: Megaphone,
    allowedRoles: ["admin", "vip-3", "vip-2", "vip-1"]
  },
  {
    title: "Vardiya Yönetimi",
    url: createPageUrl("ShiftManagement"),
    icon: CalendarClock,
    allowedRoles: ["admin", "vip-3"]
  },
  {
    title: "Admin Ayarları",
    url: createPageUrl("AdminSettings"),
    icon: Settings,
    allowedRoles: ["admin", "vip-3"]
  },
  {
    title: "Puantaj Yönetimi",
    url: createPageUrl("Points"),
    icon: Image,
    allowedRoles: ["admin", "vip-3", "vip-2"]
  },
  {
    title: "Yedekleme",
    url: createPageUrl("Backup"),
    icon: DatabaseBackup,
    allowedRoles: ["admin", "vip-3"]
  },
  {
    title: "Rozet Yönetimi",
    url: createPageUrl("BadgeManagement"),
    icon: Shield,
    allowedRoles: ["admin", "vip-3"]
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      await loadUser();
      
      if (mounted) {
        dailyUpdateService.initialize();
        dailyUpdateService.start();
        logCleanupService.start();
      }
    };
    
    init();

    const presenceInterval = setInterval(() => {
      if (mounted) updatePresence();
    }, 60000);

    return () => {
      mounted = false;
      clearInterval(presenceInterval);
      dailyUpdateService.stop();
      logCleanupService.stop();
    };
  }, []);

  const updatePresence = async () => {
    try {
      await User.updateMyUserData({ last_seen: new Date().toISOString() });
    } catch (error) {
      // Handle error silently
    }
  };

  const loadUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      const storedTheme = user.theme || 'dark';
      setTheme(storedTheme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(storedTheme);

      if (!user.first_name && !user.last_name) {
        await User.updateMyUserData({
          first_name: "ERHAN",
          last_name: "YAMAN",
          role: "admin",
          vip_level: "vip-3",
          level: 1,
          experience_points: 0,
          last_level_up: format(new Date(), 'yyyy-MM-dd')
        });
        setCurrentUser({
          ...user,
          first_name: "ERHAN",
          last_name: "YAMAN",
          role: "admin",
          vip_level: "vip-3",
          level: 1,
          experience_points: 0
        });
      }
    } catch (error) {
      console.error("Kullanıcı yüklenemedi:", error);
    }
    setIsLoading(false);
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    if (currentUser) {
      await User.updateMyUserData({ theme: newTheme });
    }
  };

  const handleLogout = async () => {
    await User.logout();
  };

  const hasAccess = (allowedRoles) => {
    if (!currentUser) return false;
    const userDisplayRole = currentUser.role === 'admin' ? 'admin' : currentUser.vip_level;
    return allowedRoles.includes(userDisplayRole);
  };

  // Check if user has VIP access
  const hasVIPAccess = () => {
    if (!currentUser) return false;
    const userDisplayRole = currentUser.role === 'admin' ? 'admin' : currentUser.vip_level;
    return ['admin', 'vip-3', 'vip-2', 'vip-1'].includes(userDisplayRole);
  };

  // Auto-redirect for protected pages - Optimized to prevent loops
  useEffect(() => {
    if (!currentUser || isLoading) return;
    
    const userDisplayRole = currentUser.role === 'admin' ? 'admin' : currentUser.vip_level;
    const userHasVIPAccess = ['admin', 'vip-3', 'vip-2', 'vip-1'].includes(userDisplayRole);
    
    const protectedPages = ['Dashboard', 'VisitorRegistration', 'VisitorList', 'VisitorSearch', 'InsideVisitors', 'StaffDirectory', 'Notes', 'UserManagement', 'LogPanel', 'Announcement', 'ShiftManagement', 'Points', 'Backup', 'AdminSettings'];
    const currentPageFromPath = location.pathname.split('/').pop() || 'Dashboard';
    
    // Önce GetAuthorization ve NoAccess sayfalarındaysak hiçbir şey yapma
    if (currentPageFromPath === 'GetAuthorization' || currentPageFromPath === 'NoAccess' || currentPageFromPath === 'Profile') {
      return;
    }
    
    // Korumalı sayfalarda VIP kontrolü
    if (protectedPages.includes(currentPageFromPath)) {
      if (!userHasVIPAccess) {
        window.location.href = createPageUrl('GetAuthorization');
        return;
      }
      
      const adminVip3OnlyPages = ['UserManagement', 'LogPanel', 'ShiftManagement', 'Backup', 'AdminSettings'];
      if (adminVip3OnlyPages.includes(currentPageFromPath)) {
        const userRole = currentUser.role === 'admin' ? 'admin' : currentUser.vip_level;
        if (!['admin', 'vip-3'].includes(userRole)) {
          window.location.href = createPageUrl('NoAccess');
        }
      }
    }
  }, [currentUser?.id, currentUser?.role, currentUser?.vip_level, isLoading, location.pathname]);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
      <div className={`min-h-screen text-yellow-400 transition-colors duration-300 overflow-x-hidden ${theme === 'light' ? 'bg-white' : 'bg-gradient-to-br from-gray-900 via-black to-gray-900'}`} style={{ scrollBehavior: 'smooth' }}>
      <style>
        {`
          :root {
            --background: 17 24 39; --foreground: 250 204 21;
            --card: 31 41 55; --card-foreground: 250 204 21;
            --popover: 3 7 18; --popover-foreground: 250 204 21;
            --primary: 250 204 21; --primary-foreground: 17 24 39;
            --secondary: 55 65 81; --secondary-foreground: 250 204 21;
            --muted: 55 65 81; --muted-foreground: 156 163 175;
            --accent: 55 65 81; --accent-foreground: 250 204 21;
            --destructive: 127 29 29; --destructive-foreground: 250 204 21;
            --border: 55 65 81; --input: 55 65 81; --ring: 250 204 21;
          }
          .light {
            --background: 255 255 255; --foreground: 17 24 39;
            --card: 255 255 255; --card-foreground: 17 24 39;
            --popover: 255 255 255; --popover-foreground: 17 24 39;
            --primary: 17 24 39; --primary-foreground: 250 204 21;
            --secondary: 241 245 249; --secondary-foreground: 17 24 39;
            --muted: 241 245 249; --muted-foreground: 100 116 139;
            --accent: 241 245 249; --accent-foreground: 17 24 39;
            --destructive: 239 68 68; --destructive-foreground: 250 250 250;
            --border: 226 232 240; --input: 226 232 240; --ring: 17 24 39;
          }

          body, #root {
            transition: background-color 0.3s ease;
          }

          .dark body, .dark #root, .dark main {
            background: linear-gradient(to bottom right, rgb(17 24 39), rgb(0 0 0), rgb(17 24 39)) !important;
          }

          .light body, .light #root, .light main {
            background: rgb(255 255 255) !important;
          }
          
          @keyframes whiteShine {
            0% {
              left: -100%;
            }
            100% {
              left: 100%;
            }
          }
          
          .gold-text-container {
            background: linear-gradient(45deg, #DAA520, #FFD700, #FFA500, #FFD700, #DAA520);
            background-size: 200% 100%;
            color: #000;
            font-weight: bold;
            position: relative;
            overflow: hidden;
            display: inline-block;
            padding: 8px 12px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
          }
          
          .gold-text-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
            animation: whiteShine 2s ease-in-out infinite;
          }
          
          .gold-text {
            position: relative;
            z-index: 1;
          }
        `}
      </style>

      {/* Header */}
      <header className="bg-gradient-to-r from-gray-800 via-gray-900 to-black backdrop-blur-md border-b-2 border-amber-600 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-amber-400 order-first p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </Button>

            {/* Logo */}
            <div className="flex items-center">
                <div className="relative">
                    {(currentUser?.role === 'admin' || currentUser?.vip_level === 'vip-3' || currentUser?.vip_level === 'vip-2') && (
                        <Crown className="absolute -top-2.5 left-0 w-5 h-5 text-amber-400 transform -rotate-12 z-20" />
                    )}
                    <div className="gold-text-container">
                        <h1 className="text-xl gold-text">
                            {currentUser?.first_name?.toUpperCase() || 'KULLANICI'}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Desktop Navigation - Only show if user has VIP access */}
            {hasVIPAccess() && (
              <nav className="hidden lg:flex space-x-1">
                {navigationItems.map((item) => {
                  if (!hasAccess(item.allowedRoles)) return null;
                  return (
                    <Link
                      key={item.title}
                      to={item.url}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                        location.pathname === item.url
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg'
                          : 'text-amber-400 hover:bg-gray-800 hover:text-amber-300'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}

                {/* Management Dropdown */}
                {(currentUser?.role === 'admin' || currentUser?.vip_level === 'vip-3' || currentUser?.vip_level === 'vip-2' || currentUser?.vip_level === 'vip-1') && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="px-4 py-2 text-sm font-medium text-amber-400 hover:bg-gray-800 hover:text-amber-300 flex items-center space-x-2"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Yönetim</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-gray-900 border-amber-600">
                      {managementItems.map((item) => {
                        if (!hasAccess(item.allowedRoles)) return null;
                        return (
                          <DropdownMenuItem key={item.title} asChild>
                            <Link
                              to={item.url}
                              className="flex items-center space-x-2 text-amber-400 hover:text-amber-300"
                            >
                              <item.icon className="w-4 h-4" />
                              <span>{item.title}</span>
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </nav>
            )}

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              {hasVIPAccess() && <NotificationCenter currentUser={currentUser} />}

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full text-amber-400 hover:bg-gray-800"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-3 p-2 rounded-full hover:bg-gray-800">
                    <div className="relative">
                      {currentUser?.profile_picture_url ? (
                        <img src={currentUser.profile_picture_url} alt="Profil" className="w-10 h-10 rounded-full object-cover border-2 border-amber-600" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-600 to-amber-400 flex items-center justify-center text-black font-bold">
                          {currentUser?.first_name?.charAt(0)}
                        </div>
                      )}
                      {(currentUser?.role === 'admin' || currentUser?.vip_level === 'vip-3' || currentUser?.vip_level === 'vip-2') && (
                        <Crown className="absolute -top-1 -right-1 w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-amber-400">
                        {currentUser?.first_name}
                      </div>
                      <div className="flex items-center space-x-1">
                        <VIPBadge role={currentUser?.role === 'admin' ? 'admin' : currentUser?.vip_level} size="sm" showCrown={false} />
                        <DayBadge level={currentUser?.level || 1} hireDate={currentUser?.hire_date} size="sm" />
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-gray-900 border-amber-600">
                  <div className="px-3 py-2">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        {currentUser?.profile_picture_url ? (
                          <img src={currentUser.profile_picture_url} alt="Profil" className="w-12 h-12 rounded-full object-cover border-2 border-amber-600" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-600 to-amber-400 flex items-center justify-center text-black font-bold text-lg">
                            {currentUser?.first_name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-400">
                          {currentUser?.first_name} {currentUser?.last_name}
                        </p>
                        <div className="flex flex-col space-y-1 mt-1">
                          <div className="flex items-center space-x-1">
                            <VIPBadge role={currentUser?.role === 'admin' ? 'admin' : currentUser?.vip_level} size="sm" />
                            <DayBadge level={currentUser?.level || 1} hireDate={currentUser?.hire_date} size="sm" />
                          </div>
                          <UserBadges badges={currentUser?.badges} size="sm" />
                        </div>
                        {currentUser?.company && (
                          <p className="text-xs text-amber-600 mt-1">
                            {currentUser.company}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="border-amber-600" />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("Profile")} className="flex items-center space-x-2 text-amber-400">
                      <Settings className="w-4 h-4" />
                      <span>Profil Ayarları</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="border-amber-600" />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:bg-red-500 hover:text-white">
                    <LogOut className="w-4 h-4 mr-2" />
                    Çıkış Yap
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Mobile Navigation - Only show if user has VIP access */}
        {isMobileMenuOpen && hasVIPAccess() && (
          <div className="lg:hidden bg-gray-900 border-t-2 border-amber-600 shadow-2xl">
            <div className="px-4 py-3 space-y-2">
              {navigationItems.map((item) => {
                if (!hasAccess(item.allowedRoles)) return null;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                      location.pathname === item.url
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg'
                        : 'text-amber-400 hover:bg-gray-800'
                    }`}
                  >
                    <item.icon className="w-6 h-6" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}

              {/* Mobile Management Section */}
              {(currentUser?.role === 'admin' || currentUser?.vip_level === 'vip-3' || currentUser?.vip_level === 'vip-2' || currentUser?.vip_level === 'vip-1') && (
                <div className="pt-3 mt-3 border-t-2 border-amber-600">
                  <div className="px-4 py-2 text-xs font-semibold text-amber-600 uppercase tracking-wider">
                    Yönetim
                  </div>
                  {managementItems.map((item) => {
                    if (!hasAccess(item.allowedRoles)) return null;
                    return (
                      <Link
                        key={item.title}
                        to={item.url}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-amber-400 hover:bg-gray-800 transition-all duration-200"
                      >
                        <item.icon className="w-6 h-6" />
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Announcements - Only show if user has VIP access */}
      {hasVIPAccess() && <AnnouncementBanner currentPageName={currentPageName} />}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}